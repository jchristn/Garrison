namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Secrets. Values are write-only.
    /// </summary>
    public class SecretsClient : ResourceClient<Secret, SecretRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public SecretsClient(GarrisonTransport transport) : base(transport, "secrets")
        {
        }

        /// <summary>
        /// Set a secret value.
        /// </summary>
        /// <param name="id">Secret identifier.</param>
        /// <param name="value">Value.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Secret metadata.</returns>
        public async Task<Secret> SetValueAsync(string id, string value, CancellationToken token = default)
        {
            return await Transport.SendAsync<Secret>(HttpMethod.Put, Collection() + "/" + Segment(id) + "/value", new SecretValueRequest { Value = value }, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Rotate a secret value.
        /// </summary>
        /// <param name="id">Secret identifier.</param>
        /// <param name="value">New value.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Secret metadata.</returns>
        public async Task<Secret> RotateAsync(string id, string value, CancellationToken token = default)
        {
            return await Transport.SendAsync<Secret>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/rotate", new SecretValueRequest { Value = value }, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
