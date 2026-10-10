namespace Garrison.Server.Settings
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// MCP listener settings (Voltaic, separate port). Changes require a restart.
    /// </summary>
    public class McpSettings
    {
        #region Public-Members

        /// <summary>
        /// Whether the MCP server is enabled. Default true.
        /// </summary>
        public bool Enable { get; set; } = true;

        /// <summary>
        /// Bind hostname. Default *.
        /// </summary>
        public string Hostname
        {
            get
            {
                return _Hostname;
            }
            set
            {
                _Hostname = String.IsNullOrWhiteSpace(value) ? "*" : value;
            }
        }

        /// <summary>
        /// Port. Minimum 1, maximum 65535, default 8701.
        /// </summary>
        public int Port
        {
            get
            {
                return _Port;
            }
            set
            {
                _Port = Math.Clamp(value, 1, 65535);
            }
        }

        /// <summary>
        /// MCP path. Default /mcp.
        /// </summary>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = String.IsNullOrWhiteSpace(value) ? "/mcp" : value;
            }
        }

        /// <summary>
        /// Public MCP base URL handed to harnesses (without the path), for example http://garrison-server:8701. Null derives it from the bind address.
        /// </summary>
        public string? PublicUrl { get; set; } = null;

        /// <summary>
        /// Maximum MCP message size in bytes. Minimum 65536, maximum 268435456, default 16777216.
        /// </summary>
        public int MaxMessageSize
        {
            get
            {
                return _MaxMessageSize;
            }
            set
            {
                _MaxMessageSize = Math.Clamp(value, 65536, 268435456);
            }
        }

        /// <summary>
        /// Maximum seconds a synchronous invoke tool waits before returning the run identifier. Minimum 1, maximum 600, default 90.
        /// </summary>
        public int MaxToolWaitSeconds
        {
            get
            {
                return _MaxToolWaitSeconds;
            }
            set
            {
                _MaxToolWaitSeconds = Math.Clamp(value, 1, 600);
            }
        }

        /// <summary>
        /// Loopback port of the internal MCP endpoint (Voltaic). The public port is served by Garrison, which maps
        /// cluster session identifiers to sessions on this endpoint so that any replica can serve any session (G-1).
        /// 0 (the default) picks a free port at startup. Minimum 0, maximum 65535.
        /// </summary>
        public int InternalPort
        {
            get
            {
                return _InternalPort;
            }
            set
            {
                _InternalPort = Math.Clamp(value, 0, 65535);
            }
        }

        /// <summary>
        /// Seconds an MCP session may stay idle before it expires on every replica. Minimum 60, maximum 604800, default
        /// 3600.
        /// </summary>
        public int SessionIdleTimeoutSeconds
        {
            get
            {
                return _SessionIdleTimeoutSeconds;
            }
            set
            {
                _SessionIdleTimeoutSeconds = Math.Clamp(value, 60, 604800);
            }
        }

        #endregion

        #region Private-Members

        private string _Hostname = "*";
        private int _Port = 8701;
        private string _Path = "/mcp";
        private int _MaxMessageSize = 16777216;
        private int _MaxToolWaitSeconds = 90;
        private int _InternalPort = 0;
        private int _SessionIdleTimeoutSeconds = 3600;

        #endregion
    }
}
