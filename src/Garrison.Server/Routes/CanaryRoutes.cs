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
    /// Canary release routes (AA9.12): people start a release that moves an agent's traffic from a baseline deployment to
    /// a candidate in steps of weight, read its progress, and abort it. Every route filters by the request's tenant;
    /// another tenant's release answers 404.
    /// </summary>
    public class CanaryRoutes
    {
        #region Private-Members

        private readonly CanaryService _Canaries;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/canary-releases";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="canaries">Canary service.</param>
        /// <exception cref="ArgumentNullException">Thrown when canaries is null.</exception>
        public CanaryRoutes(CanaryService canaries)
        {
            _Canaries = canaries ?? throw new ArgumentNullException(nameof(canaries));
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
            const string tag = "Canary releases";
            string one = _Base + "/{releaseId}";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.CanaryRelease, OperationTypeEnum.Read, ListAsync, "List canary releases, newest first (query: agent, status, maxResults, skip)", tag, null, typeof(EnumerationResult<CanaryRelease>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.CanaryRelease, OperationTypeEnum.Create, StartAsync, "Start a canary release (people only): agentId, candidateDeploymentId, baselineDeploymentId, steps (weightPercent rising to 100, minimumRuns, minimumMinutes), maxErrorRatePercent, optional minEvalScore with evalSetId. Needs Deployment.Update on both deployments", tag, typeof(CanaryRelease), typeof(CanaryRelease));
            routes.Scoped(HttpMethod.GET, one, ResourceTypeEnum.CanaryRelease, OperationTypeEnum.Read, ReadAsync, "Read a canary release with its current step and rollback reason", tag, null, typeof(CanaryRelease), "releaseId");
            routes.Scoped(HttpMethod.POST, one + "/abort", ResourceTypeEnum.CanaryRelease, OperationTypeEnum.Update, AbortAsync, "Abort a running canary release (people only); both deployments go back to their weights from before the release", tag, typeof(CanaryAbortRequest), typeof(CanaryRelease), "releaseId");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<CanaryRelease> page = await _Canaries.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Query(http, "agent"), RouteHelpers.QueryEnum<CanaryStatusEnum>(http, "status"), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task StartAsync(HttpContextBase http)
        {
            CanaryRelease body = RouteHelpers.RequiredBody<CanaryRelease>(http);
            CanaryRelease started = await _Canaries.StartAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, started).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Canaries.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "releaseId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task AbortAsync(HttpContextBase http)
        {
            CanaryRelease release = await _Canaries.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "releaseId"), http.Token).ConfigureAwait(false);
            CanaryAbortRequest? body = RouteHelpers.Body<CanaryAbortRequest>(http);
            CanaryRelease aborted = await _Canaries.AbortAsync(RouteHelpers.Context(http), release, body?.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, aborted).ConfigureAwait(false);
        }

        #endregion
    }
}
