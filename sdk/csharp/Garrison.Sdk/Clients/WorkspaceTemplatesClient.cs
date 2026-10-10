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
    /// Workspace templates.
    /// </summary>
    public class WorkspaceTemplatesClient : ResourceClient<WorkspaceTemplate, WorkspaceTemplate>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public WorkspaceTemplatesClient(GarrisonTransport transport) : base(transport, "workspace-templates")
        {
        }

    }
}
