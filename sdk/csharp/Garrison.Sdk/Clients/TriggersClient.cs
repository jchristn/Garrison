namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Triggers (P12.5): cron schedules and signed webhooks that start an agent run or a pipeline run. List, get (by
    /// identifier or name), create, update, and delete need Read, Create, Update, and Delete on Trigger; create and update
    /// also need Execute on the target agent (or pipeline and its stage agents), because the trigger runs as the caller.
    /// Rotating the signing secret needs Update; firing by hand needs Execute.
    /// </summary>
    public class TriggersClient : ResourceClient<Trigger, Trigger>
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public TriggersClient(GarrisonTransport transport) : base(transport, "triggers")
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List triggers, optionally of one type.
        /// </summary>
        /// <param name="query">Optional paging, ordering, and search.</param>
        /// <param name="type">Optional type filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Trigger>> ListAsync(EnumerationQuery? query, TriggerTypeEnum? type, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["type"] = type?.ToString();
            return await Transport.SendAsync<EnumerationResult<Trigger>>(HttpMethod.Get, Collection(), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<Trigger>();
        }

        /// <summary>
        /// Replace a webhook trigger's signing secret. The old secret stops working at once; the new one is returned only
        /// in this response (SigningSecret).
        /// </summary>
        /// <param name="id">Trigger identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The trigger with SigningSecret set.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Trigger> RotateSecretAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Trigger>(HttpMethod.Post, Item(id) + "/rotate-secret", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Fire a trigger now. The optional payload reaches the input template as webhook.body.
        /// </summary>
        /// <param name="id">Trigger identifier or name.</param>
        /// <param name="request">Optional payload; null fires without one.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The fire record (Started with a run or pipeline run, or Failed with an error code).</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<TriggerFire> FireAsync(string id, TriggerFireRequest? request = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<TriggerFire>(HttpMethod.Post, Item(id) + "/fire", request ?? new TriggerFireRequest(), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// List a trigger's fires, newest first.
        /// </summary>
        /// <param name="id">Trigger identifier or name.</param>
        /// <param name="outcome">Optional outcome filter.</param>
        /// <param name="query">Optional paging.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<TriggerFire>> ListFiresAsync(string id, TriggerFireOutcomeEnum? outcome = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            parameters["outcome"] = outcome?.ToString();
            return await Transport.SendAsync<EnumerationResult<TriggerFire>>(HttpMethod.Get, Item(id) + "/fires", null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<TriggerFire>();
        }

        /// <summary>
        /// Deliver a signed webhook to a Webhook trigger, as an external sender would: the body is signed with
        /// <see cref="WebhookSignature.Header(string, long, byte[])"/> at the current time. The webhook route needs no
        /// credentials; the signature authorizes it. A repeated delivery identifier returns the earlier fire with
        /// Duplicate set (HTTP 200); a new delivery answers 202.
        /// </summary>
        /// <param name="id">Trigger identifier (the webhook URL takes the identifier, not the name).</param>
        /// <param name="signingSecret">The trigger's signing secret.</param>
        /// <param name="body">Raw body bytes.</param>
        /// <param name="contentType">Body media type. Default application/json.</param>
        /// <param name="deliveryId">Optional delivery identifier (X-Garrison-Delivery, 1 to 128 printable characters).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The fire record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when signingSecret or body is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown with 401 InvalidSignature, 409 TriggerInactive, or 413.</exception>
        public async Task<TriggerFire> DeliverWebhookAsync(string id, string signingSecret, byte[] body, string contentType = "application/json", string? deliveryId = null, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(signingSecret)) throw new ArgumentNullException(nameof(signingSecret));
            if (body == null) throw new ArgumentNullException(nameof(body));
            Dictionary<string, string?> headers = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
            headers[WebhookSignature.SignatureHeader] = WebhookSignature.Header(signingSecret, DateTimeOffset.UtcNow.ToUnixTimeSeconds(), body);
            headers[WebhookSignature.DeliveryHeader] = deliveryId;
            return await Transport.SendBinaryWithHeadersAsync<TriggerFire>(HttpMethod.Post, Item(id) + "/webhook", body, contentType, headers, token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Deliver a signed webhook with a UTF-8 text body. See <see cref="DeliverWebhookAsync(string, string, byte[], string, string?, CancellationToken)"/>.
        /// </summary>
        /// <param name="id">Trigger identifier.</param>
        /// <param name="signingSecret">The trigger's signing secret.</param>
        /// <param name="body">Body text.</param>
        /// <param name="contentType">Body media type. Default application/json.</param>
        /// <param name="deliveryId">Optional delivery identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The fire record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when signingSecret or body is null.</exception>
        public Task<TriggerFire> DeliverWebhookAsync(string id, string signingSecret, string body, string contentType = "application/json", string? deliveryId = null, CancellationToken token = default)
        {
            if (body == null) throw new ArgumentNullException(nameof(body));
            return DeliverWebhookAsync(id, signingSecret, Encoding.UTF8.GetBytes(body), contentType, deliveryId, token);
        }

        #endregion
    }
}
