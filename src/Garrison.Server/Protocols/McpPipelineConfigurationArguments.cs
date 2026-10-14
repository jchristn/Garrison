namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>Typed pipeline management tool arguments. Tenant identity comes from the authenticated caller.</summary>
    public class McpPipelineConfigurationArguments
    {
        /// <summary>Existing pipeline identifier or name for reads, replacements, and deletion. Null for creation.</summary>
        public string? Pipeline { get; set; } = null;

        /// <summary>Full pipeline configuration (with its stages) for creation or replacement. Null for reads and deletion.</summary>
        public Pipeline? Configuration { get; set; } = null;
    }
}
