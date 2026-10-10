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
    /// Role to permission mappings. Update is not supported by the server.
    /// </summary>
    public class RolePermissionsClient : ResourceClient<RolePermissionMap, RolePermissionRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public RolePermissionsClient(GarrisonTransport transport) : base(transport, "role-permissions")
        {
        }

    }
}
