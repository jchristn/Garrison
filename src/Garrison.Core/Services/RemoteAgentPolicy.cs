namespace Garrison.Core.Services
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Admission and compile-time checks for remote registrations. Stateless and thread-safe.</summary>
    public static class RemoteAgentPolicy
    {
        /// <summary>Whether the remote registration has expired. A nonzero TTL needs a registration timestamp.</summary>
        /// <param name="agent">Remote agent.</param>
        /// <param name="nowUtc">Current UTC time.</param>
        /// <returns>True when expired.</returns>
        public static bool Expired(Agent agent, DateTime nowUtc)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            return agent.RegistrationTtlSeconds > 0 && (!agent.LastRegisteredUtc.HasValue || agent.LastRegisteredUtc.Value.AddSeconds(agent.RegistrationTtlSeconds) <= nowUtc);
        }

        /// <summary>Require an active, unexpired registration with a configured protocol and endpoint.</summary>
        /// <param name="agent">Remote agent.</param>
        /// <exception cref="ConflictException">Registration is inactive, expired, or invalid.</exception>
        public static void Require(Agent agent)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            if (!agent.Active) throw new ConflictException("AgentInactive", "Remote agent " + agent.Name + " is inactive.");
            if (Expired(agent, DateTime.UtcNow)) throw new ConflictException("RemoteRegistrationExpired", "Remote agent " + agent.Name + " must renew its registration before it can be invoked.");
            if (!agent.RemoteProtocol.HasValue || !Uri.TryCreate(agent.RemoteEndpointUrl, UriKind.Absolute, out Uri? endpoint) || (endpoint.Scheme != "http" && endpoint.Scheme != "https") || endpoint.UserInfo.Length > 0 || endpoint.Fragment.Length > 0)
                throw new ConflictException("RemoteRegistrationInvalid", "Remote agent needs a protocol and an absolute HTTP endpoint without credentials or a fragment.");
            if (agent.RemoteProtocol == RemoteProtocolEnum.Mcp && String.IsNullOrWhiteSpace(agent.McpToolName))
                throw new ConflictException("RemoteToolRequired", "Remote MCP agents need mcpToolName naming the tool to invoke.");
        }
    }
}
