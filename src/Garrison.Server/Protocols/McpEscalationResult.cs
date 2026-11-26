namespace Garrison.Server.Protocols
{
    using System;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_escalate (AA2.7): the escalation, and for a Blocking one the instruction to stop and wait.</summary>
    public class McpEscalationResult
    {
        /// <summary>The escalation.</summary>
        public Escalation Escalation { get; set; } = new Escalation();

        /// <summary>What happens next, for the agent.</summary>
        public string Message { get; set; } = String.Empty;

        /// <summary>For a Blocking escalation: the continuation instruction the harness must follow to suspend, or null.</summary>
        public string? ContinuationInstruction { get; set; } = null;
    }
}
