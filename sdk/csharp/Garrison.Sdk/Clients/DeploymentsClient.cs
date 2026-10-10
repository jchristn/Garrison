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
    /// Deployments binding agents to harness profiles, prompts, and resources.
    /// </summary>
    public class DeploymentsClient : ResourceClient<Deployment, Deployment>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public DeploymentsClient(GarrisonTransport transport) : base(transport, "deployments")
        {
        }

        /// <summary>
        /// Compile a preview of the execution spec (secrets redacted).
        /// </summary>
        /// <param name="id">Deployment identifier.</param>
        /// <param name="request">Sample input and parameters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Preview.</returns>
        public async Task<CompilePreviewResponse> CompilePreviewAsync(string id, CompilePreviewRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<CompilePreviewResponse>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/compile-preview", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Invoke a specific deployment with a test input.
        /// </summary>
        /// <param name="id">Deployment identifier.</param>
        /// <param name="request">Invocation request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run.</returns>
        public async Task<Run> TestAsync(string id, InvokeRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<Run>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/test", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
