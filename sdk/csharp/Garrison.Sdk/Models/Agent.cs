namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Named agent capability exposed by Garrison.
    /// </summary>
    public class Agent
    {
        #region Public-Members

        /// <summary>
        /// Warnings from the create or update request that returned this record (responses only): one entry per value
        /// the server did not store as given, for example code ValueClamped for a number outside its range. Null when
        /// there is nothing to report, and on reads.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

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
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
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
        /// DNS-safe agent name, unique per tenant.
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
        /// Display name.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Latest published revision identifier, or null when nothing is published. Read-only.
        /// </summary>
        public string? LatestPublishedRevisionId { get; set; } = null;

        /// <summary>
        /// Open draft revision identifier, or null when there is no draft. Read-only.
        /// </summary>
        public string? DraftRevisionId { get; set; } = null;

        /// <summary>
        /// Hosted or remote.
        /// </summary>
        public AgentKindEnum Kind { get; set; } = AgentKindEnum.Hosted;

        /// <summary>
        /// Agent version string advertised in the A2A card.
        /// </summary>
        public string? AgentVersion { get; set; } = null;

        /// <summary>
        /// Whether the agent is exposed over A2A.
        /// </summary>
        public bool ExposeA2A { get; set; } = true;

        /// <summary>
        /// Whether the agent is exposed as its own MCP tool.
        /// </summary>
        public bool ExposeMcpTool { get; set; } = false;

        /// <summary>
        /// MCP tool name override.
        /// </summary>
        public string? McpToolName { get; set; } = null;

        /// <summary>
        /// Template for the MCP tool description.
        /// </summary>
        public string? ToolDescriptionTemplateId { get; set; } = null;

        /// <summary>
        /// Template for the A2A skill description.
        /// </summary>
        public string? SkillDescriptionTemplateId { get; set; } = null;

        /// <summary>
        /// Input mode.
        /// </summary>
        public AgentInputModeEnum InputMode { get; set; } = AgentInputModeEnum.Text;

        /// <summary>
        /// JSON Schema for structured input (unmanaged JSON).
        /// </summary>
        public string? InputSchemaJson { get; set; } = null;

        /// <summary>
        /// JSON Schema for structured output (unmanaged JSON).
        /// </summary>
        public string? OutputSchemaJson { get; set; } = null;

        /// <summary>
        /// Delegation mode.
        /// </summary>
        public DelegationModeEnum DelegationMode { get; set; } = DelegationModeEnum.None;

        /// <summary>
        /// Maximum delegation depth below this agent. Minimum 0, maximum 10, default 2.
        /// </summary>
        public int DelegationMaxDepth
        {
            get
            {
                return _DelegationMaxDepth;
            }
            set
            {
                _DelegationMaxDepth = Math.Clamp(value, 0, 10);
            }
        }

        /// <summary>
        /// Whether an agent may appear twice in a delegation chain.
        /// </summary>
        public bool DelegationAllowRecursion { get; set; } = false;

        /// <summary>
        /// Protocol for remote agents.
        /// </summary>
        public RemoteProtocolEnum? RemoteProtocol { get; set; } = null;

        /// <summary>
        /// Endpoint URL for remote agents.
        /// </summary>
        public string? RemoteEndpointUrl { get; set; } = null;

        /// <summary>
        /// Secret used to call a remote agent.
        /// </summary>
        public string? RemoteCredentialSecretId { get; set; } = null;

        /// <summary>
        /// Last self-registration (UTC).
        /// </summary>
        public DateTime? LastRegisteredUtc { get; set; } = null;

        /// <summary>
        /// Self-registration time to live; 0 means no expiry. Minimum 0, maximum 31536000.
        /// </summary>
        public int RegistrationTtlSeconds
        {
            get
            {
                return _RegistrationTtlSeconds;
            }
            set
            {
                _RegistrationTtlSeconds = Math.Clamp(value, 0, 31536000);
            }
        }

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
                _CreatedUtc = value;
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
                _LastUpdateUtc = value;
            }
        }

        /// <summary>
        /// A2A skills.
        /// </summary>
        public List<AgentSkillDefinition> Skills
        {
            get
            {
                return _Skills;
            }
            set
            {
                _Skills = value ?? new List<AgentSkillDefinition>();
            }
        }

        /// <summary>
        /// Tags.
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
        /// Agent names this agent may delegate to when the mode is AllowList.
        /// </summary>
        public List<string> DelegationAllowList
        {
            get
            {
                return _DelegationAllowList;
            }
            set
            {
                _DelegationAllowList = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private int _DelegationMaxDepth = 2;
        private int _RegistrationTtlSeconds = 0;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<AgentSkillDefinition> _Skills = new List<AgentSkillDefinition>();
        private List<string> _Tags = new List<string>();
        private List<string> _DelegationAllowList = new List<string>();

        #endregion
    }
}
