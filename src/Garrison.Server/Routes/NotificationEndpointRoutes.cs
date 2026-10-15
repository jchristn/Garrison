namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Notification endpoint routes (P12.14) under /v1.0/api/tenants/{tenantId}/notification-endpoints: CRUD through the
    /// shared tenant configuration service, signing secret rotation, a test notification, and the delivery log.
    /// </summary>
    public class NotificationEndpointRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly TenantConfigurationService _Mutations;
        private readonly NotificationService _Notifications;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/notification-endpoints";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="notifications">Notification service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public NotificationEndpointRoutes(ServerContext server, NotificationService notifications)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Notifications = notifications ?? throw new ArgumentNullException(nameof(notifications));
            _Mutations = new TenantConfigurationService(_Server);
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
            const string tag = "Notifications";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Read, ListAsync, "List notification endpoints", tag, null, typeof(EnumerationResult<NotificationEndpoint>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Create, CreateAsync, "Create a notification endpoint (the URL is checked against the SSRF rules; signingSecret is returned only in this response)", tag, typeof(NotificationEndpoint), typeof(NotificationEndpoint));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Read, ReadAsync, "Read a notification endpoint by identifier or name", tag, null, typeof(NotificationEndpoint));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Update, UpdateAsync, "Update a notification endpoint by identifier or name (the signing secret is kept)", tag, typeof(NotificationEndpoint), typeof(NotificationEndpoint));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Delete, DeleteAsync, "Delete a notification endpoint and its delivery log by identifier or name; queued notifications are not sent", tag);
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/rotate-secret", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Update, RotateAsync, "Replace the signing secret; the new secret is returned only in this response", tag, null, typeof(NotificationEndpoint));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/test", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Execute, TestAsync, "Send a test notification now and answer with the delivery after its first attempt", tag, null, typeof(NotificationDelivery));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/deliveries", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Read, DeliveriesAsync, "List an endpoint's deliveries, newest first (query: status Pending, Delivering, Succeeded, or Failed)", tag, null, typeof(EnumerationResult<NotificationDelivery>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/deliveries/{deliveryId}", ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Read, DeliveryAsync, "Read one delivery with its payload and last attempt", tag, null, typeof(NotificationDelivery));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<NotificationEndpoint> page = await _Server.Database.NotificationEndpoints.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            NotificationEndpoint created = await _Mutations.CreateNotificationEndpointAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<NotificationEndpoint>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            NotificationEndpoint? endpoint = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (endpoint == null) return;
            await RouteHelpers.JsonAsync(http, 200, endpoint).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            NotificationEndpoint? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            NotificationEndpoint updated = await _Mutations.UpdateNotificationEndpointAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<NotificationEndpoint>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            NotificationEndpoint? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            await _Mutations.DeleteNotificationEndpointAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task RotateAsync(HttpContextBase http)
        {
            NotificationEndpoint? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            NotificationEndpoint rotated = await _Mutations.RotateNotificationEndpointSecretAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, rotated).ConfigureAwait(false);
        }

        private async Task TestAsync(HttpContextBase http)
        {
            NotificationEndpoint? endpoint = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (endpoint == null) return;
            NotificationDelivery delivery = await _Notifications.SendTestAsync(endpoint, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, delivery).ConfigureAwait(false);
        }

        private async Task DeliveriesAsync(HttpContextBase http)
        {
            NotificationEndpoint? endpoint = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (endpoint == null) return;
            NotificationDeliveryStatusEnum? status = RouteHelpers.QueryEnum<NotificationDeliveryStatusEnum>(http, "status");
            EnumerationResult<NotificationDelivery> page = await _Server.Database.NotificationDeliveries.EnumerateAsync(endpoint.TenantId, endpoint.Id, status, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task DeliveryAsync(HttpContextBase http)
        {
            NotificationEndpoint? endpoint = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (endpoint == null) return;
            string deliveryId = RouteHelpers.Param(http, "deliveryId") ?? String.Empty;
            NotificationDelivery? delivery = String.IsNullOrEmpty(deliveryId) ? null : await _Server.Database.NotificationDeliveries.ReadAsync(endpoint.TenantId, deliveryId, http.Token).ConfigureAwait(false);
            if (delivery == null || delivery.EndpointId != endpoint.Id) throw new NotFoundException("Delivery " + deliveryId + " not found.");
            await RouteHelpers.JsonAsync(http, 200, delivery).ConfigureAwait(false);
        }

        private async Task<NotificationEndpoint?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            NotificationEndpoint? endpoint = String.IsNullOrEmpty(idOrName) ? null : await _Server.Database.NotificationEndpoints.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (endpoint == null && !String.IsNullOrEmpty(idOrName)) endpoint = await _Server.Database.NotificationEndpoints.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (endpoint == null) throw new NotFoundException("Notification endpoint " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (endpoint.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.NotificationEndpoint, operation, endpoint.Id).ConfigureAwait(false)) return null;
            return endpoint;
        }

        #endregion
    }
}
