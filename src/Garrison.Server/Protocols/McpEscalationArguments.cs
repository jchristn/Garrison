namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Typed arguments of the escalation tools (AA2.7). Tenant identity comes from the authenticated caller.</summary>
    public class McpEscalationArguments
    {
        /// <summary>Escalation identifier (get, withdraw, answer), or null.</summary>
        public string? EscalationId { get; set; } = null;

        /// <summary>The question to ask (garrison_escalate).</summary>
        public string? Question { get; set; } = null;

        /// <summary>What the answerer needs to know, or null.</summary>
        public string? Context { get; set; } = null;

        /// <summary>Choices to offer, or null for a free-text answer.</summary>
        public List<EscalationOption>? Options { get; set; } = null;

        /// <summary>Info, Warning (default), or Urgent; a filter when listing.</summary>
        public string? Severity { get; set; } = null;

        /// <summary>NonBlocking (default) or Blocking.</summary>
        public string? Mode { get; set; } = null;

        /// <summary>User, Role, Agent, or Manager; null uses the default target.</summary>
        public string? TargetKind { get; set; } = null;

        /// <summary>User, role, or agent identifier or name, or null.</summary>
        public string? TargetId { get; set; } = null;

        /// <summary>Answer used when the timeout action is UseDefaultAnswer, or null.</summary>
        public string? DefaultAnswer { get; set; } = null;

        /// <summary>Seconds until the timeout action runs, or null for Escalations.DefaultTimeoutSeconds.</summary>
        public int? TimeoutSeconds { get; set; } = null;

        /// <summary>UseDefaultAnswer, Cancel, or EscalateUp (default).</summary>
        public string? TimeoutAction { get; set; } = null;

        /// <summary>Chosen option key (answer), or null.</summary>
        public string? Choice { get; set; } = null;

        /// <summary>Answer text (answer), or null.</summary>
        public string? Text { get; set; } = null;

        /// <summary>Reason for withdrawing, or null.</summary>
        public string? Reason { get; set; } = null;

        /// <summary>Status filter for listing, or null.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Raising agent filter for listing, or null.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Mandate filter for listing, or null.</summary>
        public string? Mandate { get; set; } = null;

        /// <summary>Most results, 1 to 100. Default 25.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
