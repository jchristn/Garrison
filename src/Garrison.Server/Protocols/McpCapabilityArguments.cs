namespace Garrison.Server.Protocols
{
    /// <summary>Typed capability catalog tool arguments (AD4.6).</summary>
    public class McpCapabilityArguments
    {
        /// <summary>Kind filter for list: Agent, McpTool, or HarnessBuiltIn.</summary>
        public string? Kind { get; set; } = null;

        /// <summary>Tag filter for list.</summary>
        public string? Tag { get; set; } = null;

        /// <summary>Text to find in names and summaries, for list.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Capability identifier (cap_...) or name, for describe.</summary>
        public string? Capability { get; set; } = null;
    }
}
