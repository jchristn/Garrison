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
    /// Role assignments for users.
    /// </summary>
    public class UserRoleAssignmentsClient : ResourceClient<UserRoleAssignment, AssignmentRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public UserRoleAssignmentsClient(GarrisonTransport transport) : base(transport, "user-role-assignments")
        {
        }

    }
}
