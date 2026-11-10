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
    /// Secrets. Reads return metadata only. The decrypted value comes back only from RevealAsync, which needs Admin on
    /// Secret and writes a SecretRevealed audit record.
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

        /// <summary>
        /// Reveal a secret's decrypted value. Requires Admin on Secret (SecretManager, TenantAdmin, or ResourceAdmin).
        /// Each call writes a SecretRevealed audit record, and the server sends Cache-Control: no-store.
        /// </summary>
        /// <param name="id">Secret identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The secret's identity and decrypted value.</returns>
        /// <exception cref="GarrisonException">403 without Admin on Secret; 404 for an unknown secret; 409 with code
        /// NotRevealable for a LeaseBroker secret, NoValue when no value is stored, or ValueUnreadable when the value
        /// cannot be decrypted with the configured master keys.</exception>
        /// <exception cref="InvalidOperationException">The server returned an empty body.</exception>
        public async Task<SecretReveal> RevealAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<SecretReveal>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/reveal", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
