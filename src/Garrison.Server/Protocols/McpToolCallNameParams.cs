namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The tool name in tools/call parameters. Other parameters are ignored here.
    /// </summary>
    public class McpToolCallNameParams
    {
        /// <summary>
        /// Tool name; null when absent.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Tool arguments, read only for the administrator-only tenantId; null when absent.
        /// </summary>
        public McpToolCallTenantArguments? Arguments { get; set; } = null;
    }
}
