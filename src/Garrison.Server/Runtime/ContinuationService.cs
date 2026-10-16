namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Templates;
    using Garrison.Server.Services;

    /// <summary>Fenced suspension and cross-node resume. Only complete, compatible checkpoints release a lease.</summary>
    public class ContinuationService
    {
        private readonly DatabaseDriverBase _Database;
        private readonly AdoDatabaseDriver _Ado;
        private readonly ArtifactService _Artifacts;
        private readonly string _ApiBaseUrl;
        private readonly RunSignals _Signals;

        /// <summary>Render an approved continuation prompt through a saved PromptTemplate. Required before resuming.</summary>
        public Func<Run, CancellationToken, Task<string>>? ResumePrompt { get; set; } = null;

        /// <summary>Revoke externally brokered credentials after the fenced checkpoint commits; null when no provider is configured.</summary>
        public Func<Run, long, CancellationToken, Task>? OnSuspended { get; set; } = null;

        /// <summary>Construct continuation coordination.</summary>
        /// <param name="database">Database.</param><param name="artifacts">Artifact service.</param><param name="apiBaseUrl">Worker-reachable REST base URL.</param><param name="signals">Run signals.</param>
        public ContinuationService(DatabaseDriverBase database, ArtifactService artifacts, string apiBaseUrl, RunSignals signals)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Ado = database as AdoDatabaseDriver ?? throw new ArgumentException("Continuation requires relational persistence.", nameof(database));
            _Artifacts = artifacts ?? throw new ArgumentNullException(nameof(artifacts));
            _ApiBaseUrl = apiBaseUrl.TrimEnd('/');
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            ResumePrompt = RenderPromptAsync;
        }

        /// <summary>Accept a fully uploaded stopped-harness checkpoint and release the lease. Returns false for normal completion.</summary>
        /// <param name="run">Current fenced run.</param><param name="request">Worker report.</param><param name="token">Cancellation token.</param><returns>Whether suspension was accepted.</returns>
        public async Task<bool> AcceptAsync(Run run, RunCompleteRequest request, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "checkpoint_accept", ct => AcceptMeasuredCoreAsync(run, request, token), token).ConfigureAwait(false);
        }

        private async Task<bool> AcceptMeasuredCoreAsync(Run run, RunCompleteRequest request, CancellationToken token)
        {
            if (request.Status != RunStatusEnum.Suspended) return false;
            Deployment deployment = await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false) ?? throw new NotFoundException("Deployment not found.");
            HarnessProfile profile = await _Database.HarnessProfiles.ReadAsync(run.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false) ?? throw new NotFoundException("Harness profile not found.");
            if (!deployment.SuspensionEnabled || run.Executor != RunExecutorEnum.Process || !profile.SupportsResume || String.IsNullOrEmpty(profile.SessionFormat)
                || profile.SessionFormat != request.SessionFormat || String.IsNullOrEmpty(request.SessionId) || run.CancelRequested)
                throw new ConflictException("ContinuationUnsupported", "The deployment cannot accept this session checkpoint.");
            Artifact artifact = await _Database.Artifacts.ReadAsync(run.TenantId, request.SnapshotArtifactId ?? String.Empty, token).ConfigureAwait(false) ?? throw new NotFoundException("Checkpoint artifact not found.");
            if (artifact.RunId != run.Id || artifact.LeaseEpoch != request.Epoch || artifact.Name != ".garrison/continuation.zip") throw new ConflictException("CheckpointMismatch", "Checkpoint does not belong to this execution.");
            if (await _Database.EffectOperations.HasUncertainAsync(run.TenantId, run.Id, request.Epoch, token).ConfigureAwait(false)) throw new ConflictException("UncertainEffect", "An effect has an unknown outcome; suspension is unsafe.");
            string checkpoints = _Ado.Table("run_checkpoints");
            bool accepted = false;
            await _Ado.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Ado.Table("runs") + " SET lastupdateutc=lastupdateutc WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND leasenodeid=@node AND leaseexpiresutc>@now AND status IN ('Running','Leased') AND cancelrequested=" + _Ado.Dialect.BooleanLiteral(false),
                    command => { AdoDatabaseDriver.Add(command, "run", run.Id); AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "epoch", request.Epoch); AdoDatabaseDriver.Add(command, "node", request.NodeId); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow); }, ct).ConfigureAwait(false);
                if (held != 1) throw new ConflictException("StaleLease", "Checkpoint lease no longer belongs to this node.");
                List<string> boundaries = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT id FROM " + _Ado.Table("approvals") + " WHERE tenantid=@tenant AND runid=@run AND leaseepoch=@epoch AND (status='Pending' OR decisionsource IN ('User','Timeout')) UNION ALL SELECT w.id FROM " + _Ado.Table("run_child_waits") + " w JOIN " + _Ado.Table("runs") + " p ON p.id=w.parentrunid AND p.tenantid=w.tenantid WHERE w.tenantid=@tenant AND w.parentrunid=@run AND p.leaseepoch=@epoch AND p.leasedutc IS NOT NULL AND w.createdutc>=p.leasedutc;",
                    command => { AdoDatabaseDriver.Add(command, "run", run.Id); AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "epoch", request.Epoch); }, reader => AdoConverters.Str(reader, "id"), ct).ConfigureAwait(false);
                if (boundaries.Count == 0)
                {
                    // The marker can occur in user text or tool output. Without a persisted wait it has no protocol authority.
                    request.Status = RunStatusEnum.Succeeded;
                    if (request.CompletedUtc == default) request.CompletedUtc = DateTime.UtcNow;
                    return;
                }
                int changed = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Ado.Table("runs") + " SET status = @suspended, leasenodeid = NULL, leaseexpiresutc = NULL, deadlineutc = NULL, sessionid = @session, resumesessionid = @session, affinitynodeid = NULL, inputtokens = inputtokens + @input, outputtokens = outputtokens + @output, cachedtokens = cachedtokens + @cached, reasoningtokens = reasoningtokens + @reasoning, toolcallcount = toolcallcount + @tools, costusd = CASE WHEN costusd IS NULL AND @hascost = " + _Ado.Dialect.BooleanLiteral(false) + " THEN NULL ELSE COALESCE(costusd,0) + @cost END, costestimated = costestimated OR @estimated, executionms = COALESCE(executionms,0) + @execution, streamingms = COALESCE(streamingms,0) + @streaming, firsttokenutc = COALESCE(firsttokenutc,@firsttoken), lasttokenutc = @lasttoken WHERE id = @run AND tenantid = @tenant AND leaseepoch = @epoch AND leasenodeid = @node AND status IN (@running, @leased) AND cancelrequested = " + _Ado.Dialect.BooleanLiteral(false) + ";",
                    command => { AdoDatabaseDriver.Add(command, "suspended", RunStatusEnum.Suspended.ToString()); AdoDatabaseDriver.Add(command, "session", request.SessionId); AdoDatabaseDriver.Add(command, "run", run.Id); AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "epoch", request.Epoch); AdoDatabaseDriver.Add(command, "node", request.NodeId); AdoDatabaseDriver.Add(command, "running", RunStatusEnum.Running.ToString()); AdoDatabaseDriver.Add(command, "leased", RunStatusEnum.Leased.ToString()); AdoDatabaseDriver.Add(command, "input", request.InputTokens); AdoDatabaseDriver.Add(command, "output", request.OutputTokens); AdoDatabaseDriver.Add(command, "cached", request.CachedTokens); AdoDatabaseDriver.Add(command, "reasoning", request.ReasoningTokens); AdoDatabaseDriver.Add(command, "tools", request.ToolCallCount); AdoDatabaseDriver.Add(command, "hascost", request.CostUsd.HasValue); AdoDatabaseDriver.Add(command, "cost", request.CostUsd ?? 0); AdoDatabaseDriver.Add(command, "estimated", request.CostEstimated); AdoDatabaseDriver.Add(command, "execution", request.ExecutionMs ?? 0); AdoDatabaseDriver.Add(command, "streaming", request.StreamingMs ?? 0); AdoDatabaseDriver.Add(command, "firsttoken", request.FirstTokenUtc); AdoDatabaseDriver.Add(command, "lasttoken", request.LastTokenUtc); }, ct).ConfigureAwait(false);
                if (changed == 0) throw new ConflictException("StaleLease", "Checkpoint lease no longer belongs to this node.");
                List<string> uncertain = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT id FROM " + _Ado.Table("effect_operations") + " WHERE tenantid = @tenant AND runid = @run AND state IN ('Dispatched','Unknown');",
                    command => { AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "run", run.Id); }, reader => AdoConverters.Str(reader, "id"), ct).ConfigureAwait(false);
                if (uncertain.Count > 0) throw new ConflictException("UncertainEffect", "A dispatched effect has an unknown outcome; checkpoint was rolled back.");
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + checkpoints + " WHERE runid = @run AND tenantid = @tenant;", command => { AdoDatabaseDriver.Add(command, "run", run.Id); AdoDatabaseDriver.Add(command, "tenant", run.TenantId); }, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + checkpoints + " (runid,tenantid,artifactid,sessionid,sessionformat,epoch,createdutc) VALUES (@run,@tenant,@artifact,@session,@format,@epoch,@created);",
                    command => { AdoDatabaseDriver.Add(command, "run", run.Id); AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "artifact", artifact.Id); AdoDatabaseDriver.Add(command, "session", request.SessionId); AdoDatabaseDriver.Add(command, "format", request.SessionFormat); AdoDatabaseDriver.Add(command, "epoch", request.Epoch); AdoDatabaseDriver.Add(command, "created", DateTime.UtcNow); }, ct).ConfigureAwait(false);
                accepted = true;
            }, token).ConfigureAwait(false);
            if (!accepted) return false;
            await _Database.Sessions.RevokeByRunAsync(run.Id, "Run suspended.", token).ConfigureAwait(false);
            if (OnSuspended != null) await OnSuspended(run, request.Epoch, token).ConfigureAwait(false);
            _Signals.Notify(run.Id);
            // A decision may race the checkpoint upload; do not leave an already-decided run suspended forever.
            await ResumeAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            return accepted;
        }

        /// <summary>Whether a run has prior checkpointed execution usage to accumulate into the next report.</summary>
        /// <param name="run">Current run.</param><param name="token">Cancellation token.</param><returns>True when an earlier execution checkpoint exists.</returns>
        public async Task<bool> HasCheckpointAsync(Run run, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "checkpoint_read", ct => HasCheckpointMeasuredCoreAsync(run, token), token).ConfigureAwait(false);
        }

        private async Task<bool> HasCheckpointMeasuredCoreAsync(Run run, CancellationToken token)
        {
            return await ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false) != null;
        }

        /// <summary>Populate the pinned session identifier before compilation.</summary>
        /// <param name="run">Run being claimed.</param><param name="token">Cancellation token.</param><returns>Task.</returns>
        public async Task PrepareAsync(Run run, CancellationToken token)
        {
            await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "continuation_prepare", ct => PrepareMeasuredCoreAsync(run, token), token).ConfigureAwait(false);
        }

        private async Task PrepareMeasuredCoreAsync(Run run, CancellationToken token)
        {
            RunCheckpoint? checkpoint = await ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            if (checkpoint != null)
            {
                run.ResumeSessionId = checkpoint.SessionId;
                if (ResumePrompt == null) throw new ConflictException("ContinuationPromptMissing", "No continuation prompt renderer is configured.");
                run.ContinuationPrompt = await ResumePrompt(run, token).ConfigureAwait(false);
            }
        }

        /// <summary>Attach a fresh signed download ticket and replace the prompt through the configured template renderer.</summary>
        /// <param name="run">Run being claimed.</param><param name="spec">Compiled spec.</param><param name="token">Cancellation token.</param><returns>Task.</returns>
        public async Task ApplyAsync(Run run, ExecutionSpec spec, CancellationToken token)
        {
            await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "continuation_apply", ct => ApplyMeasuredCoreAsync(run, spec, token), token).ConfigureAwait(false);
        }

        private async Task ApplyMeasuredCoreAsync(Run run, ExecutionSpec spec, CancellationToken token)
        {
            if (spec.Workspace.CacheKey != null && spec.Artifacts != null)
            {
                Artifact? prepared = await _Ado.QuerySingleAsync("SELECT id FROM " + _Ado.Table("artifacts") + " WHERE tenantid = @tenant AND artifactstoreid = @store AND name = @name ORDER BY createdutc DESC;",
                    command => { AdoDatabaseDriver.Add(command, "tenant", run.TenantId); AdoDatabaseDriver.Add(command, "store", spec.Artifacts.StoreId); AdoDatabaseDriver.Add(command, "name", ".garrison/prepared-" + spec.Workspace.CacheKey + ".zip"); }, reader => new Artifact { Id = AdoConverters.Str(reader, "id") }, token).ConfigureAwait(false);
                if (prepared != null)
                {
                    prepared = await _Database.Artifacts.ReadAsync(run.TenantId, prepared.Id, token).ConfigureAwait(false);
                    if (prepared != null)
                    {
                        string preparedTicket = _Artifacts.Ticket(prepared, out DateTime ignored);
                        spec.Workspace.DownloadUrl = _ApiBaseUrl + "/v1.0/artifact-download/" + Uri.EscapeDataString(prepared.Id) + "?ticket=" + Uri.EscapeDataString(preparedTicket);
                        spec.Workspace.Sha256 = prepared.Sha256;
                    }
                }
            }
            RunCheckpoint? checkpoint = await ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            if (checkpoint == null) return;
            if (spec.Continuation == null || spec.Continuation.SessionFormat != checkpoint.SessionFormat) throw new ConflictException("SessionFormatMismatch", "The current harness does not accept the pinned checkpoint format.");
            Artifact artifact = await _Database.Artifacts.ReadAsync(run.TenantId, checkpoint.ArtifactId, token).ConfigureAwait(false) ?? throw new NotFoundException("Checkpoint artifact missing.");
            string ticket = _Artifacts.Ticket(artifact, out DateTime unused);
            spec.Continuation.DownloadUrl = _ApiBaseUrl + "/v1.0/artifact-download/" + Uri.EscapeDataString(artifact.Id) + "?ticket=" + Uri.EscapeDataString(ticket);
            spec.Continuation.Sha256 = artifact.Sha256;
            spec.Continuation.SessionId = checkpoint.SessionId;
            if (ResumePrompt == null) throw new ConflictException("ContinuationPromptMissing", "No continuation prompt template renderer is configured.");
            // Prompt delivery was resolved by the compiler from the transient continuation prompt.
            if (spec.Conversation != null) spec.Conversation.Resume = true;
        }

        /// <summary>Requeue a suspended run after every approval has resolved; idempotent across replicas.</summary>
        /// <param name="tenantId">Tenant.</param><param name="runId">Run.</param><param name="token">Cancellation token.</param><returns>Whether it was requeued.</returns>
        public async Task<bool> ResumeAsync(string tenantId, string runId, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, tenantId, runId, "continuation_resume", ct => ResumeMeasuredCoreAsync(tenantId, runId, token), token).ConfigureAwait(false);
        }

        private async Task<bool> ResumeMeasuredCoreAsync(string tenantId, string runId, CancellationToken token)
        {
            Run? run = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
            if (run == null || run.Status != RunStatusEnum.Suspended || run.PendingApprovals > 0 || run.CancelRequested) return false;
            List<string> waiting = await _Ado.QueryAsync("SELECT c.id FROM " + _Ado.Table("runs") + " c WHERE c.tenantid = @tenant AND c.parentrunid = @parent AND c.status NOT IN ('Succeeded','Failed','Cancelled','TimedOut','Rejected');",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "parent", runId); }, reader => AdoConverters.Str(reader, "id"), token).ConfigureAwait(false);
            if (waiting.Count > 0) return false;
            List<string> uncreated = await _Ado.QueryAsync("SELECT w.childrunid FROM " + _Ado.Table("run_child_waits") + " w WHERE w.tenantid = @tenant AND w.parentrunid = @parent AND NOT EXISTS (SELECT 1 FROM " + _Ado.Table("runs") + " c WHERE c.id = w.childrunid);",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "parent", runId); }, reader => AdoConverters.Str(reader, "childrunid"), token).ConfigureAwait(false);
            if (uncreated.Count > 0) return false;
            RunTransition transition = new RunTransition { RunId = runId, FromStatuses = new System.Collections.Generic.List<RunStatusEnum> { RunStatusEnum.Suspended }, ToStatus = RunStatusEnum.Queued, ClearLease = true, SetQueued = true };
            bool queued = await _Database.Runs.TransitionAsync(transition, token).ConfigureAwait(false);
            if (queued)
            {
                run.Status = RunStatusEnum.Queued;
                _Signals.Notify(runId);
                _Signals.NotifyQueue(run);
            }
            return queued;
        }

        /// <summary>Render the persisted instruction asking a harness to finish at its checkpoint boundary.</summary>
        /// <param name="run">Parent execution.</param><param name="reason">Machine wait kind, such as Approval or Child.</param><param name="token">Cancellation token.</param><returns>Instruction containing the exact checkpoint marker.</returns>
        public async Task<string> WaitInstructionAsync(Run run, string reason, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Database, run.TenantId, run.Id, "continuation_wait", ct => WaitInstructionMeasuredCoreAsync(run, reason, token), token).ConfigureAwait(false);
        }

        private async Task<string> WaitInstructionMeasuredCoreAsync(Run run, string reason, CancellationToken token)
        {
            PromptTemplate template = await TemplateAsync(run.TenantId, "continuation-wait", token).ConfigureAwait(false);
            TemplateContext context = new TemplateContext();
            context.Set("continuation.reason", reason);
            string instruction = TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false });
            if (!instruction.Contains("GARRISON_CONTINUATION_WAIT", StringComparison.Ordinal)) throw new ConflictException("ContinuationMarkerMissing", "The continuation-wait template must retain its machine checkpoint marker.");
            return instruction;
        }

        /// <summary>Recheck suspended parents after orphan recovery, timeout, or missed cross-replica completion signals.</summary>
        /// <param name="token">Cancellation token.</param><returns>Whether any parent was requeued.</returns>
        public async Task<bool> SweepAsync(CancellationToken token)
        {
            List<Run> suspended = await _Ado.QueryAsync("SELECT id,tenantid FROM " + _Ado.Table("runs") + " WHERE status = 'Suspended' AND pendingapprovals = 0 ORDER BY lastupdateutc LIMIT 1000;", null,
                reader => new Run { Id = AdoConverters.Str(reader, "id"), TenantId = AdoConverters.Str(reader, "tenantid") }, token).ConfigureAwait(false);
            List<Artifact> expired = await _Ado.QueryAsync("SELECT a.id,a.tenantid FROM " + _Ado.Table("artifacts") + " a LEFT JOIN " + _Ado.Table("runs") + " r ON r.id = a.runid WHERE LOWER(a.name) LIKE '.garrison/%' AND (r.id IS NULL OR (a.name = '.garrison/continuation.zip' AND r.status IN ('Succeeded','Failed','Cancelled','TimedOut','Rejected'))) LIMIT 1000;", null,
                reader => new Artifact { Id = AdoConverters.Str(reader, "id"), TenantId = AdoConverters.Str(reader, "tenantid") }, token).ConfigureAwait(false);
            foreach (Artifact artifact in expired)
            {
                try
                {
                    Artifact? full = await _Database.Artifacts.ReadAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false);
                    if (full != null) await _Artifacts.DeleteAsync(full, token).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is IOException || ex is HttpRequestException || ex is UnauthorizedAccessException || ex is NotFoundException)
                {
                    // Retry storage cleanup on the next sweep without preventing eligible parents from resuming.
                }
            }
            bool changed = false;
            foreach (Run run in suspended) changed = await ResumeAsync(run.TenantId, run.Id, token).ConfigureAwait(false) || changed;
            return changed;
        }

        private async Task<PromptTemplate> TemplateAsync(string tenantId, string key, CancellationToken token)
        {
            PromptTemplate? tenant = await _Database.PromptTemplates.ReadByNameAsync(tenantId, key, token).ConfigureAwait(false);
            if (tenant != null && tenant.TenantId == tenantId && tenant.Active && tenant.Kind == PromptTemplateKindEnum.Task) return tenant;
            PromptTemplate builtin = await _Database.PromptTemplates.ReadByNameAsync(null, "builtin/" + key, token).ConfigureAwait(false) ?? throw new NotFoundException("Continuation template not found.");
            if (builtin.TenantId != null || !builtin.IsBuiltIn || builtin.BuiltInKey != key || !builtin.Active || builtin.Kind != PromptTemplateKindEnum.Task)
                throw new ConflictException("ContinuationTemplateInvalid", "The built-in continuation template is inactive or has an invalid identity or kind.");
            return builtin;
        }

        private async Task<string> RenderPromptAsync(Run run, CancellationToken token)
        {
            PromptTemplate template = await TemplateAsync(run.TenantId, "continuation-resume", token).ConfigureAwait(false);
            List<Approval> approvals = await _Database.Approvals.ListByRunAsync(run.Id, 10000, token).ConfigureAwait(false);
            List<object?> decisions = new List<object?>();
            foreach (Approval approval in approvals)
            {
                if (approval.TenantId != run.TenantId || !approval.Decision.HasValue) continue;
                decisions.Add(new Dictionary<string, object?> { ["approvalId"] = approval.Id, ["tool"] = approval.ToolName, ["decision"] = approval.Decision.Value.ToString(), ["reason"] = approval.Reason ?? String.Empty });
            }
            TemplateContext context = new TemplateContext();
            context.Set("continuation.decisions", decisions);
            List<object?> children = new List<object?>();
            RunFilter childFilter = new RunFilter { TenantId = run.TenantId, ParentRunId = run.Id, MaxResults = 1000, Ordering = Garrison.Core.Enums.EnumerationOrderEnum.CreatedAscending };
            while (true)
            {
                Garrison.Core.Enumeration.EnumerationResult<Run> childRuns = await _Database.Runs.EnumerateAsync(childFilter, token).ConfigureAwait(false);
                foreach (Run child in childRuns.Objects)
                    children.Add(new Dictionary<string, object?> { ["runId"] = child.Id, ["agent"] = child.AgentName, ["status"] = child.Status.ToString(), ["result"] = child.ResultText ?? String.Empty, ["error"] = child.ErrorMessage ?? String.Empty });
                if (childRuns.EndOfResults || childRuns.Objects.Count == 0) break;
                childFilter.Skip += childRuns.Objects.Count;
            }
            context.Set("continuation.children", children);
            context.Set("continuation.reason", children.Count > 0 ? "Child run results and approval decisions are available." : "Approval decisions are available.");
            return TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name, AllowSecrets = false });
        }

        private Task<RunCheckpoint?> ReadAsync(string tenantId, string runId, CancellationToken token)
        {
            return _Ado.QuerySingleAsync("SELECT runid,artifactid,sessionid,sessionformat FROM " + _Ado.Table("run_checkpoints") + " WHERE tenantid = @tenant AND runid = @run;",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "run", runId); }, reader => new RunCheckpoint { RunId = AdoConverters.Str(reader, "runid"), ArtifactId = AdoConverters.Str(reader, "artifactid"), SessionId = AdoConverters.Str(reader, "sessionid"), SessionFormat = AdoConverters.Str(reader, "sessionformat") }, token);
        }
    }
}
