namespace Garrison.Server.Services
{
    using System;

    /// <summary>
    /// The outcome of listing one MCP server's tools for the capability catalog (AD4.3).
    /// </summary>
    public class CapabilityServerRefresh
    {
        /// <summary>
        /// MCP server identifier.
        /// </summary>
        public string McpServerId { get; set; } = String.Empty;

        /// <summary>
        /// MCP server name.
        /// </summary>
        public string McpServerName { get; set; } = String.Empty;

        /// <summary>
        /// Tool descriptors written.
        /// </summary>
        public int Tools { get; set; } = 0;

        /// <summary>
        /// Descriptors removed because the server no longer lists their tool.
        /// </summary>
        public int Removed { get; set; } = 0;

        /// <summary>
        /// Descriptors that kept their last good content and recorded the error as a warning.
        /// </summary>
        public int Warned { get; set; } = 0;

        /// <summary>
        /// Why the listing failed, or null when it succeeded.
        /// </summary>
        public string? Error { get; set; } = null;
    }
}
