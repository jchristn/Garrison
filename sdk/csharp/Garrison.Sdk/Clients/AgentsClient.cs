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
    /// Agents.
    /// </summary>
    public class AgentsClient : ResourceClient<Agent, Agent>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AgentsClient(GarrisonTransport transport) : base(transport, "agents")
        {
        }

        /// <summary>
        /// Invoke an agent. With wait true the call returns the finished run when it completes within waitSeconds.
        /// </summary>
        /// <param name="agent">Agent identifier or name.</param>
        /// <param name="request">Invocation request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run.</returns>
        public async Task<Run> InvokeAsync(string agent, InvokeRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Run>(HttpMethod.Post, Collection() + "/" + Segment(agent) + "/invoke", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Read the agent's A2A agent card as raw JSON.
        /// </summary>
        /// <param name="id">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Card JSON.</returns>
        public async Task<string> GetCardAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendTextAsync(HttpMethod.Get, Collection() + "/" + Segment(id) + "/card", token: token).ConfigureAwait(false);
        }
        /// <summary>
        /// Self-register an agent (idempotent by name).
        /// </summary>
        /// <param name="agent">Agent definition.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Registered agent.</returns>
        public async Task<Agent> RegisterAsync(Agent agent, CancellationToken token = default)
        {
            return await Transport.SendAsync<Agent>(HttpMethod.Post, Collection() + "/register", agent, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
