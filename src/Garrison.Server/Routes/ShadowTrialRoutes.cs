namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Shadow trial routes (AA9.12): people start a trial that copies a share of a source deployment's runs to a
    /// candidate deployment as shadow runs, read its agreed and diverged counts, and stop it. Every route filters by the
    /// request's tenant; another tenant's trial answers 404.
    /// </summary>
    public class ShadowTrialRoutes
    {
        #region Private-Members

        private readonly ShadowTrialService _Trials;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/shadow-trials";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="trials">Shadow trial service.</param>
        /// <exception cref="ArgumentNullException">Thrown when trials is null.</exception>
        public ShadowTrialRoutes(ShadowTrialService trials)
        {
            _Trials = trials ?? throw new ArgumentNullException(nameof(trials));
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
            const string tag = "Shadow trials";
            string one = _Base + "/{trialId}";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.ShadowTrial, OperationTypeEnum.Read, ListAsync, "List shadow trials, newest first (query: source, candidate, status, maxResults, skip)", tag, null, typeof(EnumerationResult<ShadowTrial>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.ShadowTrial, OperationTypeEnum.Create, CreateAsync, "Start a shadow trial (people only): sourceDeploymentId and candidateDeploymentId of the same agent, samplePercent 1 to 100, optional name, endsUtc, comparisonEvalSetId, useJudge. Needs Agent.Execute on the agent", tag, typeof(ShadowTrial), typeof(ShadowTrial));
            routes.Scoped(HttpMethod.GET, one, ResourceTypeEnum.ShadowTrial, OperationTypeEnum.Read, ReadAsync, "Read a shadow trial with its compared, agreed, diverged, and candidate failure counts", tag, null, typeof(ShadowTrial), "trialId");
            routes.Scoped(HttpMethod.POST, one + "/stop", ResourceTypeEnum.ShadowTrial, OperationTypeEnum.Update, StopAsync, "Stop a running shadow trial (people only); shadow runs already started finish and are still compared", tag, typeof(ShadowTrialStopRequest), typeof(ShadowTrial), "trialId");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<ShadowTrial> page = await _Trials.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Query(http, "source"), RouteHelpers.Query(http, "candidate"), RouteHelpers.QueryEnum<ShadowTrialStatusEnum>(http, "status"), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            ShadowTrial body = RouteHelpers.RequiredBody<ShadowTrial>(http);
            ShadowTrial created = await _Trials.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Trials.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "trialId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task StopAsync(HttpContextBase http)
        {
            ShadowTrial trial = await _Trials.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "trialId"), http.Token).ConfigureAwait(false);
            ShadowTrialStopRequest? body = RouteHelpers.Body<ShadowTrialStopRequest>(http);
            ShadowTrial stopped = await _Trials.StopAsync(RouteHelpers.Context(http), trial, body?.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, stopped).ConfigureAwait(false);
        }

        #endregion
    }
}
