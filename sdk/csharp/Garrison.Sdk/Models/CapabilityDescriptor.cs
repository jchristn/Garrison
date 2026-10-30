namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One entry in the capability catalog: an agent, an MCP tool, or a harness built-in, described the same way so an
    /// orchestrator can choose between them. Derived descriptors follow their source; manual descriptors are written
    /// through the API. A descriptor with a null tenant is shared by every tenant. Not thread-safe.
    /// </summary>
    public class CapabilityDescriptor
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cap_). Set by the server; leave empty when creating. Never null.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Tenant identifier, or null for a descriptor every tenant shares (derived from a built-in harness profile).
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Name shown in the catalog: the agent name for agents, server/tool for MCP tools, the tool name for harness
        /// built-ins. The server accepts 1 to 256 characters. Manual names are unique per tenant (409 NameConflict).
        /// Never null.
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
        /// Kind. Default Agent.
        /// </summary>
        public CapabilityKindEnum Kind { get; set; } = CapabilityKindEnum.Agent;

        /// <summary>
        /// Derived or Manual. Set by the server.
        /// </summary>
        public CapabilityOriginEnum Origin { get; set; } = CapabilityOriginEnum.Manual;

        /// <summary>
        /// Stable key of the source, unique per tenant: agent:{agentId}, mcp:{serverId}:{tool}, tool:{name}, or
        /// manual:{id}. Set by the server. Never null.
        /// </summary>
        public string SourceKey
        {
            get
            {
                return _SourceKey;
            }
            set
            {
                _SourceKey = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Source agent identifier for Agent descriptors; optional on manual ones. Null otherwise.
        /// </summary>
        public string? SourceAgentId { get; set; } = null;

        /// <summary>
        /// Published revision the Agent descriptor was derived from, or null.
        /// </summary>
        public string? SourceRevisionId { get; set; } = null;

        /// <summary>
        /// Source MCP server identifier for McpTool descriptors; optional on manual ones. Null otherwise.
        /// </summary>
        public string? SourceMcpServerId { get; set; } = null;

        /// <summary>
        /// Tool name on the source MCP server for McpTool descriptors; optional on manual ones. Null otherwise.
        /// </summary>
        public string? SourceToolName { get; set; } = null;

        /// <summary>
        /// Harness profile that declares the tool probe of a HarnessBuiltIn descriptor, or null.
        /// </summary>
        public string? SourceHarnessProfileId { get; set; } = null;

        /// <summary>
        /// Harness type of that profile, for HarnessBuiltIn descriptors, or null.
        /// </summary>
        public HarnessTypeEnum? SourceHarnessType { get; set; } = null;

        /// <summary>
        /// What the capability does and when to use it. The server accepts up to 4000 characters. Null when not set.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// JSON Schema of the input, as a JSON value (usually an object), or null when there is none. The server validates
        /// it on save (400 InvalidJsonSchema).
        /// </summary>
        public JsonElement? InputSchema { get; set; } = null;

        /// <summary>
        /// JSON Schema of the output, as a JSON value (usually an object), or null when there is none. The server validates
        /// it on save (400 InvalidJsonSchema).
        /// </summary>
        public JsonElement? OutputSchema { get; set; } = null;

        /// <summary>
        /// Tags for filtering. The server accepts at most 32, each 1 to 64 characters. Never null.
        /// </summary>
        public List<string> Tags
        {
            get
            {
                return _Tags;
            }
            set
            {
                _Tags = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Node labels a run needs when its agent uses this capability. HarnessBuiltIn descriptors require their tool
        /// label; other kinds usually require nothing. The server accepts at most 16. Never null.
        /// </summary>
        public List<CapabilityRequirement> Requirements
        {
            get
            {
                return _Requirements;
            }
            set
            {
                _Requirements = value ?? new List<CapabilityRequirement>();
            }
        }

        /// <summary>
        /// Cost and latency hints computed by the server. Ignored on create and update. Never null.
        /// </summary>
        public CapabilityHints Hints
        {
            get
            {
                return _Hints;
            }
            set
            {
                _Hints = value ?? new CapabilityHints();
            }
        }

        /// <summary>
        /// Why the last refresh of the source failed while the descriptor keeps its last good content, or null.
        /// </summary>
        public string? RefreshWarning { get; set; } = null;

        /// <summary>
        /// When the descriptor was last refreshed from its source (UTC), or null for manual descriptors.
        /// </summary>
        public DateTime? LastRefreshedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _Name = String.Empty;
        private string _SourceKey = String.Empty;
        private List<string> _Tags = new List<string>();
        private List<CapabilityRequirement> _Requirements = new List<CapabilityRequirement>();
        private CapabilityHints _Hints = new CapabilityHints();

        #endregion
    }
}
