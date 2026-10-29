namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Environment and promotion routes (AD1.5): read and replace the tenant's ordered environment list, promote a
    /// revision, roll a promotion back, and list promotion records. Promote and rollback authorize Execute on Promotion
    /// against the target environment named in the request or the record, so a Releaser grant scoped to one environment
    /// works.
    /// </summary>
    public class PromotionRoutes
    {
        #region Private-Members

        private static readonly string _Tenant = "/v1.0/api/tenants/{tenantId}";
        private static readonly string _Tag = "Environments and promotions";

        private readonly ServerContext _Server;
        private readonly PromotionService _Promotions;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="promotions">Promotion service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public PromotionRoutes(ServerContext server, PromotionService promotions)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Promotions = promotions ?? throw new ArgumentNullException(nameof(promotions));
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
            routes.Scoped(HttpMethod.GET, _Tenant + "/environments", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ListEnvironmentsAsync, "Read the tenant's ordered environment list", _Tag, null, typeof(TenantEnvironmentList));
            routes.Scoped(HttpMethod.PUT, _Tenant + "/environments", ResourceTypeEnum.Tenant, OperationTypeEnum.Update, ReplaceEnvironmentsAsync, "Replace the tenant's ordered environment list", _Tag, typeof(TenantEnvironmentList), typeof(TenantEnvironmentList));
            routes.Scoped(HttpMethod.GET, _Tenant + "/promotions", ResourceTypeEnum.Promotion, OperationTypeEnum.Read, ListAsync, "List promotion and rollback records, newest first", _Tag, null, typeof(EnumerationResult<PromotionRecord>),
                "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("agentId", "Only records for this agent.", false, OpenApiSchemaMetadata.String()), OpenApiParameterMetadata.Query("appId", "Only records for this agentic app.", false, OpenApiSchemaMetadata.String()) });
            routes.ScopedByHandler(HttpMethod.POST, _Tenant + "/promotions", ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, PromoteAsync, "Promote a revision to the next environment (Execute on Promotion for the target environment)", _Tag, typeof(PromotionRequest), typeof(PromotionRecord));
            routes.Scoped(HttpMethod.GET, _Tenant + "/promotions/{id}", ResourceTypeEnum.Promotion, OperationTypeEnum.Read, ReadAsync, "Read a promotion record", _Tag, null, typeof(PromotionRecord));
            routes.ScopedByHandler(HttpMethod.POST, _Tenant + "/promotions/{id}/rollback", ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, RollbackAsync, "Roll a promotion back, restoring the exact previous pins (Execute on Promotion for its target environment)", _Tag, typeof(PromotionRollbackRequest), typeof(PromotionRecord));
        }

        #endregion

        #region Private-Methods

        private async Task ListEnvironmentsAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Promotions.ListEnvironmentsAsync(RouteHelpers.Tenant(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReplaceEnvironmentsAsync(HttpContextBase http)
        {
            TenantEnvironmentList list = await _Promotions.ReplaceEnvironmentsAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<TenantEnvironmentList>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, list).ConfigureAwait(false);
        }

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<PromotionRecord> page = await _Server.Database.Promotions.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Query(http, "agentId"), RouteHelpers.Query(http, "appId"), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            PromotionRecord? record = await _Server.Database.Promotions.ReadAsync(RouteHelpers.Tenant(http), id, http.Token).ConfigureAwait(false);
            if (record == null)
            {
                await RouteHelpers.NotFoundAsync(http, "Promotion " + id).ConfigureAwait(false);
                return;
            }
            await RouteHelpers.JsonAsync(http, 200, record).ConfigureAwait(false);
        }

        private async Task PromoteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            PromotionRecord? record = await _Promotions.PromoteAsync(RouteHelpers.Context(http), tenantId, RouteHelpers.RequiredBody<PromotionRequest>(http), target => AuthorizeTargetAsync(http, tenantId, target), http.Token).ConfigureAwait(false);
            if (record == null) return;
            await RouteHelpers.JsonAsync(http, 201, record).ConfigureAwait(false);
        }

        private async Task RollbackAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            PromotionRollbackRequest? request = RouteHelpers.Body<PromotionRollbackRequest>(http);
            PromotionRecord? record = await _Promotions.RollbackAsync(RouteHelpers.Context(http), tenantId, RouteHelpers.Param(http, "id") ?? String.Empty, request?.Note, target => AuthorizeTargetAsync(http, tenantId, target), http.Token).ConfigureAwait(false);
            if (record == null) return;
            await RouteHelpers.JsonAsync(http, 201, record).ConfigureAwait(false);
        }

        private Task<bool> AuthorizeTargetAsync(HttpContextBase http, string tenantId, string environment)
        {
            if (_Routes == null) throw new InvalidOperationException("Routes are not registered.");
            return _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, environment);
        }

        #endregion
    }
}
