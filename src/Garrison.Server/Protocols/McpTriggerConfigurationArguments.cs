namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed trigger management tool arguments (P12.5). Tenant identity comes from the authenticated caller.</summary>
    public class McpTriggerConfigurationArguments
    {
        /// <summary>Existing trigger identifier or name for reads, replacements, and deletion. Null for creation.</summary>
        public string? Trigger { get; set; } = null;

        /// <summary>Full trigger configuration for creation or replacement. Null for reads and deletion.</summary>
        public Trigger? Configuration { get; set; } = null;
    }
}
