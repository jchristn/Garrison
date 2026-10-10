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
    /// Users in the client's tenant.
    /// </summary>
    public class UsersClient : ResourceClient<User, UserRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public UsersClient(GarrisonTransport transport) : base(transport, "users")
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
    }
}
