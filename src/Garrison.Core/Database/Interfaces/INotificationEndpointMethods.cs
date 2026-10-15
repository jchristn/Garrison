namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Notification endpoints with their subscribed events (P12.14). Events are a child table replaced with the endpoint.
    /// Every read that takes a tenant filters by it.
    /// </summary>
    public interface INotificationEndpointMethods
    {
        /// <summary>
        /// Insert an endpoint with its events.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<NotificationEndpoint> CreateAsync(NotificationEndpoint obj, CancellationToken token = default);

        /// <summary>
        /// Read an endpoint in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<NotificationEndpoint?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read an endpoint by name in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<NotificationEndpoint?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Replace an endpoint and its events.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<NotificationEndpoint> UpdateAsync(NotificationEndpoint obj, CancellationToken token = default);

        /// <summary>
        /// Delete an endpoint, its events, and its deliveries (queued ones are never sent).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's endpoints (with events). Search matches the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<NotificationEndpoint>> EnumerateAsync(string tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Every active endpoint in every tenant, with events. Used by the leader's event sweep.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Endpoints.</returns>
        Task<List<NotificationEndpoint>> ListActiveAsync(CancellationToken token = default);

        /// <summary>
        /// Names of the tenant's endpoints that filter on a resource.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="column">agentid or deploymentid.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Endpoint names, ordered by name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when column is not one of the listed values.</exception>
        Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default);
    }
}
