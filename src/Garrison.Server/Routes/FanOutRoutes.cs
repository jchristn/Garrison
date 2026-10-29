namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Fan-out group routes (AD5.7): a run's groups, one group with its members' results, and cancelling a group.
    /// </summary>
    public class FanOutRoutes
    {
        #region Private-Members

        private static readonly string _Tag = "Fan-out";
        private readonly ServerContext _Server;
        private readonly FanOutService _FanOuts;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="fanOuts">Fan-out service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public FanOutRoutes(ServerContext server, FanOutService fanOuts)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _FanOuts = fanOuts ?? throw new ArgumentNullException(nameof(fanOuts));
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
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/runs/{id}/fan-out-groups", ResourceTypeEnum.Run, OperationTypeEnum.Read, ListAsync, "List the fan-out groups a run started, oldest first", _Tag, null, typeof(List<FanOutGroupView>));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}", ResourceTypeEnum.FanOutGroup, OperationTypeEnum.Read, ReadAsync, "Read a fan-out group with its members' state and results", _Tag, null, typeof(FanOutGroupView));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/fan-out-groups/{id}/cancel", ResourceTypeEnum.FanOutGroup, OperationTypeEnum.Update, CancelAsync, "Cancel a fan-out group: members still running are cancelled", _Tag, null, typeof(FanOutGroupView));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string runId = RouteHelpers.Param(http, "id") ?? String.Empty;
            if (await _Server.Database.Runs.ReadAsync(tenantId, runId, http.Token).ConfigureAwait(false) == null) throw new NotFoundException("Run not found.");
            List<FanOutGroupView> views = new List<FanOutGroupView>();
            foreach (FanOutGroup group in await _Server.Database.FanOuts.ListByParentAsync(tenantId, runId, http.Token).ConfigureAwait(false))
            {
                views.Add(await _FanOuts.ViewAsync(group, false, http.Token).ConfigureAwait(false));
            }
            await RouteHelpers.JsonAsync(http, 200, views).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            FanOutGroup group = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _FanOuts.ViewAsync(group, false, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CancelAsync(HttpContextBase http)
        {
            FanOutGroup group = await LoadAsync(http).ConfigureAwait(false);
            string who = RouteHelpers.Context(http).PrincipalName ?? "a user";
            await RouteHelpers.JsonAsync(http, 200, await _FanOuts.CancelAsync(group, "Cancelled by " + who + ".", http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<FanOutGroup> LoadAsync(HttpContextBase http)
        {
            return await _Server.Database.FanOuts.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Fan-out group not found.");
        }

        #endregion
    }
}
