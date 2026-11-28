namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// The activity trail route (LP1.6): GET .../runs/{id}/trail builds a run's trail in one call. Run tokens are refused
    /// with 403 before anything is read (LP-010); everyone else needs Run Read on the run, and each other step of the trail
    /// is checked against their read permission for its kind (LP-004).
    /// </summary>
    public class RunTrailRoutes
    {
        #region Private-Members

        private static readonly string _Tag = "Runs";
        private readonly RunTrailService _Trails;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="trails">Trail service.</param>
        /// <exception cref="ArgumentNullException">Thrown when trails is null.</exception>
        public RunTrailRoutes(RunTrailService trails)
        {
            _Trails = trails ?? throw new ArgumentNullException(nameof(trails));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            List<OpenApiParameterMetadata> query = new List<OpenApiParameterMetadata>
            {
                OpenApiParameterMetadata.Query("includeEffects", "true or false: show the effect journal entries of each run. Default the RunTrail.IncludeEffects cluster setting (true).", false, OpenApiSchemaMetadata.String())
            };
            routes.ScopedByHandler(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/runs/{id}/trail", ResourceTypeEnum.Run, OperationTypeEnum.Read, TrailAsync,
                "The activity trail of a run: every step from where the work started (a caller, trigger, keeper tick, or pipeline run) through child runs, fan-out groups, retries, messages, reports, escalations, approvals, and effects, back to the reply. Carries no agent-written text; steps you may not read are Redacted. Capped by the RunTrail.* settings (truncation names the cap). 403 RunTokenTrailNotAllowed for a run token",
                _Tag, null, typeof(RunTrail), query);
        }

        #endregion

        #region Private-Methods

        private async Task TrailAsync(HttpContextBase http)
        {
            RequestContext ctx = RouteHelpers.Context(http);
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                await RouteHelpers.ErrorAsync(http, 403, "RunTokenTrailNotAllowed", "Activity trails are for people and API credentials; a run token cannot read one.").ConfigureAwait(false);
                return;
            }
            string tenantId = RouteHelpers.Tenant(http);
            string runId = RouteHelpers.Param(http, "id") ?? String.Empty;
            if (!await _Routes!.RequireAsync(http, tenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, runId).ConfigureAwait(false)) return;
            string? raw = RouteHelpers.Query(http, "includeEffects");
            bool? includeEffects = null;
            if (!String.IsNullOrEmpty(raw))
            {
                if (!Boolean.TryParse(raw, out bool parsed))
                {
                    await RouteHelpers.ValidationAsync(http, "The query is invalid.", new Dictionary<string, string> { { "includeEffects", "includeEffects is true or false." } }).ConfigureAwait(false);
                    return;
                }
                includeEffects = parsed;
            }
            RunTrail trail = await _Trails.BuildAsync(ctx, tenantId, runId, includeEffects, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, trail).ConfigureAwait(false);
        }

        #endregion
    }
}
