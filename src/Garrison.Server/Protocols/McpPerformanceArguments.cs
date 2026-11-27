namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>Typed arguments of garrison_subordinate_performance (AA11.2). Tenant identity comes from the authenticated caller.</summary>
    public class McpPerformanceArguments
    {
        /// <summary>People only: organization identifier or name. Required for people; a run uses the organization whose unit its agent leads.</summary>
        public string? Organization { get; set; } = null;

        /// <summary>Unit (identifier or name) whose subtree to report, or null: a run's own unit, or the whole organization for people.</summary>
        public string? UnitId { get; set; } = null;

        /// <summary>Inclusive window start (UTC), or null for 7 days before toUtc.</summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>Exclusive window end (UTC), or null for now. The window is at most 90 days.</summary>
        public DateTime? ToUtc { get; set; } = null;
    }
}
