namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// MCP server that can be bound to deployments.
    /// </summary>
    public class McpServer
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMcpServerId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Server name, used as the MCP server key in harness configuration.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Transport.
        /// </summary>
        public McpTransportEnum Transport { get; set; } = McpTransportEnum.Http;

        /// <summary>
        /// Base URL for HTTP servers.
        /// </summary>
        public string? Url { get; set; } = null;

        /// <summary>
        /// MCP path for HTTP servers, default /mcp.
        /// </summary>
        public string? Path { get; set; } = null;

        /// <summary>
        /// Command for stdio servers.
        /// </summary>
        public string? Command { get; set; } = null;

        /// <summary>
        /// Tool call timeout. Minimum 1, maximum 3600, default 600.
        /// </summary>
        public int ToolTimeoutSeconds
        {
            get
            {
                return _ToolTimeoutSeconds;
            }
            set
            {
                _ToolTimeoutSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        /// <summary>
        /// Whether the run fails when the server is unreachable.
        /// </summary>
        public bool Required { get; set; } = true;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Command arguments for stdio servers.
        /// </summary>
        public List<string> Arguments
        {
            get
            {
                return _Arguments;
            }
            set
            {
                _Arguments = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Environment templates for stdio servers.
        /// </summary>
        public List<McpServerVariable> Environment
        {
            get
            {
                return _Environment;
            }
            set
            {
                _Environment = value ?? new List<McpServerVariable>();
            }
        }

        /// <summary>
        /// HTTP header templates.
        /// </summary>
        public List<McpServerHeader> Headers
        {
            get
            {
                return _Headers;
            }
            set
            {
                _Headers = value ?? new List<McpServerHeader>();
            }
        }

        /// <summary>
        /// Tools that must be present for pre-flight to pass.
        /// </summary>
        public List<string> RequiredTools
        {
            get
            {
                return _RequiredTools;
            }
            set
            {
                _RequiredTools = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewMcpServerId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _ToolTimeoutSeconds = 600;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<string> _Arguments = new List<string>();
        private List<McpServerVariable> _Environment = new List<McpServerVariable>();
        private List<McpServerHeader> _Headers = new List<McpServerHeader>();
        private List<string> _RequiredTools = new List<string>();

        #endregion
    }
}
