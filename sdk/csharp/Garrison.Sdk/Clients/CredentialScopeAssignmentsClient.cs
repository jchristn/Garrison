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
    /// Role assignments for credentials.
    /// </summary>
    public class CredentialScopeAssignmentsClient : ResourceClient<CredentialScopeAssignment, AssignmentRequest>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public CredentialScopeAssignmentsClient(GarrisonTransport transport) : base(transport, "credential-scope-assignments")
        {
        }

    }
}
