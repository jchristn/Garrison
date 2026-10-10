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
    /// Credentials (access keys) in the client's tenant. CreateWithSecretAsync returns the secret, which is shown only once.
    /// </summary>
    public class CredentialsClient : ResourceClient<Credential, CredentialRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public CredentialsClient(GarrisonTransport transport) : base(transport, "credentials")
        {
        }

        /// <summary>
        /// Effective permissions.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Effective permissions.</returns>
        public async Task<EffectivePermissionsResponse> GetPermissionsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<EffectivePermissionsResponse>(HttpMethod.Get, Collection() + "/" + Segment(id) + "/permissions", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Create a credential and return its secret key (shown only once).
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential with access and secret keys.</returns>
        public async Task<CredentialCreateResponse> CreateWithSecretAsync(CredentialRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<CredentialCreateResponse>(HttpMethod.Post, Collection(), request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Rotate a credential's secret key.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Credential with the new secret key.</returns>
        public async Task<CredentialCreateResponse> RotateAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<CredentialCreateResponse>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/rotate", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
