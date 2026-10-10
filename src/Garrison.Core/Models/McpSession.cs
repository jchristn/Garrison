namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A cluster MCP session. The session identifier handed to MCP clients names this row, so any control-plane replica
    /// can serve the session by replaying its initialize handshake against its own MCP endpoint (G-1).
    /// </summary>
    public class McpSession
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix mcs_), returned to clients in the MCP-Session-Id header.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMcpSessionId() : value;
            }
        }

        /// <summary>
        /// Principal that opened the session (principal type and identifier). Only the same principal may use it.
        /// </summary>
        public string Principal
        {
            get
            {
                return _Principal;
            }
            set
            {
                _Principal = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Protocol version the client asked for in its initialize request.
        /// </summary>
        public string ProtocolVersion
        {
            get
            {
                return _ProtocolVersion;
            }
            set
            {
                _ProtocolVersion = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Client name from the initialize request, or null.
        /// </summary>
        public string? ClientName { get; set; } = null;

        /// <summary>
        /// Client version from the initialize request, or null.
        /// </summary>
        public string? ClientVersion { get; set; } = null;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time any replica served the session (UTC). Updated at most about once a minute per replica.
        /// </summary>
        public DateTime LastSeenUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Expiry (UTC). An idle session expires; every use pushes the expiry out.
        /// </summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewMcpSessionId();
        private string _Principal = String.Empty;
        private string _ProtocolVersion = String.Empty;

        #endregion
    }
}
