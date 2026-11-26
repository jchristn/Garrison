namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;

    /// <summary>
    /// Eval runs (AA9.3, AA9.12): start one against a deployment or an agent revision (optionally a studio draft's), list
    /// and read them with their case results, and cancel them. The caller needs Execute on the evaluated agent. A run
    /// token may start eval runs only as an executive and only of its own drafts, sees only the eval runs its agent
    /// started, and sees hidden cases' results as scores only (AA-024). Every read filters by tenant; another tenant's
    /// eval run answers 404. Thread-safe.
    /// </summary>
    public class EvalRunService
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly EvalRunner _Runner;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="runner">Eval runner.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvalRunService(ServerContext server, EvalRunner runner)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Runner = runner ?? throw new ArgumentNullException(nameof(runner));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Start an eval run. It is created Pending and the leader runs it in the background.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalRun Create).</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">What to run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the set, agent, revision, deployment, or draft is unknown.</exception>
        /// <exception cref="ValidationException">Thrown when the request is invalid (TargetRequired, EvalSetEmpty, NoRecentInputs, JudgeAgentRequired, RecentInputsNeedDeployment).</exception>
        /// <exception cref="AppAccessException">Thrown with 403 when the caller may not execute the agent, or a run token is not an executive evaluating its own draft (OwnDraftsOnly).</exception>
        public async Task<EvalRun> CreateAsync(RequestContext ctx, string tenantId, EvalRunRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (request == null) throw new ArgumentNullException(nameof(request));
            EvalSet set = await ResolveSetAsync(tenantId, request, token).ConfigureAwait(false);
            Run? caller = await CallerRunAsync(ctx, tenantId, token).ConfigureAwait(false);
            if (caller != null && await _Server.Get<ExecutiveAuthority>().ResolveRunAsync(ctx, token).ConfigureAwait(false) == null)
                throw new AppAccessException(403, "NotAnExecutive", "Only an executive run (a deployment with managementAccess OrgSubtree whose agent leads a unit) runs evals.");

            EvalRun run = new EvalRun();
            run.TenantId = tenantId;
            run.SetId = set.Id;
            run.SetName = set.Name;
            run.SetVersion = set.Version;
            run.InputMode = request.InputMode;
            run.RecentInputCount = request.RecentInputCount;
            run.Threshold = request.Threshold;
            run.BudgetUsd = request.BudgetUsd;
            EvalRunTargetEnum target = request.TargetType ?? (!String.IsNullOrWhiteSpace(request.DeploymentId) ? EvalRunTargetEnum.Deployment : EvalRunTargetEnum.AgentRevision);
            run.TargetType = target;
            Agent agent;
            if (target == EvalRunTargetEnum.Deployment)
            {
                if (String.IsNullOrWhiteSpace(request.DeploymentId)) throw Invalid("deploymentId", "TargetRequired", "Name the deployment to evaluate.");
                Deployment deployment = await DeploymentAsync(tenantId, request.DeploymentId.Trim(), token).ConfigureAwait(false);
                agent = await _Server.Database.Agents.ReadAsync(tenantId, deployment.AgentId, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("The deployment's agent was not found.");
                run.DeploymentId = deployment.Id;
                run.AgentRevisionId = !String.IsNullOrEmpty(deployment.AgentRevisionId) ? deployment.AgentRevisionId : agent.LatestPublishedRevisionId;
            }
            else
            {
                if (request.InputMode == EvalRunInputModeEnum.RecentInputs) throw Invalid("inputMode", "RecentInputsNeedDeployment", "RecentInputs replays a deployment's recent runs; evaluate a deployment.");
                if (!String.IsNullOrWhiteSpace(request.StudioDraftId))
                {
                    StudioDraft draft = await _Server.Database.StudioDrafts.ReadAsync(tenantId, request.StudioDraftId.Trim(), token).ConfigureAwait(false)
                        ?? throw new NotFoundException("Studio draft " + request.StudioDraftId + " not found.");
                    if (caller != null && !await OwnDraftAsync(tenantId, caller, draft, token).ConfigureAwait(false)) throw new NotFoundException("Studio draft " + request.StudioDraftId + " not found.");
                    if (caller != null) await RequireWithinLimitsAsync(draft, token).ConfigureAwait(false);
                    agent = await _Server.Get<PlaygroundService>().ApplyDraftRevisionAsync(ctx, tenantId, draft, request.AgentId, token).ConfigureAwait(false);
                    run.StudioDraftId = draft.Id;
                    run.AgentRevisionId = draft.Items.Any(i => i.Kind == "Agent" && i.Name == agent.Name && i.Operation == StudioDraftOperationEnum.Upsert) ? agent.DraftRevisionId : request.AgentRevisionId ?? agent.LatestPublishedRevisionId;
                }
                else
                {
                    if (caller != null) throw new AppAccessException(403, "OwnDraftsOnly", "An agent evaluates only its own studio drafts; pass studioDraftId.");
                    agent = await AgentAsync(tenantId, request.AgentId, token).ConfigureAwait(false);
                    run.AgentRevisionId = !String.IsNullOrWhiteSpace(request.AgentRevisionId) ? request.AgentRevisionId.Trim() : agent.DraftRevisionId ?? agent.LatestPublishedRevisionId;
                }
                if (String.IsNullOrEmpty(run.AgentRevisionId)) throw Invalid("agentRevisionId", "TargetRequired", "Agent " + agent.Name + " has no revision to evaluate.");
                AgentRevision? revision = await _Server.Database.AgentRevisions.ReadAsync(tenantId, run.AgentRevisionId, token).ConfigureAwait(false);
                if (revision == null || revision.AgentId != agent.Id) throw new NotFoundException("Revision " + run.AgentRevisionId + " of agent " + agent.Name + " not found.");
            }
            if (caller != null && target == EvalRunTargetEnum.Deployment) throw new AppAccessException(403, "OwnDraftsOnly", "An agent evaluates only its own studio drafts, not deployments.");
            run.AgentId = agent.Id;

            AuthorizationDecision execute = await _Server.Authorization.AuthorizeAsync(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);
            if (!execute.Permitted) throw new AppAccessException(403, "Forbidden", "Evaluating agent " + agent.Name + " runs it; that needs Execute on the agent: " + execute.Reason);

            List<EvalWorkItem> items = await _Runner.WorkItemsAsync(run, token).ConfigureAwait(false);
            if (items.Count == 0)
            {
                if (run.InputMode == EvalRunInputModeEnum.RecentInputs) throw Invalid("inputMode", "NoRecentInputs", "The deployment has no succeeded runs to replay yet.");
                throw Invalid("setId", "EvalSetEmpty", "Eval set " + set.Name + " version " + set.Version + " has no cases.");
            }
            if (String.IsNullOrWhiteSpace(set.JudgeAgent) && items.Any(i => EvalCaseScoring.EffectiveChecks(i).Any(c => c.Scorer == EvalScorerEnum.Judge)))
                throw Invalid("setId", "JudgeAgentRequired", "Eval set " + set.Name + " has Judge checks (or cases without expected text, or runs recent inputs) but no judge agent; set its judgeAgent.");
            run.TotalCases = items.Count;

            if (caller != null)
            {
                run.StartedByType = ctx.OriginPrincipalType ?? PrincipalTypeEnum.User;
                run.StartedById = ctx.OriginPrincipalId;
                run.StartedByName = "agent " + caller.AgentName;
                run.OriginRunId = caller.Id;
            }
            else
            {
                run.StartedByType = ctx.PrincipalType;
                run.StartedById = ctx.UserId ?? ctx.CredentialId;
                run.StartedByName = ctx.PrincipalName;
            }
            EvalRun created = await _Server.Database.EvalRuns.CreateAsync(run, token).ConfigureAwait(false);
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalRun", created.Id, "Started eval run of set " + set.Name + " version " + set.Version + " against " + (target == EvalRunTargetEnum.Deployment ? "deployment " + created.DeploymentId : "agent " + agent.Name + " revision " + created.AgentRevisionId) + " (" + created.TotalCases + " case(s)).", tenantId, token).ConfigureAwait(false);
            _Runner.Kick(created);
            return created;
        }

        /// <summary>
        /// Read an eval run. A run token reads only the eval runs its own agent started.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Eval run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run.</returns>
        /// <exception cref="NotFoundException">Thrown when not found or not visible to the caller.</exception>
        public async Task<EvalRun> ReadAsync(RequestContext ctx, string tenantId, string? id, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrWhiteSpace(id)) throw new NotFoundException("An eval run identifier is required.");
            EvalRun? run = await _Server.Database.EvalRuns.ReadAsync(tenantId, id.Trim(), token).ConfigureAwait(false);
            if (run == null) throw new NotFoundException("Eval run " + id + " not found.");
            Run? caller = await CallerRunAsync(ctx, tenantId, token).ConfigureAwait(false);
            if (caller != null && !await OwnRunAsync(tenantId, caller, run, token).ConfigureAwait(false)) throw new NotFoundException("Eval run " + id + " not found.");
            return run;
        }

        /// <summary>
        /// List eval runs, newest first. A run token sees only those its own agent started.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Set version filter, or null.</param>
        /// <param name="deploymentId">Deployment filter, or null.</param>
        /// <param name="agentRevisionId">Revision filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page.</returns>
        public async Task<EnumerationResult<EvalRun>> EnumerateAsync(RequestContext ctx, string tenantId, string? setId, string? deploymentId, string? agentRevisionId, EvalRunStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            EnumerationResult<EvalRun> page = await _Server.Database.EvalRuns.EnumerateAsync(tenantId, setId, deploymentId, agentRevisionId, status, query ?? new EnumerationQuery(), token).ConfigureAwait(false);
            Run? caller = await CallerRunAsync(ctx, tenantId, token).ConfigureAwait(false);
            if (caller == null) return page;
            List<EvalRun> own = new List<EvalRun>();
            foreach (EvalRun run in page.Objects)
            {
                if (await OwnRunAsync(tenantId, caller, run, token).ConfigureAwait(false)) own.Add(run);
            }
            page.Objects = own;
            return page;
        }

        /// <summary>
        /// An eval run's case results in order. Run tokens see hidden cases' results as scores only (AA-024).
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <param name="run">Eval run (already visible to the caller).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Results.</returns>
        public async Task<List<EvalCaseResult>> ResultsAsync(RequestContext ctx, EvalRun run, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<EvalCaseResult> results = await _Server.Database.EvalCaseResults.ListByEvalRunAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
            if (ctx.PrincipalType != PrincipalTypeEnum.Run) return results;
            return EvalRedaction.Results(results, await HiddenCaseIdsAsync(run, token).ConfigureAwait(false));
        }

        /// <summary>
        /// Identifiers of the hidden cases of an eval run's set version.
        /// </summary>
        /// <param name="run">Eval run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Case identifiers.</returns>
        public async Task<HashSet<string>> HiddenCaseIdsAsync(EvalRun run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<EvalCase> cases = await _Server.Database.EvalCases.ListBySetAsync(run.TenantId, run.SetId, token).ConfigureAwait(false);
            return new HashSet<string>(cases.Where(c => c.Hidden).Select(c => c.Id), StringComparer.Ordinal);
        }

        /// <summary>
        /// Cancel a Pending or Running eval run and its unfinished case and judge runs.
        /// </summary>
        /// <param name="ctx">Authorized caller (EvalRun Update).</param>
        /// <param name="run">Eval run.</param>
        /// <param name="reason">Why, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run as stored.</returns>
        /// <exception cref="ConflictException">Thrown with EvalRunFinished when it already finished.</exception>
        public async Task<EvalRun> CancelAsync(RequestContext ctx, EvalRun run, string? reason, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (run == null) throw new ArgumentNullException(nameof(run));
            string text = "Cancelled by " + (ctx.PrincipalName ?? ctx.PrincipalType.ToString()) + (String.IsNullOrWhiteSpace(reason) ? "." : ": " + reason.Trim());
            if (text.Length > 2000) text = text.Substring(0, 2000);
            bool moved = await _Server.Database.EvalRuns.TransitionAsync(run.TenantId, run.Id, EvalRunStatusEnum.Pending, EvalRunStatusEnum.Cancelled, text, token).ConfigureAwait(false)
                || await _Server.Database.EvalRuns.TransitionAsync(run.TenantId, run.Id, EvalRunStatusEnum.Running, EvalRunStatusEnum.Cancelled, text, token).ConfigureAwait(false);
            if (!moved) throw new ConflictException("EvalRunFinished", "Eval run " + run.Id + " already finished.");
            GarrisonMetrics.Count(GarrisonMetricCatalog.EvalRuns, "outcome", "cancelled");
            RunService runs = _Server.Get<RunService>();
            RunFilter filter = new RunFilter { TenantId = run.TenantId, EvalRunId = run.Id, MaxResults = 1000 };
            EnumerationResult<Run> page = await _Server.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            foreach (Run child in page.Objects.Where(r => !RunService.IsTerminal(r.Status)))
            {
                try
                {
                    await runs.CancelAsync(child, token).ConfigureAwait(false);
                }
                catch (ConflictException)
                {
                    // It finished meanwhile.
                }
            }
            await _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "EvalRun", run.Id, "Cancelled eval run of set " + run.SetName + ".", run.TenantId, token).ConfigureAwait(false);
            return await _Server.Database.EvalRuns.ReadAsync(run.TenantId, run.Id, token).ConfigureAwait(false) ?? run;
        }

        #endregion

        #region Private-Methods

        private async Task<EvalSet> ResolveSetAsync(string tenantId, EvalRunRequest request, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(request.SetId)) throw Invalid("setId", "SetRequired", "Name the eval set to run.");
            string key = request.SetId.Trim();
            EvalSet? byId = await _Server.Database.EvalSets.ReadAsync(tenantId, key, token).ConfigureAwait(false);
            if (byId != null) return byId;
            EvalSet? set = request.SetVersion.HasValue
                ? await _Server.Database.EvalSets.ReadByNameAsync(tenantId, key, request.SetVersion.Value, token).ConfigureAwait(false)
                : await _Server.Database.EvalSets.ReadLatestApprovedAsync(tenantId, key, token).ConfigureAwait(false) ?? await _Server.Database.EvalSets.ReadLatestAsync(tenantId, key, token).ConfigureAwait(false);
            return set ?? throw new NotFoundException("Eval set " + key + (request.SetVersion.HasValue ? " version " + request.SetVersion.Value : String.Empty) + " not found.");
        }

        private async Task<Agent> AgentAsync(string tenantId, string? idOrName, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) throw Invalid("agentId", "TargetRequired", "Name the agent to evaluate.");
            string key = idOrName.Trim();
            return await _Server.Database.Agents.ReadAsync(tenantId, key, token).ConfigureAwait(false)
                ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, key, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Agent " + key + " not found.");
        }

        private async Task<Deployment> DeploymentAsync(string tenantId, string idOrName, CancellationToken token)
        {
            Deployment? deployment = await _Server.Database.Deployments.ReadAsync(tenantId, idOrName, token).ConfigureAwait(false);
            if (deployment == null)
            {
                List<Deployment> named = await Garrison.Server.Routes.ConfigurationSupport.DeploymentsAsync(_Server, tenantId, d => d.Name == idOrName, token).ConfigureAwait(false);
                deployment = named.FirstOrDefault();
            }
            if (deployment == null || deployment.TenantId != tenantId) throw new NotFoundException("Deployment " + idOrName + " not found.");
            return deployment;
        }

        private async Task<Run?> CallerRunAsync(RequestContext ctx, string tenantId, CancellationToken token)
        {
            if (ctx.PrincipalType != PrincipalTypeEnum.Run) return null;
            if (String.IsNullOrEmpty(ctx.RunId)) throw new AppAccessException(403, "Forbidden", "A run token without a run cannot use eval runs.");
            Run run = await _Server.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false)
                ?? throw new AppAccessException(403, "Forbidden", "The calling run no longer exists.");
            return run;
        }

        private async Task<bool> OwnDraftAsync(string tenantId, Run caller, StudioDraft draft, CancellationToken token)
        {
            if (String.Equals(draft.ExecutiveAgentId, caller.AgentId, StringComparison.Ordinal)) return true;
            if (String.IsNullOrEmpty(draft.OriginRunId)) return false;
            Run? origin = await _Server.Database.Runs.ReadAsync(tenantId, draft.OriginRunId, token).ConfigureAwait(false);
            return origin != null && String.Equals(origin.AgentId, caller.AgentId, StringComparison.Ordinal);
        }

        private async Task RequireWithinLimitsAsync(StudioDraft draft, CancellationToken token)
        {
            // AA-022: an executive's draft becomes a draft agent revision only when it keeps the hard limits.
            ExecutiveDraftContext? context = await _Server.Get<ExecutiveAuthority>().ContextAsync(draft, token).ConfigureAwait(false);
            if (context == null) throw new AppAccessException(403, "OwnDraftsOnly", "The draft is not an executive draft of a live organization.");
            List<ExecutiveRefusal> refusals = ExecutiveDraftValidator.Validate(context);
            if (refusals.Count > 0) throw new AppAccessException(403, refusals[0].Code, "The draft breaks a hard limit, so it cannot be evaluated: " + String.Join("; ", refusals.Select(r => r.Message)));
        }

        private async Task<bool> OwnRunAsync(string tenantId, Run caller, EvalRun run, CancellationToken token)
        {
            if (String.IsNullOrEmpty(run.OriginRunId)) return false;
            if (run.OriginRunId == caller.Id) return true;
            Run? origin = await _Server.Database.Runs.ReadAsync(tenantId, run.OriginRunId, token).ConfigureAwait(false);
            return origin != null && String.Equals(origin.AgentId, caller.AgentId, StringComparison.Ordinal);
        }

        private static ValidationException Invalid(string field, string code, string message)
        {
            ValidationException error = new ValidationException(message, new Dictionary<string, string> { [field] = message }, new Dictionary<string, string> { [field] = code });
            error.Code = code;
            return error;
        }

        #endregion
    }
}
