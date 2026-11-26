namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Canary releases (AA9.8): an agent's traffic moves from a baseline deployment to a candidate in steps of deployment
    /// weight. Each step's percent becomes the candidate's weight (percent times 10) and the baseline gets the rest, on the
    /// 0 to 1000 deployment weight scale the run service picks deployments with (see <see cref="CanaryStepEvaluator"/>).
    /// The leader's sweep evaluates each running release: once the step has its minimum runs and minutes, and the
    /// candidate's eval score (when the release has an eval gate) is high enough, the release advances; after the last
    /// step it is promoted (candidate 1000, baseline 0). When the candidate's error rate or eval score crosses a threshold
    /// the release rolls back to the weights it started with and CanaryRolledBack is notified. Every move is a
    /// compare-and-set on the release's status or step index, so two replicas or a concurrent abort never apply weights
    /// twice.
    /// <para>
    /// An eval-gated step (evalSetId and minEvalScore) needs an eval run of the candidate on that set created since the
    /// step started. Once the step's minimums are met and it has none, the sweep starts one (target the candidate
    /// deployment, threshold minEvalScore) as the person who started the release, named canary:{releaseId}; later sweeps
    /// wait for it and then use its score. Eval runs anyone else starts on the same set and candidate during the step
    /// count too. A failed eval run, or one that cannot start (empty set, missing judge agent, the person lost Execute or
    /// is inactive), rolls the release back, since the gate cannot pass. Duplicates started by two replicas at once
    /// converge: every sweep keeps the oldest of the release's own pending or running eval runs and cancels the rest.
    /// Thread-safe.
    /// </para>
    /// </summary>
    public class CanaryService
    {
        #region Public-Members

        /// <summary>
        /// Most running releases one sweep evaluates. Minimum 1, maximum 10000, default 200.
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
        /// Most candidate runs read when a step is evaluated. Minimum 100, maximum 100000, default 5000. A step with more
        /// finished runs than this is judged on the newest ones.
        /// </summary>
        public int MaxRunsPerEvaluation
        {
            get
            {
                return _MaxRunsPerEvaluation;
            }
            set
            {
                _MaxRunsPerEvaluation = Math.Clamp(value, 100, 100000);
            }
        }

        /// <summary>
        /// Most steps a release may have. Minimum 1, maximum 20 (the model's limit), default 20.
        /// </summary>
        public int MaxSteps
        {
            get
            {
                return _MaxSteps;
            }
            set
            {
                _MaxSteps = Math.Clamp(value, 1, 20);
            }
        }

        /// <summary>
        /// Clock used for step times. Default the system clock; tests set a manual one.
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

        #endregion

        #region Private-Members

        private static readonly string _Header = "[Canary] ";
        private readonly ServerContext _Server;
        private int _SweepBatchSize = 200;
        private int _MaxRunsPerEvaluation = 5000;
        private int _MaxSteps = 20;
        private TimeProvider _Clock = TimeProvider.System;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public CanaryService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Enumerate the tenant's releases, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when query is null.</exception>
        public async Task<EnumerationResult<CanaryRelease>> EnumerateAsync(string tenantId, string? agentId, CanaryStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (query == null) throw new ArgumentNullException(nameof(query));
            return await _Server.Database.CanaryReleases.EnumerateAsync(tenantId, String.IsNullOrWhiteSpace(agentId) ? null : agentId.Trim(), status, query, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a release of the tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Release identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Release.</returns>
        /// <exception cref="NotFoundException">Thrown when the tenant has no such release (another tenant's included).</exception>
        public async Task<CanaryRelease> ReadAsync(string tenantId, string? id, CancellationToken token = default)
        {
            return (String.IsNullOrWhiteSpace(id) ? null : await _Server.Database.CanaryReleases.ReadAsync(tenantId, id.Trim(), token).ConfigureAwait(false))
                ?? throw new NotFoundException("Canary release not found.");
        }

        /// <summary>
        /// Start a release: record both deployments' weights and apply step one's. Only people start releases, and the
        /// caller must be allowed to update both deployments, since the release changes their weights.
        /// </summary>
        /// <param name="ctx">Authorized caller (CanaryRelease Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="body">Release: agentId, candidateDeploymentId, baselineDeploymentId (identifiers or names), steps, maxErrorRatePercent, optional minEvalScore with evalSetId.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or body is null.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 PeopleOnly for a run token, or Forbidden without Deployment.Update on both deployments.</exception>
        /// <exception cref="ValidationException">Thrown when a field is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with CanaryAlreadyRunning when the agent or a deployment already has a running release.</exception>
        public async Task<CanaryRelease> StartAsync(RequestContext ctx, string tenantId, CanaryRelease body, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (body == null) throw new ArgumentNullException(nameof(body));
            PeopleOnly(ctx, "start a canary release");
            Agent agent = await FindAgentAsync(tenantId, body.AgentId, token).ConfigureAwait(false)
                ?? throw Invalid("agentId", "AgentNotFound", "agentId names no agent in this tenant.");
            Deployment candidate = await FindDeploymentAsync(tenantId, body.CandidateDeploymentId, token).ConfigureAwait(false)
                ?? throw Invalid("candidateDeploymentId", "DeploymentNotFound", "candidateDeploymentId names no deployment in this tenant.");
            Deployment baseline = await FindDeploymentAsync(tenantId, body.BaselineDeploymentId, token).ConfigureAwait(false)
                ?? throw Invalid("baselineDeploymentId", "DeploymentNotFound", "baselineDeploymentId names no deployment in this tenant.");
            if (candidate.AgentId != agent.Id) throw Invalid("candidateDeploymentId", "DifferentAgent", "The candidate must be a deployment of agent " + agent.Name + ".");
            if (baseline.AgentId != agent.Id) throw Invalid("baselineDeploymentId", "DifferentAgent", "The baseline must be a deployment of agent " + agent.Name + ".");
            if (candidate.Id == baseline.Id) throw Invalid("candidateDeploymentId", "SameDeployment", "The candidate and the baseline must be different deployments.");
            if (!candidate.Active) throw Invalid("candidateDeploymentId", "DeploymentInactive", "Deployment " + candidate.Name + " is inactive.");
            if (!baseline.Active) throw Invalid("baselineDeploymentId", "DeploymentInactive", "Deployment " + baseline.Name + " is inactive.");
            ValidateSteps(body.Steps);
            string? evalSetId = String.IsNullOrWhiteSpace(body.EvalSetId) ? null : body.EvalSetId.Trim();
            if (body.MinEvalScore.HasValue != (evalSetId != null)) throw Invalid(evalSetId == null ? "evalSetId" : "minEvalScore", "EvalGateIncomplete", "An eval gate needs both evalSetId and minEvalScore, or neither.");
            if (evalSetId != null && await _Server.Database.EvalSets.ReadAsync(tenantId, evalSetId, token).ConfigureAwait(false) == null)
                throw Invalid("evalSetId", "EvalSetNotFound", "evalSetId names no eval set in this tenant.");
            foreach (Deployment deployment in new[] { candidate, baseline })
            {
                AuthorizationDecision update = await _Server.Authorization.AuthorizeAsync(ctx, tenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Update, deployment.Id, token).ConfigureAwait(false);
                if (!update.Permitted) throw new AppAccessException(403, "Forbidden", "A canary release changes the weight of deployment " + deployment.Name + ", which needs Deployment.Update: " + update.Reason);
            }
            foreach (Deployment deployment in new[] { candidate, baseline })
            {
                CanaryRelease? busy = await _Server.Database.CanaryReleases.ReadRunningForDeploymentAsync(tenantId, deployment.Id, token).ConfigureAwait(false);
                if (busy != null) throw new ConflictException("CanaryAlreadyRunning", "Deployment " + deployment.Name + " is already in running canary release " + busy.Id + ".");
            }

            DateTime now = _Clock.GetUtcNow().UtcDateTime;
            CanaryRelease release = new CanaryRelease();
            release.TenantId = tenantId;
            release.AgentId = agent.Id;
            release.CandidateDeploymentId = candidate.Id;
            release.BaselineDeploymentId = baseline.Id;
            release.CandidateInitialWeight = candidate.Weight;
            release.BaselineInitialWeight = baseline.Weight;
            release.Steps = body.Steps.Select(s => new CanaryReleaseStep { WeightPercent = s.WeightPercent, MinimumRuns = s.MinimumRuns, MinimumMinutes = s.MinimumMinutes }).ToList();
            release.CurrentStepIndex = 0;
            release.StepStartedUtc = now;
            release.MaxErrorRatePercent = body.MaxErrorRatePercent;
            release.MinEvalScore = body.MinEvalScore;
            release.EvalSetId = evalSetId;
            release.Status = CanaryStatusEnum.Running;
            release.CreatedByType = ctx.PrincipalType;
            release.CreatedById = ctx.UserId ?? ctx.CredentialId;
            release.CreatedByName = ctx.PrincipalName;
            await _Server.Database.CanaryReleases.CreateAsync(release, token).ConfigureAwait(false);
            await ApplyStepWeightsAsync(release, release.Steps[0].WeightPercent, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.CanaryTransitions, "result", "started");
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "CanaryRelease", release.Id, "Started canary release " + release.Id + " of agent " + agent.Name + ": " + candidate.Name + " against " + baseline.Name + " in " + release.Steps.Count + " steps (" + String.Join(", ", release.Steps.Select(s => s.WeightPercent + "%")) + "); initial weights " + candidate.Weight + " and " + baseline.Weight + ".", tenantId, token).ConfigureAwait(false);
            _Server.Logging.Info(_Header + "release " + release.Id + " started for agent " + agent.Name + " at " + release.Steps[0].WeightPercent + " percent");
            CanaryRelease stored = await ReadAsync(tenantId, release.Id, token).ConfigureAwait(false);
            // The body's ValueClamped warnings (maxErrorRatePercent, minEvalScore, each step's weightPercent) are echoed in
            // the create response.
            stored.AddWarnings(body.Warnings);
            for (int i = 0; i < body.Steps.Count; i++)
            {
                foreach (FieldWarning warning in body.Steps[i].Warnings ?? new List<FieldWarning>())
                {
                    stored.AddWarnings(new List<FieldWarning> { new FieldWarning("steps[" + i.ToString(CultureInfo.InvariantCulture) + "]." + warning.Field, warning.Code, warning.Given, warning.Stored, warning.Message) });
                }
            }
            return stored;
        }

        /// <summary>
        /// Abort a running release: its deployments go back to the weights they had when it started. Only people abort.
        /// </summary>
        /// <param name="ctx">Authorized caller (CanaryRelease Update).</param>
        /// <param name="release">Release (read in the caller's tenant).</param>
        /// <param name="reason">Why, at most 2000 characters, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The aborted release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or release is null.</exception>
        /// <exception cref="AppAccessException">Thrown with 403 PeopleOnly for a run token.</exception>
        /// <exception cref="ValidationException">Thrown when the reason is too long.</exception>
        /// <exception cref="ConflictException">Thrown with CanaryNotRunning when the release already ended.</exception>
        public async Task<CanaryRelease> AbortAsync(RequestContext ctx, CanaryRelease release, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (release == null) throw new ArgumentNullException(nameof(release));
            PeopleOnly(ctx, "abort a canary release");
            string text = String.IsNullOrWhiteSpace(reason) ? "Aborted by " + (ctx.PrincipalName ?? "a person") + "." : reason.Trim();
            if (text.Length > 2000) throw Invalid("reason", "TooLong", "reason is at most 2000 characters.");
            if (!await _Server.Database.CanaryReleases.TransitionAsync(release.TenantId, release.Id, CanaryStatusEnum.Running, CanaryStatusEnum.Aborted, text, token).ConfigureAwait(false))
                throw new ConflictException("CanaryNotRunning", "Canary release " + release.Id + " is " + release.Status + ", not Running.");
            await RestoreWeightsAsync(release, token).ConfigureAwait(false);
            GarrisonMetrics.Count(GarrisonMetricCatalog.CanaryTransitions, "result", "aborted");
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "CanaryRelease", release.Id, "Aborted canary release " + release.Id + " and restored weights " + release.CandidateInitialWeight + " and " + release.BaselineInitialWeight + ": " + text, release.TenantId, token).ConfigureAwait(false);
            return await ReadAsync(release.TenantId, release.Id, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Evaluate every running release once. Called by the leader's maintenance loop.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a release advanced, was promoted, or rolled back.</returns>
        public async Task<bool> SweepAsync(CancellationToken token = default)
        {
            bool changed = false;
            foreach (CanaryRelease release in await _Server.Database.CanaryReleases.ListRunningAsync(_SweepBatchSize, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    CanaryStepDecision decision = await EvaluateAsync(release, token).ConfigureAwait(false);
                    if (decision.Decision != CanaryDecisionEnum.Wait) changed = true;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Server.Logging.Warn(_Header + "release " + release.Id + " could not be evaluated: " + e.Message);
                }
            }
            return changed;
        }

        /// <summary>
        /// Evaluate one running release's current step and act on the decision. Only the call whose compare-and-set wins
        /// applies weights; a release that is no longer Running or has moved on is left alone and reported as Wait.
        /// </summary>
        /// <param name="release">Running release with its steps.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The decision that was applied.</returns>
        /// <exception cref="ArgumentNullException">Thrown when release is null.</exception>
        public async Task<CanaryStepDecision> EvaluateAsync(CanaryRelease release, CancellationToken token = default)
        {
            if (release == null) throw new ArgumentNullException(nameof(release));
            using (Activity? span = GarrisonTracing.Start("canary step", ActivityKind.Internal))
            {
                span?.SetTag("garrison.tenant", release.TenantId);
                span?.SetTag("garrison.canary.step", release.CurrentStepIndex + 1);
                try
                {
                    if (release.Status != CanaryStatusEnum.Running || release.Steps.Count == 0)
                    {
                        GarrisonTracing.Ok(span);
                        return new CanaryStepDecision(CanaryDecisionEnum.Wait, "The release is not running.");
                    }
                    DateTime now = _Clock.GetUtcNow().UtcDateTime;
                    DateTime from = release.StepStartedUtc ?? release.CreatedUtc;
                    CanaryWindowCount window = await CountWindowAsync(release, from, token).ConfigureAwait(false);
                    CanaryStepDecision decision = CanaryStepEvaluator.Evaluate(release, window.Finished, window.Failed, null, now);
                    bool gated = release.MinEvalScore.HasValue && !String.IsNullOrEmpty(release.EvalSetId);
                    if (gated && decision.Decision == CanaryDecisionEnum.Wait && CanaryStepEvaluator.StepReady(release, window.Finished, now))
                    {
                        // The step's minimums are met and only the eval gate is left: use the step's eval run, starting it
                        // when there is none yet.
                        decision = await StepEvalAsync(release, window, from, now, token).ConfigureAwait(false);
                    }
                    span?.SetTag("garrison.canary.decision", decision.Decision.ToString());
                    CanaryStepDecision applied = await ApplyAsync(release, decision, now, token).ConfigureAwait(false);
                    GarrisonTracing.Ok(span);
                    return applied;
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    GarrisonTracing.Fail(span, e);
                    throw;
                }
            }
        }

        #endregion

        #region Private-Methods

        private async Task<CanaryStepDecision> ApplyAsync(CanaryRelease release, CanaryStepDecision decision, DateTime now, CancellationToken token)
        {
            switch (decision.Decision)
            {
                case CanaryDecisionEnum.RollBack:
                    if (!await _Server.Database.CanaryReleases.TransitionAsync(release.TenantId, release.Id, CanaryStatusEnum.Running, CanaryStatusEnum.RolledBack, decision.Reason, token).ConfigureAwait(false))
                        return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Another change to the release won.");
                    await RestoreWeightsAsync(release, token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.CanaryTransitions, "result", "rolled_back");
                    await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "CanaryRelease", release.Id, "Canary release " + release.Id + " rolled back to weights " + release.CandidateInitialWeight + " and " + release.BaselineInitialWeight + ": " + decision.Reason, release.TenantId, token).ConfigureAwait(false);
                    _Server.Logging.Warn(_Header + "release " + release.Id + " rolled back: " + decision.Reason);
                    return decision;
                case CanaryDecisionEnum.Promote:
                    if (!await _Server.Database.CanaryReleases.TransitionAsync(release.TenantId, release.Id, CanaryStatusEnum.Running, CanaryStatusEnum.Promoted, null, token).ConfigureAwait(false))
                        return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Another change to the release won.");
                    await SetWeightAsync(release, release.CandidateDeploymentId, CanaryStepEvaluator.CandidateWeight(100), token).ConfigureAwait(false);
                    await SetWeightAsync(release, release.BaselineDeploymentId, CanaryStepEvaluator.BaselineWeight(100), token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.CanaryTransitions, "result", "promoted");
                    await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "CanaryRelease", release.Id, "Canary release " + release.Id + " promoted the candidate to all of the traffic: " + decision.Reason, release.TenantId, token).ConfigureAwait(false);
                    _Server.Logging.Info(_Header + "release " + release.Id + " promoted");
                    return decision;
                case CanaryDecisionEnum.Advance:
                    if (!await _Server.Database.CanaryReleases.AdvanceStepAsync(release.TenantId, release.Id, release.CurrentStepIndex, now, token).ConfigureAwait(false))
                        return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Another change to the release won.");
                    int next = release.Steps[release.CurrentStepIndex + 1].WeightPercent;
                    await ApplyStepWeightsAsync(release, next, token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.CanaryTransitions, "result", "advanced");
                    await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "CanaryRelease", release.Id, "Canary release " + release.Id + " advanced to step " + (release.CurrentStepIndex + 2).ToString(CultureInfo.InvariantCulture) + " (" + next + " percent): " + decision.Reason, release.TenantId, token).ConfigureAwait(false);
                    _Server.Logging.Info(_Header + "release " + release.Id + " advanced to " + next + " percent");
                    return decision;
                default:
                    return decision;
            }
        }

        private async Task<CanaryWindowCount> CountWindowAsync(CanaryRelease release, DateTime fromUtc, CancellationToken token)
        {
            // Real traffic on the candidate since the step started: shadow and eval runs are not counted, and a cancelled
            // or rejected run is neither a success nor a failure.
            CanaryWindowCount count = new CanaryWindowCount();
            int read = 0;
            int skip = 0;
            while (read < _MaxRunsPerEvaluation)
            {
                token.ThrowIfCancellationRequested();
                RunFilter filter = new RunFilter();
                filter.TenantId = release.TenantId;
                filter.DeploymentId = release.CandidateDeploymentId;
                filter.FromUtc = fromUtc;
                filter.Skip = skip;
                filter.MaxResults = 500;
                EnumerationResult<Run> page = await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
                foreach (Run run in page.Objects)
                {
                    if (run.Kind == RunKindEnum.Shadow || run.Kind == RunKindEnum.Eval) continue;
                    if (run.Status == RunStatusEnum.Succeeded) count.Finished++;
                    else if (run.Status == RunStatusEnum.Failed || run.Status == RunStatusEnum.TimedOut)
                    {
                        count.Finished++;
                        count.Failed++;
                    }
                }
                read += page.Objects.Count;
                skip += page.Objects.Count;
                if (page.EndOfResults || page.Objects.Count == 0) break;
            }
            return count;
        }

        private async Task<CanaryStepDecision> StepEvalAsync(CanaryRelease release, CanaryWindowCount window, DateTime fromUtc, DateTime now, CancellationToken token)
        {
            // The step's eval runs: those of the candidate on the release's eval set created since the step started, by
            // anyone. The newest completed one decides; a pending or running one is waited for; when every one failed the
            // gate cannot pass and the release rolls back. With none (or only cancelled ones) the sweep starts one as the
            // person who started the release.
            string where = "step " + (release.CurrentStepIndex + 1).ToString(CultureInfo.InvariantCulture) + " of " + release.Steps.Count.ToString(CultureInfo.InvariantCulture);
            List<EvalRun> live = (await StepEvalRunsAsync(release, fromUtc, token).ConfigureAwait(false)).Where(r => r.Status != EvalRunStatusEnum.Cancelled).ToList();
            string? startedId = null;
            if (live.Count == 0)
            {
                RequestContext? creator = await CreatorContextAsync(release, token).ConfigureAwait(false);
                if (creator == null) return new CanaryStepDecision(CanaryDecisionEnum.RollBack, "The eval gate could not start an eval run at " + where + ": " + (release.CreatedByName ?? release.CreatedById ?? "the person") + " who started the release is no longer active.");
                try
                {
                    EvalRunRequest request = new EvalRunRequest();
                    request.SetId = release.EvalSetId;
                    request.TargetType = EvalRunTargetEnum.Deployment;
                    request.DeploymentId = release.CandidateDeploymentId;
                    request.Threshold = release.MinEvalScore;
                    startedId = (await _Server.Get<EvalRunService>().CreateAsync(creator, release.TenantId, request, token).ConfigureAwait(false)).Id;
                }
                catch (Exception e) when (e is ValidationException || e is NotFoundException || e is AppAccessException || e is ConflictException)
                {
                    return new CanaryStepDecision(CanaryDecisionEnum.RollBack, "The eval gate could not start an eval run of eval set " + release.EvalSetId + " on the candidate at " + where + ": " + e.Message);
                }
                _Server.Logging.Info(_Header + "release " + release.Id + " started eval run " + startedId + " for " + where);
                live = (await StepEvalRunsAsync(release, fromUtc, token).ConfigureAwait(false)).Where(r => r.Status != EvalRunStatusEnum.Cancelled).ToList();
            }

            // Two replicas' sweeps may each have started one: every sweep keeps the oldest of the release's own pending or
            // running eval runs and cancels the rest, so they converge on one.
            List<EvalRun> ours = live
                .Where(r => (r.Status == EvalRunStatusEnum.Pending || r.Status == EvalRunStatusEnum.Running) && String.Equals(r.StartedByName, CanaryPrincipalName(release), StringComparison.Ordinal))
                .OrderBy(r => r.CreatedUtc).ThenBy(r => r.Id, StringComparer.Ordinal).ToList();
            if (ours.Count > 1)
            {
                RequestContext system = new RequestContext { TenantId = release.TenantId, PrincipalType = PrincipalTypeEnum.Administrator, PrincipalName = CanaryPrincipalName(release) };
                foreach (EvalRun duplicate in ours.Skip(1))
                {
                    try
                    {
                        await _Server.Get<EvalRunService>().CancelAsync(system, duplicate, "A duplicate of eval run " + ours[0].Id + " for canary release " + release.Id + ".", token).ConfigureAwait(false);
                    }
                    catch (ConflictException)
                    {
                        // It finished meanwhile; it stays among the step's eval runs.
                        continue;
                    }
                    live.RemoveAll(r => r.Id == duplicate.Id);
                    _Server.Logging.Info(_Header + "release " + release.Id + " cancelled duplicate eval run " + duplicate.Id);
                }
            }

            EvalRun? completed = live.Where(r => r.Status == EvalRunStatusEnum.Completed && r.Score.HasValue).OrderByDescending(r => r.CompletedUtc ?? r.CreatedUtc).FirstOrDefault();
            if (completed != null) return CanaryStepEvaluator.Evaluate(release, window.Finished, window.Failed, completed.Score, now);
            EvalRun? active = live.Where(r => r.Status == EvalRunStatusEnum.Pending || r.Status == EvalRunStatusEnum.Running).OrderBy(r => r.CreatedUtc).ThenBy(r => r.Id, StringComparer.Ordinal).FirstOrDefault();
            if (active != null)
            {
                string verb = startedId != null ? "Started" : "Waiting for";
                return new CanaryStepDecision(CanaryDecisionEnum.Wait, verb + " eval run " + active.Id + " of the candidate on eval set " + release.EvalSetId + " at " + where + " (" + active.CompletedCases + " of " + active.TotalCases + " cases done); the step advances when it completes with a score of at least " + release.MinEvalScore!.Value.ToString("0.##", CultureInfo.InvariantCulture) + ".");
            }
            if (live.Count == 0) return new CanaryStepDecision(CanaryDecisionEnum.Wait, "Waiting for an eval run of the candidate on eval set " + release.EvalSetId + " at " + where + ".");
            EvalRun last = live.OrderByDescending(r => r.CreatedUtc).First();
            return new CanaryStepDecision(CanaryDecisionEnum.RollBack, "Eval run " + last.Id + " of the candidate on eval set " + release.EvalSetId + " ended " + last.Status + " at " + where + (String.IsNullOrEmpty(last.FailureReason) ? String.Empty : ": " + last.FailureReason) + "; the eval gate cannot pass.");
        }

        private async Task<List<EvalRun>> StepEvalRunsAsync(CanaryRelease release, DateTime fromUtc, CancellationToken token)
        {
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 100;
            query.Ordering = EnumerationOrderEnum.CreatedDescending;
            EnumerationResult<EvalRun> page = await _Server.Database.EvalRuns.EnumerateAsync(release.TenantId, release.EvalSetId, release.CandidateDeploymentId, null, null, query, token).ConfigureAwait(false);
            return page.Objects.Where(r => r.TenantId == release.TenantId && r.CreatedUtc >= fromUtc).ToList();
        }

        private async Task<RequestContext?> CreatorContextAsync(CanaryRelease release, CancellationToken token)
        {
            // The step's eval run is started as the person who started the release, with what they may do today.
            RequestContext ctx = new RequestContext();
            ctx.IsAuthenticated = true;
            ctx.TenantId = release.TenantId;
            ctx.PrincipalType = release.CreatedByType;
            ctx.PrincipalName = CanaryPrincipalName(release);
            if (release.CreatedByType == PrincipalTypeEnum.Administrator)
            {
                ctx.IsAdmin = true;
                ctx.UserId = release.CreatedById;
                return ctx;
            }
            if (String.IsNullOrEmpty(release.CreatedById)) return null;
            // A credential's release records the credential's owner as its creator (the request carried both), so an
            // identifier that names no credential is read as that owner.
            Credential? credential = release.CreatedByType == PrincipalTypeEnum.Credential ? await _Server.Database.Credentials.ReadAsync(release.TenantId, release.CreatedById, token).ConfigureAwait(false) : null;
            if (credential != null)
            {
                if (!credential.Active) return null;
                User? owner = await _Server.Database.Users.ReadAsync(release.TenantId, credential.UserId, token).ConfigureAwait(false);
                ctx.CredentialId = credential.Id;
                ctx.UserId = credential.UserId;
                ctx.IsAdmin = owner != null && owner.IsAdmin;
                ctx.IsTenantAdmin = owner != null && owner.IsTenantAdmin;
                return ctx;
            }
            User? user = await _Server.Database.Users.ReadAsync(release.TenantId, release.CreatedById, token).ConfigureAwait(false);
            if (user == null || !user.Active) return null;
            ctx.PrincipalType = PrincipalTypeEnum.User;
            ctx.UserId = user.Id;
            ctx.IsAdmin = user.IsAdmin;
            ctx.IsTenantAdmin = user.IsTenantAdmin;
            return ctx;
        }

        private static string CanaryPrincipalName(CanaryRelease release)
        {
            return "canary:" + release.Id;
        }

        private async Task ApplyStepWeightsAsync(CanaryRelease release, int weightPercent, CancellationToken token)
        {
            await SetWeightAsync(release, release.CandidateDeploymentId, CanaryStepEvaluator.CandidateWeight(weightPercent), token).ConfigureAwait(false);
            await SetWeightAsync(release, release.BaselineDeploymentId, CanaryStepEvaluator.BaselineWeight(weightPercent), token).ConfigureAwait(false);
        }

        private async Task RestoreWeightsAsync(CanaryRelease release, CancellationToken token)
        {
            await SetWeightAsync(release, release.CandidateDeploymentId, release.CandidateInitialWeight, token).ConfigureAwait(false);
            await SetWeightAsync(release, release.BaselineDeploymentId, release.BaselineInitialWeight, token).ConfigureAwait(false);
        }

        private async Task SetWeightAsync(CanaryRelease release, string deploymentId, int weight, CancellationToken token)
        {
            // Weight only steers selection among the agent's deployments; it is not compiled into runs, so the
            // configuration version stays the same.
            Deployment? deployment = await _Server.Database.Deployments.ReadAsync(release.TenantId, deploymentId, token).ConfigureAwait(false);
            if (deployment == null || deployment.Weight == weight) return;
            int before = deployment.Weight;
            deployment.Weight = weight;
            await _Server.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(null, AuditEventTypeEnum.ConfigurationChanged, "Deployment", deployment.Id, "Canary release " + release.Id + " changed the weight of deployment " + deployment.Name + " from " + before + " to " + weight + ".", release.TenantId, token).ConfigureAwait(false);
        }

        private void ValidateSteps(List<CanaryReleaseStep> steps)
        {
            if (steps == null || steps.Count == 0) throw Invalid("steps", "Required", "List at least one step; the last step's weightPercent must be 100.");
            if (steps.Count > _MaxSteps) throw Invalid("steps", "TooMany", "A release has at most " + _MaxSteps + " steps.");
            int previous = 0;
            for (int i = 0; i < steps.Count; i++)
            {
                CanaryReleaseStep step = steps[i] ?? throw Invalid("steps[" + i.ToString(CultureInfo.InvariantCulture) + "]", "Required", "Step " + (i + 1) + " is empty.");
                if (step.WeightPercent <= previous) throw Invalid("steps[" + i.ToString(CultureInfo.InvariantCulture) + "].weightPercent", "NotIncreasing", "Each step's weightPercent must be higher than the one before it.");
                previous = step.WeightPercent;
            }
            if (previous != 100) throw Invalid("steps[" + (steps.Count - 1).ToString(CultureInfo.InvariantCulture) + "].weightPercent", "LastStepNotFull", "The last step's weightPercent must be 100.");
        }

        private async Task<Agent?> FindAgentAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            string value = idOrName.Trim();
            return await _Server.Database.Agents.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
        }

        private async Task<Deployment?> FindDeploymentAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) return null;
            string value = idOrName.Trim();
            return await _Server.Database.Deployments.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await _Server.Database.Deployments.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
        }

        private static void PeopleOnly(RequestContext ctx, string what)
        {
            // An agent never moves its own traffic: canaries are started and aborted by people (AA-022).
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw new AppAccessException(403, "PeopleOnly", "Only people and API credentials " + what + "; a run token cannot.");
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            return new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
        }

        #endregion
    }
}
