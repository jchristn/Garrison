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
    /// Roles (built-in and custom).
    /// </summary>
    public class RolesClient : ResourceClient<Role, RoleRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public RolesClient(GarrisonTransport transport) : base(transport, "roles")
        {
        }

        /// <summary>
        /// Clone a role into a custom role.
        /// </summary>
        /// <param name="id">Role identifier.</param>
        /// <param name="request">New role name and description.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>New role.</returns>
        public async Task<Role> CloneAsync(string id, RoleRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<Role>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/clone", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
