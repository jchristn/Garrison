namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Eval set and eval run routes (AA9.12): sets with versioned cases (an edit to an approved version answers with its
    /// next version, a draft), approval by people, eval runs against a deployment or an agent revision, their case
    /// results, and cancel. Every route filters by the request's tenant; another tenant's set or run answers 404. Run
    /// tokens see hidden cases and their results redacted, and only the eval runs their own agent started.
    /// </summary>
    public class EvaluationRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly EvalSetService _Sets;
        private readonly EvalRunService _Runs;
        private static readonly string _SetBase = "/v1.0/api/tenants/{tenantId}/eval-sets";
        private static readonly string _RunBase = "/v1.0/api/tenants/{tenantId}/eval-runs";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="sets">Eval set service.</param>
        /// <param name="runs">Eval run service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EvaluationRoutes(ServerContext server, EvalSetService sets, EvalRunService runs)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Sets = sets ?? throw new ArgumentNullException(nameof(sets));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string sets = "Eval sets";
            const string runs = "Eval runs";
            string set = _SetBase + "/{setId}";
            string oneCase = set + "/cases/{caseId}";
            string run = _RunBase + "/{evalRunId}";
            routes.Scoped(HttpMethod.GET, _SetBase, ResourceTypeEnum.EvalSet, OperationTypeEnum.Read, ListSetsAsync, "List eval set versions, newest first (query: state, origin, tag, latestOnly, search, maxResults, skip)", sets, null, typeof(EnumerationResult<EvalSet>));
            routes.Scoped(HttpMethod.POST, _SetBase, ResourceTypeEnum.EvalSet, OperationTypeEnum.Create, CreateSetAsync, "Create version 1 of an eval set with its cases (a run token's set has origin Evaluator)", sets, typeof(EvalSetRequest), typeof(EvalSet));
            routes.Scoped(HttpMethod.GET, set, ResourceTypeEnum.EvalSet, OperationTypeEnum.Read, ReadSetAsync, "Read an eval set version by identifier, or the newest version of a name", sets, null, typeof(EvalSet), "setId");
            routes.Scoped(HttpMethod.PUT, set, ResourceTypeEnum.EvalSet, OperationTypeEnum.Update, UpdateSetAsync, "Edit a set's description, judge agent, and tags; an approved version answers with its next version, a draft", sets, typeof(EvalSetRequest), typeof(EvalSet), "setId");
            routes.Scoped(HttpMethod.DELETE, set, ResourceTypeEnum.EvalSet, OperationTypeEnum.Delete, DeleteSetAsync, "Delete a draft version (approved versions are kept)", sets, null, null, "setId");
            routes.Scoped(HttpMethod.POST, set + "/approve", ResourceTypeEnum.EvalSet, OperationTypeEnum.Update, ApproveSetAsync, "Approve a draft version so it can gate promotions (people only)", sets, null, typeof(EvalSet), "setId");
            routes.Scoped(HttpMethod.GET, set + "/cases", ResourceTypeEnum.EvalSet, OperationTypeEnum.Read, ListCasesAsync, "List a set version's cases in order (run tokens see hidden cases redacted)", sets, null, typeof(List<EvalCase>), "setId");
            routes.Scoped(HttpMethod.POST, set + "/cases", ResourceTypeEnum.EvalSet, OperationTypeEnum.Update, CreateCaseAsync, "Add a case at the end; on an approved version it lands on the next version", sets, typeof(EvalCase), typeof(EvalCase), "setId");
            routes.Scoped(HttpMethod.GET, oneCase, ResourceTypeEnum.EvalSet, OperationTypeEnum.Read, ReadCaseAsync, "Read a case", sets, null, typeof(EvalCase), "setId");
            routes.Scoped(HttpMethod.PUT, oneCase, ResourceTypeEnum.EvalSet, OperationTypeEnum.Update, UpdateCaseAsync, "Replace a case; on an approved version the same case of the next version changes", sets, typeof(EvalCase), typeof(EvalCase), "setId");
            routes.Scoped(HttpMethod.DELETE, oneCase, ResourceTypeEnum.EvalSet, OperationTypeEnum.Update, DeleteCaseAsync, "Remove a case; answers with the draft version it was removed from", sets, null, typeof(EvalSet), "setId");
            routes.Scoped(HttpMethod.GET, _RunBase, ResourceTypeEnum.EvalRun, OperationTypeEnum.Read, ListRunsAsync, "List eval runs, newest first (query: set, deployment, revision, status, maxResults, skip)", runs, null, typeof(EnumerationResult<EvalRun>), "evalRunId", null, new RouteScopeOptions().Query("deployment", ResourceTypeEnum.Deployment));
            routes.Scoped(HttpMethod.POST, _RunBase, ResourceTypeEnum.EvalRun, OperationTypeEnum.Execute, CreateRunAsync, "Start an eval run of a set against a deployment or an agent revision (Execute on the agent too)", runs, typeof(EvalRunRequest), typeof(EvalRun));
            routes.Scoped(HttpMethod.GET, run, ResourceTypeEnum.EvalRun, OperationTypeEnum.Read, ReadRunAsync, "Read an eval run with its score and counts", runs, null, typeof(EvalRun), "evalRunId");
            routes.Scoped(HttpMethod.GET, run + "/results", ResourceTypeEnum.EvalRun, OperationTypeEnum.Read, ResultsAsync, "An eval run's case results with per-check scores and notes (run tokens see hidden cases as scores only)", runs, null, typeof(List<EvalCaseResult>), "evalRunId");
            routes.Scoped(HttpMethod.POST, run + "/cancel", ResourceTypeEnum.EvalRun, OperationTypeEnum.Execute, CancelRunAsync, "Cancel a pending or running eval run and its unfinished case runs", runs, typeof(EvalRunCancelRequest), typeof(EvalRun), "evalRunId");
        }

        #endregion

        #region Private-Methods

        private async Task ListSetsAsync(HttpContextBase http)
        {
            EnumerationResult<EvalSet> page = await _Sets.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.QueryEnum<EvalSetStateEnum>(http, "state"), RouteHelpers.QueryEnum<EvalSetOriginEnum>(http, "origin"),
                RouteHelpers.Query(http, "tag"), RouteHelpers.QueryBool(http, "latestOnly") ?? false, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateSetAsync(HttpContextBase http)
        {
            EvalSetRequest body = RouteHelpers.RequiredBody<EvalSetRequest>(http);
            await RouteHelpers.JsonAsync(http, 201, await _Sets.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReadSetAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await SetAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateSetAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            EvalSetRequest body = RouteHelpers.RequiredBody<EvalSetRequest>(http);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.UpdateAsync(RouteHelpers.Context(http), existing, body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DeleteSetAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            await _Sets.DeleteAsync(RouteHelpers.Context(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ApproveSetAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.ApproveAsync(RouteHelpers.Context(http), existing, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ListCasesAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.ListCasesAsync(RouteHelpers.Context(http), existing, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateCaseAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            EvalCase body = RouteHelpers.RequiredBody<EvalCase>(http);
            await RouteHelpers.JsonAsync(http, 201, await _Sets.CreateCaseAsync(RouteHelpers.Context(http), existing, body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReadCaseAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.ReadCaseAsync(RouteHelpers.Context(http), existing, RouteHelpers.Param(http, "caseId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateCaseAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            EvalCase body = RouteHelpers.RequiredBody<EvalCase>(http);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.UpdateCaseAsync(RouteHelpers.Context(http), existing, RouteHelpers.Param(http, "caseId"), body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DeleteCaseAsync(HttpContextBase http)
        {
            EvalSet existing = await SetAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Sets.DeleteCaseAsync(RouteHelpers.Context(http), existing, RouteHelpers.Param(http, "caseId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ListRunsAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string? setId = RouteHelpers.Query(http, "set");
            if (!String.IsNullOrWhiteSpace(setId)) setId = (await _Sets.ReadAsync(tenantId, setId, http.Token).ConfigureAwait(false)).Id;
            EnumerationResult<EvalRun> page = await _Runs.EnumerateAsync(RouteHelpers.Context(http), tenantId, setId, RouteHelpers.Query(http, "deployment"), RouteHelpers.Query(http, "revision"),
                RouteHelpers.QueryEnum<EvalRunStatusEnum>(http, "status"), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateRunAsync(HttpContextBase http)
        {
            EvalRunRequest body = RouteHelpers.RequiredBody<EvalRunRequest>(http);
            await RouteHelpers.JsonAsync(http, 201, await _Runs.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReadRunAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Runs.ReadAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.Param(http, "evalRunId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ResultsAsync(HttpContextBase http)
        {
            EvalRun existing = await _Runs.ReadAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.Param(http, "evalRunId"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Runs.ResultsAsync(RouteHelpers.Context(http), existing, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CancelRunAsync(HttpContextBase http)
        {
            EvalRun existing = await _Runs.ReadAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.Param(http, "evalRunId"), http.Token).ConfigureAwait(false);
            EvalRunCancelRequest? body = RouteHelpers.Body<EvalRunCancelRequest>(http);
            await RouteHelpers.JsonAsync(http, 200, await _Runs.CancelAsync(RouteHelpers.Context(http), existing, body?.Reason, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<EvalSet> SetAsync(HttpContextBase http)
        {
            return await _Sets.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "setId"), http.Token).ConfigureAwait(false);
        }

        #endregion
    }
}
