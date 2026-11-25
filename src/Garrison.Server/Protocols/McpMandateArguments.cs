namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed mandate management tool arguments (AA1.11). Tenant identity comes from the authenticated caller.</summary>
    public class McpMandateArguments
    {
        /// <summary>Existing mandate identifier or name. Null for creation and listing.</summary>
        public string? Mandate { get; set; } = null;

        /// <summary>Mandate configuration for creation or update, or null.</summary>
        public Mandate? Configuration { get; set; } = null;

        /// <summary>Revision to draft and publish (garrison_publish_mandate_revision), or null.</summary>
        public MandateRevision? Revision { get; set; } = null;

        /// <summary>Status filter for listing (Draft, Active, Paused, Frozen, CapReached, Retired), or null.</summary>
        public string? Status { get; set; } = null;

        /// <summary>Agent filter for listing (identifier), or null.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Outcome filter for tick listing, or null.</summary>
        public string? Outcome { get; set; } = null;

        /// <summary>Part of a mandate name for listing, or null.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Most results, 1 to 100; null means 25.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
