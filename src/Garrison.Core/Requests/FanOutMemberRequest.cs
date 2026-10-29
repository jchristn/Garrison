namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One member of a garrison_fan_out call (AD5.2).
    /// </summary>
    public class FanOutMemberRequest
    {
        /// <summary>
        /// Agent name or identifier. Required.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// The complete request for the agent. Required.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Short label for the member in results, up to 128 characters. Default: the agent name, numbered when repeated.
        /// </summary>
        public string? Label { get; set; } = null;

        /// <summary>
        /// One of the agent's deployments, or null for the agent's default routing.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Run parameters the agent's deployment allows, or null.
        /// </summary>
        public Dictionary<string, string>? Parameters { get; set; } = null;
    }
}
