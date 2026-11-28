namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Shadow trials (AA9.7, AA-027): a sampled share of the runs a source deployment finishes is copied to a candidate
    /// deployment of the same agent as runs of kind Shadow, and each shadow run's output is compared with its source's.
    /// The source run is never touched: the copy is made after it finished, off the completion path, and every failure of
    /// the copy is logged and dropped. A shadow run has no caller to answer, no conversation, trigger, pipeline, app,
    /// mandate, or parent, and its run token refuses every effect (see <see cref="ShadowRunPolicy"/>). Its cost is
    /// recorded on the shadow run like any run's, so it counts toward the agent's spend and org budgets; list a trial's
    /// runs with the shadowTrialId run filter to see what the trial cost. Thread-safe.
    /// </summary>
    public class ShadowTrialService
    {
        #region Public-Members

        /// <summary>
        /// Compares a shadow run's output with its source's. Default <see cref="NormalizedTextShadowComparer"/>; the
        /// runtime module sets <see cref="EvalSetShadowComparer"/>, which scores with the trial's comparison eval set and
        /// judge and falls back to normalized text. Setting null restores the default. A comparer that throws leaves the
        /// shadow run uncounted (logged as a warning, comparison metric result error).
        /// </summary>
        public IShadowComparer Comparer
        {
            get
            {
                return _Comparer;
            }
            set
            {
                _Comparer = value ?? new NormalizedTextShadowComparer();
            }
        }

        /// <summary>
        /// Most running trials one sweep reads. Minimum 1, maximum 10000, default 500.
        /// </summary>
        public int SweepBatchSize
        {
            get
            {
                return _SweepBatchSize;
            }
            set
            {
                _SweepBatchSize = Math.Clamp(value, 1, 10000);
            }
        }

        /// <summary>
        /// Priority of shadow runs, from -100 to 100 (values outside are clamped). Default -100, the lowest, so shadow
        /// runs never go ahead of real work in the queue.
        /// </summary>
        public int ShadowPriority
        {
            get
            {
                return _ShadowPriority;
            }
            set
            {
                _ShadowPriority = Math.Clamp(value, -100, 100);
            }
        }

        /// <summary>
        /// Clock used for trial end times. Default the system clock; tests set a manual one.
        /// </summary>
        public TimeProvider Clock
        {
            get
            {
                return _Clock;
            }
            set
            {
                _Clock = value ?? TimeProvider.System;
            }
        }

        /// <summary>
        /// Number of copy and compare jobs started after a run finished that have not completed yet.
        /// </summary>
        public long Pending
        {
            get
            {
                return Interlocked.Read(ref _InFlight);
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _Header = "[ShadowTrials] ";
        private readonly ServerContext _Server;
        private readonly RunService _Runs;
        private IShadowComparer _Comparer = new NormalizedTextShadowComparer();
        private int _SweepBatchSize = 500;
        private int _ShadowPriority = -100;
        private TimeProvider _Clock = TimeProvider.System;
        private long _InFlight = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="runs">Run service the shadow runs are created through.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ShadowTrialService(ServerContext server, RunService runs)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Enumerate the tenant's trials, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="sourceDeploymentId">Source deployment filter, or null.</param>
        /// <param name="candidateDeploymentId">Candidate deployment filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when query is null.</exception>
        public async Task<EnumerationResult<ShadowTrial>> EnumerateAsync(string tenantId, string? sourceDeploymentId, string? candidateDeploymentId, ShadowTrialStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));
            return await _Server.Database.ShadowTrials.EnumerateAsync(tenantId, Blank(sourceDeploymentId), Blank(candidateDeploymentId), status, query, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a trial of the tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Trial identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Trial.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant has no such trial (another tenant's trial included).</exception>
        public async Task<ShadowTrial> ReadAsync(string tenantId, string? id, CancellationToken token = default)
        {
            return (String.IsNullOrWhiteSpace(id) ? null : await _Server.Database.ShadowTrials.ReadAsync(tenantId, id.Trim(), token).ConfigureAwait(false))
                ?? throw new NotFoundException("Shadow trial not found.");
        }

        /// <summary>
        /// Start a trial. Only people start trials. The candidate must be another active deployment of the source's agent,
        /// and the caller must be allowed to execute that agent, since the trial starts runs of it.
        /// </summary>
        /// <param name="ctx">Authorized caller (ShadowTrial Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Trial: sourceDeploymentId and candidateDeploymentId (identifiers or names), samplePercent, optional name, endsUtc, comparisonEvalSetId, useJudge.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored trial; samplePercent outside 1 to 100 is clamped and the clamp is echoed in Warnings.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or body is null.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 PeopleOnly for a run token, or Forbidden when the caller may not execute the agent.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with ShadowTrialAlreadyRunning when the pair already has a running trial.</exception>
        public async Task<ShadowTrial> CreateAsync(RequestContext ctx, string tenantId, ShadowTrial body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (body == null) throw new ArgumentNullException(nameof(body));
            PeopleOnly(ctx, "start a shadow trial");
            string? name = String.IsNullOrWhiteSpace(body.Name) ? null : body.Name.Trim();
            if (name != null && name.Length > 128) throw Invalid("name", "TooLong", "name is at most 128 characters.");
            Deployment source = await FindDeploymentAsync(tenantId, body.SourceDeploymentId, token).ConfigureAwait(false)
                ?? throw Invalid("sourceDeploymentId", "DeploymentNotFound", "sourceDeploymentId names no deployment in this tenant.");
            Deployment candidate = await FindDeploymentAsync(tenantId, body.CandidateDeploymentId, token).ConfigureAwait(false)
                ?? throw Invalid("candidateDeploymentId", "DeploymentNotFound", "candidateDeploymentId names no deployment in this tenant.");
            if (source.Id == candidate.Id) throw Invalid("candidateDeploymentId", "SameDeployment", "The candidate must be a different deployment from the source.");
            if (source.AgentId != candidate.AgentId) throw Invalid("candidateDeploymentId", "DifferentAgent", "The candidate must be a deployment of the source's agent.");
            if (!candidate.Active) throw Invalid("candidateDeploymentId", "DeploymentInactive", "Deployment " + candidate.Name + " is inactive.");
            if (!String.IsNullOrWhiteSpace(body.AgentId) && body.AgentId.Trim() != source.AgentId) throw Invalid("agentId", "AgentMismatch", "agentId must be the source deployment's agent, or left out.");
            if (body.EndsUtc.HasValue && body.EndsUtc.Value <= _Clock.GetUtcNow().UtcDateTime) throw Invalid("endsUtc", "EndsInPast", "endsUtc must be in the future, or left out to run until stopped.");
            string? evalSetId = String.IsNullOrWhiteSpace(body.ComparisonEvalSetId) ? null : body.ComparisonEvalSetId.Trim();
            EvalSet? comparisonSet = evalSetId == null ? null : await _Server.Database.EvalSets.ReadAsync(tenantId, evalSetId, token).ConfigureAwait(false);
            if (evalSetId != null && comparisonSet == null)
                throw Invalid("comparisonEvalSetId", "EvalSetNotFound", "comparisonEvalSetId names no eval set in this tenant.");
            if (body.UseJudge || comparisonSet != null)
            {
                // A judge comparison runs the set's judge agent; check it exists now rather than failing every comparison.
                bool judged = body.UseJudge;
                if (comparisonSet != null && !judged)
                {
                    List<EvalCase> cases = await _Server.Database.EvalCases.ListBySetAsync(tenantId, comparisonSet.Id, token).ConfigureAwait(false);
                    judged = cases.SelectMany(c => c.Checks).Any(c => c.Scorer == EvalScorerEnum.Judge);
                }
                if (judged)
                {
                    if (comparisonSet == null) throw Invalid("useJudge", "JudgeAgentRequired", "useJudge runs the comparison eval set's judge agent; set comparisonEvalSetId to an eval set with a judgeAgent.");
                    if (String.IsNullOrWhiteSpace(comparisonSet.JudgeAgent)) throw Invalid("comparisonEvalSetId", "JudgeAgentRequired", "Eval set " + comparisonSet.Name + " has no judgeAgent, but the comparison needs a judge (useJudge, or the set's Judge checks); set its judgeAgent.");
                    Agent? judgeAgent = await _Server.Database.Agents.ReadAsync(tenantId, comparisonSet.JudgeAgent, token).ConfigureAwait(false)
                        ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, comparisonSet.JudgeAgent, token).ConfigureAwait(false);
                    if (judgeAgent == null) throw Invalid("comparisonEvalSetId", "JudgeAgentNotFound", "Judge agent " + comparisonSet.JudgeAgent + " of eval set " + comparisonSet.Name + " was not found.");
                }
            }
            AuthorizationDecision execute = await _Server.Authorization.AuthorizeAsync(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, source.AgentId, token).ConfigureAwait(false);
            if (!execute.Permitted) throw new AppAccessException(403, "Forbidden", "Starting a shadow trial runs the agent, which needs Agent.Execute: " + execute.Reason);
            List<ShadowTrial> running = await _Server.Database.ShadowTrials.ListRunningBySourceDeploymentAsync(tenantId, source.Id, token).ConfigureAwait(false);
            ShadowTrial? duplicate = running.FirstOrDefault(t => t.CandidateDeploymentId == candidate.Id);
            if (duplicate != null) throw new ConflictException("ShadowTrialAlreadyRunning", "Deployment " + candidate.Name + " is already shadowing " + source.Name + " in trial " + duplicate.Id + ".");

            ShadowTrial trial = new ShadowTrial();
            trial.TenantId = tenantId;
            trial.Name = name;
            trial.AgentId = source.AgentId;
            trial.SourceDeploymentId = source.Id;
            trial.CandidateDeploymentId = candidate.Id;
            trial.SamplePercent = body.SamplePercent;
            trial.EndsUtc = body.EndsUtc;
            trial.ComparisonEvalSetId = evalSetId;
            trial.UseJudge = body.UseJudge;
            trial.Status = ShadowTrialStatusEnum.Running;
            trial.CreatedByType = ctx.PrincipalType;
            trial.CreatedById = ctx.UserId ?? ctx.CredentialId;
            trial.CreatedByName = ctx.PrincipalName;
            await _Server.Database.ShadowTrials.CreateAsync(trial, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "ShadowTrial", trial.Id, "Started shadow trial " + trial.Id + ": " + trial.SamplePercent + " percent of deployment " + source.Name + "'s runs copied to " + candidate.Name + (trial.EndsUtc.HasValue ? " until " + trial.EndsUtc.Value.ToString("u", System.Globalization.CultureInfo.InvariantCulture) : String.Empty) + ".", tenantId, token).ConfigureAwait(false);
            _Server.Logging.Info(_Header + "trial " + trial.Id + " started: " + source.Name + " to " + candidate.Name + " at " + trial.SamplePercent + " percent");
            ShadowTrial stored = await ReadAsync(tenantId, trial.Id, token).ConfigureAwait(false);
            // The body's ValueClamped warnings (samplePercent outside 1 to 100) are echoed in the create response.
            stored.AddWarnings(body.Warnings);
            return stored;
        }

        /// <summary>
        /// Stop a running trial. Shadow runs already started finish and are still compared. Only people stop trials.
        /// </summary>
        /// <param name="ctx">Authorized caller (ShadowTrial Update).</param>
        /// <param name="trial">Trial (read in the caller's tenant).</param>
        /// <param name="reason">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stopped trial.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or trial is null.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 PeopleOnly for a run token.</exception>
        /// <exception cref="ValidationException">Thrown when the reason is too long.</exception>
        /// <exception cref="ConflictException">Thrown with ShadowTrialNotRunning when the trial already ended.</exception>
        public async Task<ShadowTrial> StopAsync(RequestContext ctx, ShadowTrial trial, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (trial == null) throw new ArgumentNullException(nameof(trial));
            PeopleOnly(ctx, "stop a shadow trial");
            string text = String.IsNullOrWhiteSpace(reason) ? "Stopped by " + (ctx.PrincipalName ?? "a person") + "." : reason.Trim();
            if (text.Length > 2000) throw Invalid("reason", "TooLong", "reason is at most 2000 characters.");
            if (!await _Server.Database.ShadowTrials.TransitionAsync(trial.TenantId, trial.Id, ShadowTrialStatusEnum.Running, ShadowTrialStatusEnum.Stopped, text, token).ConfigureAwait(false))
                throw new ConflictException("ShadowTrialNotRunning", "Shadow trial " + trial.Id + " is " + trial.Status + ", not Running.");
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "ShadowTrial", trial.Id, "Stopped shadow trial " + trial.Id + ": " + text, trial.TenantId, token).ConfigureAwait(false);
            return await ReadAsync(trial.TenantId, trial.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Called when a run finishes. Returns at once; the copy or comparison runs in the background, so the finishing
        /// run is never delayed and never fails because of a trial. A succeeded run of a source deployment is copied to
        /// each running trial's candidate when it falls in the sample; a finished shadow run is compared with its source.
        /// </summary>
        /// <param name="run">The finished run.</param>
        public void OnRunFinished(Run? run)
        {
            if (run == null || String.IsNullOrEmpty(run.TenantId)) return;
            if (ShadowRunPolicy.IsShadow(run))
            {
                if (!String.IsNullOrEmpty(run.ShadowTrialId)) Start(ct => CompareAsync(run, ct));
                return;
            }
            if (!Copyable(run)) return;
            Start(ct => CopyAsync(run, ct));
        }

        /// <summary>
        /// Wait until the background copy and compare jobs started so far have finished. Used by tests and shutdown.
        /// </summary>
        /// <param name="timeoutMs">Longest wait in milliseconds. Minimum 0.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when nothing is pending.</returns>
        public async Task<bool> DrainAsync(int timeoutMs, CancellationToken token = default)
        {
            Stopwatch watch = Stopwatch.StartNew();
            while (Pending > 0)
            {
                if (watch.ElapsedMilliseconds >= Math.Max(0, timeoutMs)) return false;
                await Task.Delay(20, token).ConfigureAwait(false);
            }
            return true;
        }

        /// <summary>
        /// Copy one finished source run to the running trials of its deployment that sample it. Public so a sweep or a
        /// test can drive it directly; <see cref="OnRunFinished"/> calls it in the background.
        /// </summary>
        /// <param name="source">Finished source run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Shadow runs created (an existing copy is not counted again).</returns>
        /// <exception cref="ArgumentNullException">Thrown when source is null.</exception>
        public async Task<int> CopyAsync(Run source, CancellationToken token = default)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (!Copyable(source)) return 0;
            List<ShadowTrial> trials = await _Server.Database.ShadowTrials.ListRunningBySourceDeploymentAsync(source.TenantId, source.DeploymentId, token).ConfigureAwait(false);
            if (trials.Count == 0) return 0;
            DateTime now = _Clock.GetUtcNow().UtcDateTime;
            Agent? agent = null;
            int created = 0;
            foreach (ShadowTrial trial in trials)
            {
                token.ThrowIfCancellationRequested();
                if (trial.EndsUtc.HasValue && trial.EndsUtc.Value <= now) continue;
                if (!ShadowSampling.Sampled(trial.Id, source.Id, trial.SamplePercent)) continue;
                agent ??= await _Server.Database.Agents.ReadAsync(source.TenantId, source.AgentId, token).ConfigureAwait(false);
                if (agent == null) return created;
                string key = ShadowSampling.IdempotencyKey(trial.Id, source.Id);
                if (await _Server.Database.Runs.ReadByIdempotencyKeyAsync(source.TenantId, trial.CreatedById, key, token).ConfigureAwait(false) != null) continue;
                try
                {
                    Run shadow = await CreateShadowAsync(trial, agent, source, key, true, token).ConfigureAwait(false);
                    created++;
                    _Server.Logging.Debug(_Header + "trial " + trial.Id + " copied run " + source.Id + " to shadow run " + shadow.Id);
                }
                catch (Exception e) when (e is ConflictException || e is ValidationException || e is NotFoundException || e is ArgumentException)
                {
                    _Server.Logging.Debug(_Header + "trial " + trial.Id + " did not copy run " + source.Id + ": " + e.Message);
                }
            }
            return created;
        }

        /// <summary>
        /// Compare one finished shadow run with its source run and record the result on its trial: a shadow run that did
        /// not succeed counts as a candidate failure; otherwise the comparer decides agreed or diverged. Public so a test
        /// can drive it directly; <see cref="OnRunFinished"/> calls it in the background.
        /// </summary>
        /// <param name="shadow">Finished shadow run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The comparison, or null when nothing was recorded (no trial, or the source run is gone).</returns>
        /// <exception cref="ArgumentNullException">Thrown when shadow is null.</exception>
        public async Task<ShadowComparison?> CompareAsync(Run shadow, CancellationToken token = default)
        {
            if (shadow == null) throw new ArgumentNullException(nameof(shadow));
            if (!ShadowRunPolicy.IsShadow(shadow) || String.IsNullOrEmpty(shadow.ShadowTrialId)) return null;
            using (Activity? span = GarrisonTracing.Start("shadow compare", ActivityKind.Internal))
            {
                span?.SetTag("garrison.tenant", shadow.TenantId);
                try
                {
                    ShadowTrial? trial = await _Server.Database.ShadowTrials.ReadAsync(shadow.TenantId, shadow.ShadowTrialId, token).ConfigureAwait(false);
                    if (trial == null)
                    {
                        GarrisonTracing.Ok(span);
                        return null;
                    }
                    if (shadow.Status != RunStatusEnum.Succeeded)
                    {
                        await _Server.Database.ShadowTrials.IncrementCountsAsync(trial.TenantId, trial.Id, 0, 0, 0, 1, token).ConfigureAwait(false);
                        GarrisonMetrics.Count(GarrisonMetricCatalog.ShadowComparisons, "result", "candidate_failed");
                        GarrisonTracing.Ok(span);
                        return new ShadowComparison(false, "The shadow run ended " + shadow.Status + ".");
                    }
                    string? sourceId = ShadowSampling.SourceRunId(shadow);
                    Run? source = sourceId == null ? null : await _Server.Database.Runs.ReadAsync(shadow.TenantId, sourceId, token).ConfigureAwait(false);
                    if (source == null)
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.ShadowComparisons, "result", "error");
                        GarrisonTracing.Fail(span, "The source run of shadow run " + shadow.Id + " is gone.");
                        return null;
                    }
                    ShadowComparisonRequest request = new ShadowComparisonRequest(trial, ShadowSampling.Output(source), ShadowSampling.Output(shadow));
                    request.Input = source.InputText;
                    request.SourceRunId = source.Id;
                    request.ShadowRunId = shadow.Id;
                    ShadowComparison comparison = await _Comparer.CompareAsync(request, token).ConfigureAwait(false)
                        ?? new ShadowComparison(false, "The comparer returned nothing.");
                    await _Server.Database.ShadowTrials.IncrementCountsAsync(trial.TenantId, trial.Id, 1, comparison.Agreed ? 1 : 0, comparison.Agreed ? 0 : 1, 0, token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.ShadowComparisons, "result", comparison.Agreed ? "agreed" : "diverged");
                    _Server.Logging.Debug(_Header + "trial " + trial.Id + " shadow run " + shadow.Id + " " + (comparison.Agreed ? "agreed with" : "diverged from") + " run " + source.Id + ": " + comparison.Note);
                    GarrisonTracing.Ok(span);
                    return comparison;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.ShadowComparisons, "result", "error");
                    GarrisonTracing.Fail(span, e);
                    throw;
                }
            }
        }

        /// <summary>
        /// End every running trial whose end time has passed (Completed), and fail every running trial whose source or
        /// candidate deployment was deleted or made inactive (Failed, with the reason in StopReason). Called by the leader's
        /// maintenance loop; each change is a compare-and-set on Running.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a trial ended.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            DateTime now = _Clock.GetUtcNow().UtcDateTime;
            bool changed = false;
            foreach (ShadowTrial trial in await _Server.Database.ShadowTrials.ListRunningAsync(_SweepBatchSize, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                string? broken = await BrokenReasonAsync(trial, token).ConfigureAwait(false);
                if (broken != null)
                {
                    // A trial whose source or candidate is gone or inactive cannot compare anything more.
                    if (await _Server.Database.ShadowTrials.TransitionAsync(trial.TenantId, trial.Id, ShadowTrialStatusEnum.Running, ShadowTrialStatusEnum.Failed, broken, token).ConfigureAwait(false))
                    {
                        changed = true;
                        await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "ShadowTrial", trial.Id, "Shadow trial " + trial.Id + " failed: " + broken, trial.TenantId, token).ConfigureAwait(false);
                        _Server.Logging.Warn(_Header + "trial " + trial.Id + " failed: " + broken);
                    }
                    continue;
                }
                if (!trial.EndsUtc.HasValue || trial.EndsUtc.Value > now) continue;
                // Compare-and-set on Running: a stop or another replica's sweep that won leaves this a no-op.
                if (await _Server.Database.ShadowTrials.TransitionAsync(trial.TenantId, trial.Id, ShadowTrialStatusEnum.Running, ShadowTrialStatusEnum.Completed, "Reached its end time.", token).ConfigureAwait(false))
                {
                    changed = true;
                    await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "ShadowTrial", trial.Id, "Shadow trial " + trial.Id + " completed at its end time.", trial.TenantId, token).ConfigureAwait(false);
                    _Server.Logging.Info(_Header + "trial " + trial.Id + " completed at its end time");
                }
            }
            return changed;
        }

        #endregion

        #region Private-Methods

        private async Task<string?> BrokenReasonAsync(ShadowTrial trial, CancellationToken token)
        {
            Deployment? source = await _Server.Database.Deployments.ReadAsync(trial.TenantId, trial.SourceDeploymentId, token).ConfigureAwait(false);
            if (source == null) return "The source deployment " + trial.SourceDeploymentId + " was deleted.";
            if (!source.Active) return "The source deployment " + source.Name + " is inactive.";
            Deployment? candidate = await _Server.Database.Deployments.ReadAsync(trial.TenantId, trial.CandidateDeploymentId, token).ConfigureAwait(false);
            if (candidate == null) return "The candidate deployment " + trial.CandidateDeploymentId + " was deleted.";
            if (!candidate.Active) return "The candidate deployment " + candidate.Name + " is inactive.";
            return null;
        }

        private static bool Copyable(Run run)
        {
            // Only real work is copied: not shadow, eval, playground, or test runs, and not a later conversation turn,
            // whose input means nothing without the turns before it.
            if (run.Status != RunStatusEnum.Succeeded) return false;
            if (run.Kind == RunKindEnum.Shadow || run.Kind == RunKindEnum.Eval || run.Kind == RunKindEnum.Playground || run.Kind == RunKindEnum.Test) return false;
            if (!String.IsNullOrEmpty(run.ConversationId) && run.ConversationTurn > 1) return false;
            return !String.IsNullOrEmpty(run.DeploymentId) && !String.IsNullOrEmpty(run.AgentId);
        }

        private async Task<Run> CreateShadowAsync(ShadowTrial trial, Agent agent, Run source, string key, bool withParameters, CancellationToken token)
        {
            RunCreateContext create = new RunCreateContext();
            create.TenantId = source.TenantId;
            create.Agent = agent;
            create.DeploymentId = trial.CandidateDeploymentId;
            create.Input = source.InputText ?? String.Empty;
            create.InputContentType = source.InputContentType;
            create.Kind = RunKindEnum.Shadow;
            create.Priority = _ShadowPriority;
            // The person who started the trial is the caller, so the shadow run's token is checked against them.
            create.CallerType = trial.CreatedByType;
            create.CallerId = trial.CreatedById;
            create.CallerName = trial.CreatedByName;
            create.IdempotencyKey = key;
            create.ShadowTrialId = trial.Id;
            create.ShadowOfRunId = source.Id;
            create.Surface = "shadow";
            if (withParameters)
            {
                foreach (RunParameter parameter in source.Parameters) create.Parameters[parameter.Name] = parameter.Value;
            }
            try
            {
                return await _Runs.CreateAsync(create, token).ConfigureAwait(false);
            }
            catch (ValidationException) when (withParameters && create.Parameters.Count > 0)
            {
                // The candidate may not allow the source's run parameters; the input alone is still a fair comparison.
                return await CreateShadowAsync(trial, agent, source, key, false, token).ConfigureAwait(false);
            }
        }

        private void Start(Func<CancellationToken, Task> work)
        {
            Interlocked.Increment(ref _InFlight);
            CancellationToken stopping = _Server.Stopping;
            _ = Task.Run(async () =>
            {
                try
                {
                    await work(stopping).ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                }
                catch (Exception e)
                {
                    _Server.Logging.Warn(_Header + "background job failed: " + e.Message);
                }
                finally
                {
                    Interlocked.Decrement(ref _InFlight);
                }
            });
        }

        private async Task<Deployment?> FindDeploymentAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            string value = idOrName.Trim();
            return await _Server.Database.Deployments.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await _Server.Database.Deployments.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
        }

        private static string? Blank(string? value)
        {
            return String.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private static void PeopleOnly(RequestContext ctx, string what)
        {
            // AA-027: an agent never starts or stops the trials that test it.
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw new AppAccessException(403, "PeopleOnly", "Only people and API credentials " + what + "; a run token cannot.");
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            return new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
        }

        #endregion
    }
}
