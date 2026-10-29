namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One allowed call between members of an agentic app (AD6.1): the caller may delegate to the callee. The app's
    /// edges are the graph each member's delegation policy is derived from (AD6.3).
    /// </summary>
    public class AgenticAppEdge
    {
        /// <summary>
        /// Calling member's agent identifier.
        /// </summary>
        public string CallerAgentId { get; set; } = String.Empty;

        /// <summary>
        /// Called member's agent identifier.
        /// </summary>
        public string CalleeAgentId { get; set; } = String.Empty;

        /// <summary>
        /// Whether the caller may start the callee in a fan-out group. Default true.
        /// </summary>
        public bool FanOutAllowed { get; set; } = true;
    }
}
