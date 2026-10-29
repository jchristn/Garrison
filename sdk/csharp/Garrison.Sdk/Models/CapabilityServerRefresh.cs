namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Result of refreshing one MCP server's tool descriptors. Not thread-safe.
    /// </summary>
    public class CapabilityServerRefresh
    {
        #region Public-Members

        /// <summary>
        /// MCP server identifier. Never null.
        /// </summary>
        public string McpServerId
        {
            get
            {
                return _McpServerId;
            }
            set
            {
                _McpServerId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// MCP server name. Never null.
        /// </summary>
        public string McpServerName
        {
            get
            {
                return _McpServerName;
            }
            set
            {
                _McpServerName = value ?? String.Empty;
            }
        }

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

        #endregion

        #region Private-Members

        private string _McpServerId = String.Empty;
        private string _McpServerName = String.Empty;

        #endregion
    }
}
