namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;

    /// <summary>
    /// Notification endpoints (P12.14): URLs that receive signed JSON notifications about runs, pipeline runs, and
    /// approvals. CRUD needs Read, Create, Update, and Delete on NotificationEndpoint; rotating the secret needs Update and
    /// sending a test needs Execute. Receivers verify each notification with <see cref="WebhookSignature.Verify"/> and
    /// ignore repeated X-Garrison-Delivery values (delivery is at least once).
    /// </summary>
    public class NotificationEndpointsClient : ResourceClient<NotificationEndpoint, NotificationEndpoint>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public NotificationEndpointsClient(GarrisonTransport transport) : base(transport, "notification-endpoints")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Replace the signing secret; the new one is returned only in this response (SigningSecret).
        /// </summary>
        /// <param name="id">Endpoint identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The endpoint with SigningSecret set.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<NotificationEndpoint> RotateSecretAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<NotificationEndpoint>(HttpMethod.Post, Item(id) + "/rotate-secret", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Send a test notification now (also to an inactive endpoint) and return the delivery after its first attempt.
        /// </summary>
        /// <param name="id">Endpoint identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The delivery.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<NotificationDelivery> TestAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<NotificationDelivery>(HttpMethod.Post, Item(id) + "/test", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List an endpoint's deliveries, newest first.
        /// </summary>
        /// <param name="id">Endpoint identifier or name.</param>
        /// <param name="status">Optional status filter.</param>
        /// <param name="query">Optional paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<NotificationDelivery>> ListDeliveriesAsync(string id, NotificationDeliveryStatusEnum? status = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["status"] = status?.ToString();
            return await Transport.SendAsync<EnumerationResult<NotificationDelivery>>(HttpMethod.Get, Item(id) + "/deliveries", null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<NotificationDelivery>();
        }

        /// <summary>
        /// Read one delivery with its payload and last attempt.
        /// </summary>
        /// <param name="id">Endpoint identifier or name.</param>
        /// <param name="deliveryId">Delivery identifier (ndl_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The delivery.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<NotificationDelivery> GetDeliveryAsync(string id, string deliveryId, CancellationToken token = default)
        {
            return await Transport.SendAsync<NotificationDelivery>(HttpMethod.Get, Item(id) + "/deliveries/" + Segment(deliveryId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
