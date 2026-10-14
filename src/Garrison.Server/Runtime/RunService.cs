namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Creates, cancels, retries, and waits on runs. Thread-safe.
    /// </summary>
    public class RunService
    {
        #region Public-Members

        /// <summary>
        /// Cancelled when the replica starts shutting down; synchronous waits then return the run as it is.
        /// Default <see cref="CancellationToken.None"/>.
        /// </summary>
        public CancellationToken ShutdownToken { get; set; } = CancellationToken.None;

        /// <summary>
        /// Statuses that end a run.
        /// </summary>
        public static readonly HashSet<RunStatusEnum> TerminalStatuses = new HashSet<RunStatusEnum>
        {
            RunStatusEnum.Succeeded,
            RunStatusEnum.Failed,
            RunStatusEnum.Cancelled,
            RunStatusEnum.TimedOut,
            RunStatusEnum.Rejected
        };

        /// <summary>
        /// Permission approvals (P12.3); pending approvals of runs that stop here are cancelled. Null (the default)
        /// leaves them to the leader's sweep.
        /// </summary>
        public ApprovalService? Approvals { get; set; } = null;

        /// <summary>
        /// Logging for run lifecycle lines (each carries run=&lt;runId&gt; trace=&lt;traceId&gt;). Null disables them.
        /// Default null; the runtime module sets it.
        /// </summary>
        public LoggingModule? Logging
        {
            get
            {
                return _Logging;
            }
            set
            {
                _Logging = value;
            }
        }

        /// <summary>
        /// Conversation service. When null, conversation fields on a creation request are ignored. Default null; the
        /// runtime module sets it.
        /// </summary>
        public ConversationService? Conversations
        {
            get
            {
                return _Conversations;
            }
            set
            {
                _Conversations = value;
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private readonly GarrisonTelemetry _Telemetry;
        private LoggingModule? _Logging = null;
        private ConversationService? _Conversations = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunService(DatabaseDriverBase database, RunSignals signals, RuntimeOptions options, GarrisonTelemetry telemetry)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create and queue a run.
        /// </summary>
        /// <param name="create">Creation context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The queued run, or the existing run for a repeated idempotency key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when create is null.</exception>
        /// <exception cref="ValidationException">Thrown when the input or overrides are invalid.</exception>
        /// <exception cref="NotFoundException">Thrown when a requested deployment does not exist for the agent.</exception>
        /// <exception cref="ConflictException">Thrown when delegation depth is exceeded, or with NoActiveDeployment when the agent has no active deployment with a weight above zero.</exception>
        /// <exception cref="IdempotencyConflictException">Thrown when the idempotency key belongs to a run with different content.</exception>
        /// <exception cref="ConflictException">Thrown with ConversationBusy when the requested conversation's previous turn is unfinished, or with ConversationAgentMismatch, ConversationDeploymentMismatch, or ConversationDeploymentUnavailable.</exception>
        public async Task<Run> CreateAsync(RunCreateContext create, CancellationToken token = default)
        {
            if (create == null) throw new ArgumentNullException(nameof(create));
            if (String.IsNullOrEmpty(create.TenantId)) throw new ValidationException("A tenant is required.");
            if (create.Agent == null || String.IsNullOrEmpty(create.Agent.Id)) throw new ValidationException("An agent is required.");
            if (!create.Agent.Active) throw new ConflictException("AgentInactive", "Agent " + create.Agent.Name + " is inactive.");
            if (create.Agent.Kind != AgentKindEnum.Hosted) throw new ConflictException("RemoteAgentNotSupported", "Invoking remote agents is not available yet (plan Phase 12).");

            if (!String.IsNullOrEmpty(create.IdempotencyKey))
            {
                Run? existing = await _Database.Runs.ReadByIdempotencyKeyAsync(create.TenantId, create.CallerId, create.IdempotencyKey, token).ConfigureAwait(false);
                if (existing != null) return IdempotentRetry(create, existing);
            }

            // A conversation turn runs on the conversation's deployment (P12.1).
            ConversationTurnPlan? plan = _Conversations != null ? await _Conversations.ResolveAsync(create, token).ConfigureAwait(false) : null;

            Deployment deployment = await SelectDeploymentAsync(create, token).ConfigureAwait(false);
            HarnessProfile profile = await _Database.HarnessProfiles.ReadAsync(create.TenantId, deployment.HarnessProfileId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Harness profile " + deployment.HarnessProfileId + " for deployment " + deployment.Name + " was not found.");

            Run run = new Run();
            if (!String.IsNullOrEmpty(create.RunId)) run.Id = create.RunId;
            run.TenantId = create.TenantId;
            run.AgentId = create.Agent.Id;
            run.AgentName = create.Agent.Name;
            run.DeploymentId = deployment.Id;
            run.DeploymentVersion = deployment.ConfigVersion;
            run.HarnessType = profile.HarnessType;
            run.NodePoolId = deployment.NodePoolId;
            NodePool? pool = !deployment.Executor.HasValue && !String.IsNullOrEmpty(deployment.NodePoolId) ? await _Database.NodePools.ReadAsync(deployment.NodePoolId, token).ConfigureAwait(false) : null;
            ExecutorCapabilityRules.Admit(run, deployment, pool);
            // P12.29: the run keeps the policy it was admitted under; the lease reaper reads it from the run.
            run.EffectPolicy = deployment.EffectPolicy;
            run.Kind = create.Kind;
            run.Priority = create.Priority;
            run.InputText = create.Input ?? String.Empty;
            run.InputContentType = String.IsNullOrEmpty(create.InputContentType) ? "text/plain" : create.InputContentType;
            run.CallerType = create.CallerType;
            run.CallerId = create.CallerId;
            run.CallerName = create.CallerName;
            run.IdempotencyKey = create.IdempotencyKey;
            run.RetryOfRunId = create.RetryOfRunId;
            run.PipelineRunId = create.PipelineRunId;
            run.PipelinePosition = create.PipelinePosition;
            run.PipelineExecution = create.PipelineExecution;
            run.MaxAttempts = deployment.MaxAttempts;
            run.Attempt = 1;

            if (create.Parent != null)
            {
                run.ParentRunId = create.Parent.Id;
                run.RootRunId = create.Parent.RootRunId ?? create.Parent.Id;
                run.Depth = create.Parent.Depth + 1;
                run.CallChain = (String.IsNullOrEmpty(create.Parent.CallChain) ? create.Parent.AgentName : create.Parent.CallChain) + "," + create.Agent.Name;
                if (run.Depth > _Options.MaxDelegationDepth)
                {
                    throw new ConflictException("DelegationDepthExceeded", "Delegation depth " + run.Depth + " exceeds the cluster maximum of " + _Options.MaxDelegationDepth + ".");
                }
            }
            else
            {
                run.CallChain = create.Agent.Name;
            }

            foreach (KeyValuePair<string, string> parameter in ValidateOverrides(deployment, create.Parameters))
            {
                RunParameter p = new RunParameter();
                p.Name = parameter.Key;
                p.Value = parameter.Value;
                run.Parameters.Add(p);
            }

            foreach (DeploymentNodeSelector selector in deployment.NodeSelector)
            {
                RunRequirement requirement = new RunRequirement();
                requirement.Key = selector.Key;
                requirement.Value = selector.Value;
                run.Requirements.Add(requirement);
            }

            run.Status = RunStatusEnum.Queued;
            run.QueuedUtc = DateTime.UtcNow;

            // One trace per run (P13.16): delegated runs join their parent run's trace; other runs join the current
            // request span or start a new trace.
            string? parentTraceParent = create.Parent?.TraceParent;
            using (Activity? activity = RunTracing.Start("run:create", parentTraceParent))
            {
                run.TraceParent = RunTracing.TraceParentFor(activity, parentTraceParent);
                run.TraceId = RunTracing.TraceIdOf(run.TraceParent);
                if (activity != null)
                {
                    activity.SetTag("garrison.run_id", run.Id);
                    activity.SetTag("garrison.agent", run.AgentName);
                    activity.SetTag("garrison.harness", run.HarnessType.ToString());
                    activity.SetTag("garrison.run_kind", run.Kind.ToString());
                    if (!String.IsNullOrEmpty(run.ParentRunId)) activity.SetTag("garrison.parent_run_id", run.ParentRunId);
                }
                if (plan != null) await _Conversations!.BeginTurnAsync(plan, run, deployment, profile, create.Surface, token).ConfigureAwait(false);
                Run stored;
                try
                {
                    stored = await _Database.Runs.CreateAsync(run, token).ConfigureAwait(false);
                }
                catch (Exception)
                {
                    if (plan != null) await _Conversations!.ReleaseTurnAsync(plan, run, CancellationToken.None).ConfigureAwait(false);
                    throw;
                }

                // A retry with the same key that raced this one (possibly on another replica) created the run first.
                if (!String.Equals(stored.Id, run.Id, StringComparison.Ordinal))
                {
                    if (plan != null) await _Conversations!.ReleaseTurnAsync(plan, run, CancellationToken.None).ConfigureAwait(false);
                    return IdempotentRetry(create, stored);
                }
                if (plan != null) await _Conversations!.TurnCreatedAsync(plan, run, token).ConfigureAwait(false);
            }

            _Logging?.Info("[Runs] run " + run.Id + " queued for agent " + run.AgentName + " (" + run.Kind + ", " + run.HarnessType + (String.IsNullOrEmpty(run.ParentRunId) ? String.Empty : ", parent " + run.ParentRunId) + ") " + RunTracing.LogFields(run.Id, run.TraceId)
                + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName, "deployment", deployment.Name));

            RunTelemetry.Created(run, deployment.Name);
            _Signals.NotifyQueue();
            return run;
        }

        /// <summary>
        /// Request cancellation. Queued runs cancel immediately; leased and running runs move to Cancelling and the
        /// worker holding the run is woken through its cancellation watch (the heartbeat is the fallback). Delegated
        /// child runs that have not finished are cancelled too, and their children in turn.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="ConflictException">Thrown when the run already finished.</exception>
        public async Task<Run> CancelAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            return await CancelAsync(run, "request", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Cancel a stage run on behalf of its pipeline run (P12.9): the pipeline run was cancelled or timed out, or the run
        /// was left behind under a finished pipeline run. Delegated child runs are cancelled too. Does nothing and returns
        /// false when the run already finished; never throws for a run that finished meanwhile.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a cancellation was requested.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<bool> CancelForPipelineAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (TerminalStatuses.Contains(run.Status) || run.Status == RunStatusEnum.Cancelling) return false;
            try
            {
                await CancelAsync(run, "pipeline", token).ConfigureAwait(false);
            }
            catch (ConflictException)
            {
                return false;
            }
            _Logging?.Info("[Runs] cancelled run " + run.Id + " with its pipeline run " + run.PipelineRunId + " " + RunTracing.LogFields(run.Id, run.TraceId));
            return true;
        }

        /// <summary>
        /// Cancel a run because its caller went away (client disconnect, cancelled MCP request, closed MCP session).
        /// Does nothing when the run already finished. Never throws for a run that finished meanwhile.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="reason">Why the run is cancelled, for the log.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a cancellation was requested.</returns>
        public async Task<bool> CancelAbandonedAsync(string tenantId, string runId, string reason, CancellationToken token = default)
        {
            Run? current = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
            if (current == null || TerminalStatuses.Contains(current.Status)) return false;
            try
            {
                await CancelAsync(current, "disconnect", token).ConfigureAwait(false);
            }
            catch (ConflictException)
            {
                return false;
            }
            _Logging?.Info("[Runs] cancelled run " + runId + " because " + reason + " " + RunTracing.LogFields(runId, current.TraceId));
            return true;
        }

        private async Task<Run> CancelAsync(Run run, string reason, CancellationToken token)
        {
            if (TerminalStatuses.Contains(run.Status)) throw new ConflictException("RunFinished", "Run " + run.Id + " already finished with status " + run.Status + ".");
            Run updated = await CancelOneAsync(run, reason, token).ConfigureAwait(false);
            await CancelChildrenAsync(run, 0, token).ConfigureAwait(false);
            return updated;
        }

        private async Task<Run> CancelOneAsync(Run run, string reason, CancellationToken token)
        {

            RunTransition queued = new RunTransition();
            queued.RunId = run.Id;
            queued.FromStatuses.Add(RunStatusEnum.Queued);
            queued.FromStatuses.Add(RunStatusEnum.Pending);
            queued.ToStatus = RunStatusEnum.Cancelled;
            queued.Outcome = RunOutcomeEnum.Cancelled;
            queued.SetCompleted = true;
            queued.CancelRequested = true;
            bool finished = await _Database.Runs.TransitionAsync(queued, token).ConfigureAwait(false);
            if (finished)
            {
                run.Status = RunStatusEnum.Cancelled;
                run.Outcome = RunOutcomeEnum.Cancelled;
                run.CompletedUtc = DateTime.UtcNow;
                await RunTelemetry.FinishedAsync(_Database, run, token).ConfigureAwait(false);
            }
            else
            {
                RunTransition active = new RunTransition();
                active.RunId = run.Id;
                active.FromStatuses.Add(RunStatusEnum.Leased);
                active.FromStatuses.Add(RunStatusEnum.Running);
                active.ToStatus = RunStatusEnum.Cancelling;
                active.CancelRequested = true;
                await _Database.Runs.TransitionAsync(active, token).ConfigureAwait(false);
            }

            // A queued run is finished now, so its completion waiters wake too; an active run finishes when its worker reports.
            if (finished) _Signals.Complete(run.Id);
            else _Signals.Notify(run.Id);
            if (Approvals != null) await Approvals.CancelPendingAsync(run.Id, "The run was cancelled.", token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.RunCancellations, "tenant", run.TenantId, "agent", run.AgentName, "reason", reason);
            _Logging?.Info("[Runs] cancellation requested for run " + run.Id + " " + RunTracing.LogFields(run.Id, run.TraceId) + " " + GarrisonTracing.LogFields("tenant", run.TenantId, "agent", run.AgentName));
            Run? updated = await _Database.Runs.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            _Signals.NotifyNode(updated?.LeaseNodeId ?? run.LeaseNodeId);
            return updated ?? run;
        }

        private async Task CancelChildrenAsync(Run parent, int depth, CancellationToken token)
        {
            // Delegation depth is capped at 10, so the recursion is bounded; the depth check guards against bad data.
            if (depth > 16) return;
            RunFilter filter = new RunFilter();
            filter.TenantId = parent.TenantId;
            filter.ParentRunId = parent.Id;
            filter.MaxResults = 1000;
            EnumerationResult<Run> children = await _Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            foreach (Run child in children.Objects)
            {
                if (child.Id == parent.Id) continue;
                if (!TerminalStatuses.Contains(child.Status))
                {
                    await CancelOneAsync(child, "parent", token).ConfigureAwait(false);
                    _Logging?.Info("[Runs] cancelled delegated run " + child.Id + " with its parent " + parent.Id + " " + RunTracing.LogFields(child.Id, child.TraceId));
                }
                await CancelChildrenAsync(child, depth + 1, token).ConfigureAwait(false);
            }
        }

        /// <summary>
        /// Create a new run that repeats a finished run's input and parameters.
        /// </summary>
        /// <param name="original">Finished run.</param>
        /// <param name="callerType">Caller type.</param>
        /// <param name="callerId">Caller identifier.</param>
        /// <param name="callerName">Caller name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when original is null.</exception>
        /// <exception cref="ConflictException">Thrown with RunNotFinished when the run has not finished, PipelineStageRun when it is a pipeline stage run, AgentDeleted when its agent was deleted, or DeploymentDeleted when its deployment was deleted.</exception>
        public async Task<Run> RetryAsync(Run original, PrincipalTypeEnum callerType, string? callerId, string? callerName, CancellationToken token = default)
        {
            if (original == null) throw new ArgumentNullException(nameof(original));
            if (!TerminalStatuses.Contains(original.Status)) throw new ConflictException("RunNotFinished", "Only finished runs can be retried.");
            if (!String.IsNullOrEmpty(original.PipelineRunId))
            {
                // A stage run is retried by its pipeline (stage maxAttempts, or POST pipeline-runs/{id}/retry), so the
                // pipeline keeps track of which execution counts (P12.9).
                throw new ConflictException("PipelineStageRun", "Run " + original.Id + " is stage " + original.PipelinePosition + " of pipeline run " + original.PipelineRunId + ". Retry the pipeline run instead (POST /v1.0/api/tenants/" + original.TenantId + "/pipeline-runs/" + original.PipelineRunId + "/retry).");
            }

            Agent agent = await _Database.Agents.ReadAsync(original.TenantId, original.AgentId, token).ConfigureAwait(false)
                ?? throw new ConflictException("AgentDeleted", "Run " + original.Id + " cannot be retried because the agent " + original.AgentName + " was deleted.");
            if (!String.IsNullOrEmpty(original.DeploymentId) && await _Database.Deployments.ReadAsync(original.TenantId, original.DeploymentId, token).ConfigureAwait(false) == null)
            {
                throw new ConflictException("DeploymentDeleted", "Run " + original.Id + " cannot be retried because its deployment " + original.DeploymentId + " was deleted. Invoke agent " + original.AgentName + " again instead.");
            }

            RunCreateContext create = new RunCreateContext();
            create.TenantId = original.TenantId;
            create.Agent = agent;
            create.DeploymentId = original.DeploymentId;
            create.Input = original.InputText ?? String.Empty;
            create.InputContentType = original.InputContentType;
            foreach (RunParameter parameter in original.Parameters) create.Parameters[parameter.Name] = parameter.Value;
            create.Priority = original.Priority;
            create.Kind = RunKindEnum.Retry;
            create.CallerType = callerType;
            create.CallerId = callerId;
            create.CallerName = callerName;
            create.RetryOfRunId = original.Id;
            // Retrying a conversation turn asks the same conversation again (a new turn), so it is refused with
            // ConversationBusy while another turn is unfinished.
            if (!String.IsNullOrEmpty(original.ConversationId) && _Conversations != null && await _Database.Conversations.ExistsAsync(original.ConversationId, token).ConfigureAwait(false))
            {
                create.ConversationId = original.ConversationId;
            }
            return await CreateAsync(create, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Wait until a run finishes or the timeout elapses, then return its latest state.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="waitSeconds">Maximum wait in seconds (0 to 600).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run, or null when it no longer exists.</returns>
        public async Task<Run?> WaitAsync(string tenantId, string runId, int waitSeconds, CancellationToken token = default)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(Math.Clamp(waitSeconds, 0, 600));
            using (RunSignalSubscription signal = _Signals.SubscribeCompletion(runId))
            {
                while (true)
                {
                    Run? run = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
                    if (run == null || TerminalStatuses.Contains(run.Status)) return run;
                    int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                    if (remaining <= 0) return run;
                    if (ShutdownToken.IsCancellationRequested) return run;
                    using (CancellationTokenSource wait = CancellationTokenSource.CreateLinkedTokenSource(token, ShutdownToken))
                    {
                        try
                        {
                            await signal.WaitAsync(Math.Min(remaining, _Options.InvocationWaitPollMs), wait.Token).ConfigureAwait(false);
                        }
                        catch (OperationCanceledException) when (ShutdownToken.IsCancellationRequested && !token.IsCancellationRequested)
                        {
                            // The replica is draining: answer with the run as it is; the caller polls it elsewhere.
                            return run;
                        }
                    }
                }
            }
        }

        /// <summary>
        /// Whether a status is terminal.
        /// </summary>
        /// <param name="status">Status.</param>
        /// <returns>True when terminal.</returns>
        public static bool IsTerminal(RunStatusEnum status)
        {
            return TerminalStatuses.Contains(status);
        }

        #endregion

        #region Private-Methods

        private static Run IdempotentRetry(RunCreateContext create, Run existing)
        {
            // Same key and same content is a safe retry; the same key with different content is a mistake.
            bool sameContent = existing.AgentId == create.Agent.Id && String.Equals(existing.InputText ?? String.Empty, create.Input ?? String.Empty, StringComparison.Ordinal);
            if (sameContent) return existing;
            string key = create.IdempotencyKey ?? String.Empty;
            string shown = key.StartsWith("a2a:", StringComparison.Ordinal) ? key.Substring(4) : key;
            throw new IdempotencyConflictException(shown, existing.Id,
                "Idempotency key " + shown + " was already used for run " + existing.Id + " with different content. Use a new key for a new request; resend identical content to get the existing run.");
        }

        private async Task<Deployment> SelectDeploymentAsync(RunCreateContext create, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(create.DeploymentId))
            {
                Deployment? chosen = await _Database.Deployments.ReadAsync(create.TenantId, create.DeploymentId, token).ConfigureAwait(false);
                if (chosen == null || chosen.AgentId != create.Agent.Id) throw new NotFoundException("Deployment " + create.DeploymentId + " was not found for agent " + create.Agent.Name + ". Omit deploymentId to use the agent's default routing.");
                if (!chosen.Active) throw new ConflictException("DeploymentInactive", "Deployment " + chosen.Name + " is inactive.");
                return chosen;
            }

            List<Deployment> candidates = new List<Deployment>();
            int skip = 0;
            while (true)
            {
                EnumerationQuery query = new EnumerationQuery();
                query.MaxResults = 1000;
                query.Skip = skip;
                query.ActiveOnly = true;
                EnumerationResult<Deployment> page = await _Database.Deployments.EnumerateAsync(create.TenantId, query, token).ConfigureAwait(false);
                candidates.AddRange(page.Objects.Where(d => d.AgentId == create.Agent.Id && d.Active && d.Weight > 0));
                if (page.EndOfResults || page.Objects.Count == 0) break;
                skip += page.Objects.Count;
            }

            if (candidates.Count == 0)
            {
                throw new ConflictException("NoActiveDeployment", "Agent " + create.Agent.Name + " has no active deployment with a weight above zero, so it cannot run. Create a deployment for it, or activate one and give it a weight above zero.");
            }
            if (candidates.Count == 1) return candidates[0];

            int total = candidates.Sum(d => d.Weight);
            int pick = RandomNumberGenerator.GetInt32(total);
            foreach (Deployment candidate in candidates)
            {
                if (pick < candidate.Weight) return candidate;
                pick -= candidate.Weight;
            }
            return candidates[candidates.Count - 1];
        }

        private static Dictionary<string, string> ValidateOverrides(Deployment deployment, Dictionary<string, string>? requested)
        {
            Dictionary<string, string> accepted = new Dictionary<string, string>(StringComparer.Ordinal);
            if (requested == null || requested.Count == 0) return accepted;

            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            List<string> names = new List<string>();
            foreach (KeyValuePair<string, string> parameter in requested)
            {
                DeploymentRunOverrideRule? rule = deployment.AllowedRunOverrides.FirstOrDefault(r => String.Equals(r.Name, parameter.Key, StringComparison.Ordinal));
                if (rule == null)
                {
                    errors["parameters." + parameter.Key] = "Deployment " + deployment.Name + " does not allow overriding " + parameter.Key + ".";
                    codes["parameters." + parameter.Key] = "ParameterNotAllowed";
                    names.Add(parameter.Key);
                    continue;
                }

                string value = parameter.Value ?? String.Empty;
                string? problem = Check(rule, value);
                if (problem != null)
                {
                    errors["parameters." + parameter.Key] = "Parameter " + parameter.Key + ": " + problem;
                    codes["parameters." + parameter.Key] = "ParameterInvalid";
                    names.Add(parameter.Key);
                }
                else accepted[parameter.Key] = value;
            }

            if (errors.Count > 0)
            {
                throw new ValidationException("Run parameter" + (names.Count == 1 ? " " : "s ") + String.Join(", ", names) + (names.Count == 1 ? " is" : " are") + " not allowed for deployment " + deployment.Name + ": " + String.Join(" ", errors.Values), errors, codes);
            }
            return accepted;
        }

        private static string? Check(DeploymentRunOverrideRule rule, string value)
        {
            switch (rule.Validation)
            {
                case RunOverrideValidationEnum.Enum:
                    List<string> allowed = (rule.Pattern ?? String.Empty).Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                    return allowed.Contains(value) ? null : "Value must be one of: " + String.Join(", ", allowed) + ".";
                case RunOverrideValidationEnum.Regex:
                    try
                    {
                        return Regex.IsMatch(value, "^(?:" + (rule.Pattern ?? ".*") + ")$", RegexOptions.None, TimeSpan.FromMilliseconds(250)) ? null : "Value does not match the allowed pattern.";
                    }
                    catch (RegexMatchTimeoutException)
                    {
                        return "Value could not be validated in time.";
                    }
                case RunOverrideValidationEnum.IntegerRange:
                    string[] parts = (rule.Pattern ?? String.Empty).Split(',', StringSplitOptions.TrimEntries);
                    if (!Int64.TryParse(value, out long number)) return "Value must be an integer.";
                    if (parts.Length == 2 && Int64.TryParse(parts[0], out long min) && Int64.TryParse(parts[1], out long max) && (number < min || number > max)) return "Value must be between " + min + " and " + max + ".";
                    return null;
                default:
                    return value.Length > 65536 ? "Value is too long." : null;
            }
        }

        #endregion
    }
}
