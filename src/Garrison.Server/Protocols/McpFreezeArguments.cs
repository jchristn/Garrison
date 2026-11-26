namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of the freeze tools (AA3.5). Tenant identity comes from the authenticated caller.</summary>
    public class McpFreezeArguments
    {
        /// <summary>Freeze identifier (garrison_lift_freeze), or null.</summary>
        public string? FreezeId { get; set; } = null;

        /// <summary>Agent, Deployment, Mandate, App, or TenantAutonomy (garrison_freeze); a filter when listing.</summary>
        public string? TargetKind { get; set; } = null;

        /// <summary>Identifier or name of the target (garrison_freeze); an identifier filter when listing.</summary>
        public string? Target { get; set; } = null;

        /// <summary>Why, or null. At most 2000 characters.</summary>
        public string? Reason { get; set; } = null;

        /// <summary>Also cancel the runs already in scope (garrison_freeze). Default false.</summary>
        public bool? CancelActiveRuns { get; set; } = null;

        /// <summary>True for active freezes only, false for lifted ones only (listing), or null for both.</summary>
        public bool? Active { get; set; } = null;

        /// <summary>Most results, 1 to 100. Default 25.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
