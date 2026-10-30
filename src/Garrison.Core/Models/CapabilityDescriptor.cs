namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Serialization;

    /// <summary>
    /// One entry in the capability catalog (AD4, AD-006, AD-022): an agent, an MCP tool, or a harness built-in, described
    /// the same way so an orchestrator (or the studio) can choose between them. Derived descriptors follow their source
    /// (a published agent revision, an MCP server's tool list, a harness tool probe); manual descriptors are written by a
    /// person. A descriptor with a null tenant is shared by every tenant (harness built-ins of built-in profiles).
    /// </summary>
    public class CapabilityDescriptor
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cap_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewCapabilityId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier, or null for a descriptor every tenant shares (derived from a built-in harness profile).
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Name shown in the catalog: the agent name for agents, server/tool for MCP tools, the tool name for harness
        /// built-ins. 1 to 256 characters. Names are not unique across kinds; agents bind harness built-ins by name.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the name is empty or longer than 256 characters.</exception>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value) || value.Length > 256) throw new ArgumentException("A capability name is 1 to 256 characters.", nameof(Name));
                _Name = value.Trim();
            }
        }

        /// <summary>
        /// Kind.
        /// </summary>
        public CapabilityKindEnum Kind { get; set; } = CapabilityKindEnum.Agent;

        /// <summary>
        /// Derived or manual.
        /// </summary>
        public CapabilityOriginEnum Origin { get; set; } = CapabilityOriginEnum.Manual;

        /// <summary>
        /// Stable key of the source, unique per tenant: agent:{agentId}, mcp:{serverId}:{tool}, tool:{name}, or
        /// manual:{id}. Set by Garrison.
        /// </summary>
        public string SourceKey { get; set; } = String.Empty;

        /// <summary>
        /// Source agent identifier for Agent descriptors; optional on manual ones. Null otherwise.
        /// </summary>
        public string? SourceAgentId { get; set; } = null;

        /// <summary>
        /// Published revision the Agent descriptor was derived from, or null.
        /// </summary>
        public string? SourceRevisionId { get; set; } = null;

        /// <summary>
        /// Source MCP server identifier for McpTool descriptors, or null.
        /// </summary>
        public string? SourceMcpServerId { get; set; } = null;

        /// <summary>
        /// Tool name on the source MCP server for McpTool descriptors, or null.
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
        /// What the capability does and when to use it. Up to 4000 characters. Null when the source has no description.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the summary is longer than 4000 characters.</exception>
        public string? Summary
        {
            get
            {
                return _Summary;
            }
            set
            {
                if (value != null && value.Length > 4000) throw new ArgumentException("A capability summary is at most 4000 characters.", nameof(Summary));
                _Summary = String.IsNullOrWhiteSpace(value) ? null : value;
            }
        }

        /// <summary>
        /// JSON Schema of the input, as JSON text, or null. Validated as a JSON Schema on save (InvalidJsonSchema).
        /// </summary>
        [JsonIgnore]
        public string? InputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema the input must match, as a JSON object; null when the agent takes free text. Stored as
        /// <see cref="InputSchemaJson"/>. A request may also send the schema as a JSON string.
        /// </summary>
        public JsonElement? InputSchema
        {
            get
            {
                return JsonText.Value(InputSchemaJson);
            }
            set
            {
                InputSchemaJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// JSON Schema of the output, as JSON text, or null. Validated as a JSON Schema on save (InvalidJsonSchema).
        /// </summary>
        [JsonIgnore]
        public string? OutputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema the structured output must match, as a JSON object; null when the agent answers free text.
        /// Stored as <see cref="OutputSchemaJson"/>. A request may also send the schema as a JSON string.
        /// </summary>
        public JsonElement? OutputSchema
        {
            get
            {
                return JsonText.Value(OutputSchemaJson);
            }
            set
            {
                OutputSchemaJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Tags for filtering. At most 32, each 1 to 64 characters.
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
        /// label; other kinds usually require nothing. At most 16.
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
        /// Cost and latency hints. Never null.
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
        /// Why the last refresh of the source failed, while the descriptor keeps its last good content, or null.
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

        private string _Id = IdGenerator.NewCapabilityId();
        private string _Name = "capability";
        private string? _Summary = null;
        private List<string> _Tags = new List<string>();
        private List<CapabilityRequirement> _Requirements = new List<CapabilityRequirement>();
        private CapabilityHints _Hints = new CapabilityHints();

        #endregion
    }
}
