namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed agent management tool arguments. Tenant identity comes from the authenticated caller.</summary>
    public class McpAgentConfigurationArguments
    {
        /// <summary>Existing agent identifier or name for reads, replacements, and deletion.</summary>
        public string? Agent { get; set; } = null;
        /// <summary>Full agent configuration for creation or replacement.</summary>
        public Agent? Configuration { get; set; } = null;
    }
}
