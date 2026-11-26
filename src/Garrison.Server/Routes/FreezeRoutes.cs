namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Freeze and kill switch routes (AA3.5): list, read, apply, and lift freezes, and read or set the autonomy kill switch.
    /// Run tokens never hold Freeze permissions, so a run cannot freeze, lift, or flip the switch. Every route filters by
    /// the request's tenant; another tenant's freeze answers 404.
    /// </summary>
    public class FreezeRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly FreezeService _Freezes;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/freezes";
        private static readonly string _KillSwitch = "/v1.0/api/tenants/{tenantId}/autonomy/kill-switch";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="freezes">Freeze service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public FreezeRoutes(ServerContext server, FreezeService freezes)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Freezes = freezes ?? throw new ArgumentNullException(nameof(freezes));
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
            const string tag = "Freezes";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Freeze, OperationTypeEnum.Read, ListAsync, "List freezes, active first, then newest first (query: targetKind, targetId, active, maxResults, skip)", tag, null, typeof(EnumerationResult<Freeze>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Freeze, OperationTypeEnum.Create, ApplyAsync, "Apply a freeze to an agent, deployment, mandate, or app (targetId takes an identifier or a name). New runs in scope are refused with 409 Frozen and keepers in scope stop ticking; cancelActiveRuns also cancels the runs already in scope", tag, typeof(Freeze), typeof(Freeze));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Freeze, OperationTypeEnum.Read, ReadAsync, "Read a freeze", tag, null, typeof(Freeze));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/lift", ResourceTypeEnum.Freeze, OperationTypeEnum.Update, LiftAsync, "Lift an active freeze. A frozen keeper becomes Active again with its next wake spread over a short window", tag, typeof(FreezeLiftRequest), typeof(Freeze));
            routes.Scoped(HttpMethod.GET, _KillSwitch, ResourceTypeEnum.Freeze, OperationTypeEnum.Read, ReadKillSwitchAsync, "Read the autonomy kill switch", tag, null, typeof(KillSwitchState));
            routes.Scoped(HttpMethod.PUT, _KillSwitch, ResourceTypeEnum.Freeze, OperationTypeEnum.Update, SetKillSwitchAsync, "Turn the autonomy kill switch on or off. While it is on, no keeper ticks start and keeper runs are refused; ordinary invocations keep working", tag, typeof(KillSwitchRequest), typeof(KillSwitchState));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            FreezeFilter filter = new FreezeFilter();
            filter.TenantId = RouteHelpers.Tenant(http);
            filter.TargetKind = RouteHelpers.QueryEnum<FreezeTargetKindEnum>(http, "targetKind");
            filter.TargetId = RouteHelpers.Query(http, "targetId");
            filter.Active = RouteHelpers.QueryBool(http, "active");
            filter.MaxResults = query.MaxResults;
            filter.Skip = query.Skip;
            EnumerationResult<Freeze> page = await _Server.Database.Freezes.EnumerateAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ApplyAsync(HttpContextBase http)
        {
            Freeze request = RouteHelpers.RequiredBody<Freeze>(http);
            Freeze applied = await _Freezes.ApplyAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, applied).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Freeze freeze = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, freeze).ConfigureAwait(false);
        }

        private async Task LiftAsync(HttpContextBase http)
        {
            Freeze freeze = await LoadAsync(http).ConfigureAwait(false);
            FreezeLiftRequest? request = RouteHelpers.Body<FreezeLiftRequest>(http);
            Freeze lifted = await _Freezes.LiftAsync(RouteHelpers.Context(http), freeze, request?.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, lifted).ConfigureAwait(false);
        }

        private async Task ReadKillSwitchAsync(HttpContextBase http)
        {
            KillSwitchState state = await _Freezes.ReadKillSwitchAsync(RouteHelpers.Tenant(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, state).ConfigureAwait(false);
        }

        private async Task SetKillSwitchAsync(HttpContextBase http)
        {
            KillSwitchRequest request = RouteHelpers.RequiredBody<KillSwitchRequest>(http);
            KillSwitchState state = await _Freezes.SetKillSwitchAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, state).ConfigureAwait(false);
        }

        private async Task<Freeze> LoadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Freeze? freeze = String.IsNullOrEmpty(id) ? null : await _Server.Database.Freezes.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (freeze == null) throw new NotFoundException("Freeze " + id + " not found.");
            return freeze;
        }

        #endregion
    }
}
