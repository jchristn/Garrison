namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An immutable (published) or editable (draft) snapshot of an agent's content.
    /// </summary>
    public class AgentRevision
    {
        #region Public-Members

        /// <summary>
        /// Identifier (arv_).
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
        /// Agent identifier.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Revision number, starting at 1 per agent. Read-only.
        /// </summary>
        public int Number { get; set; } = 0;

        /// <summary>
        /// Draft or Published. Read-only.
        /// </summary>
        public AgentRevisionStateEnum State { get; set; } = AgentRevisionStateEnum.Draft;

        /// <summary>
        /// Hash of the revision content. Read-only.
        /// </summary>
        public string? ContentHash { get; set; } = null;

        /// <summary>
        /// Display name.
        /// </summary>
        public string? DisplayName { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

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
        /// Which agents this agent may delegate to.
        /// </summary>
        public DelegationModeEnum DelegationMode { get; set; } = DelegationModeEnum.None;

        /// <summary>
        /// Maximum delegation depth below this agent. Default 2.
        /// </summary>
        public int DelegationMaxDepth { get; set; } = 2;

        /// <summary>
        /// Whether delegation may recurse into this agent.
        /// </summary>
        public bool DelegationAllowRecursion { get; set; } = false;

        /// <summary>
        /// Agents this agent may delegate to when the mode is AllowList.
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

        /// <summary>
        /// Pinned prompt templates.
        /// </summary>
        public List<AgentRevisionPromptPin> PromptPins
        {
            get
            {
                return _PromptPins;
            }
            set
            {
                _PromptPins = value ?? new List<AgentRevisionPromptPin>();
            }
        }

        /// <summary>
        /// Pinned agent assets. A pin with a null version follows the asset's current version.
        /// </summary>
        public List<AgentRevisionAssetPin> AssetPins
        {
            get
            {
                return _AssetPins;
            }
            set
            {
                _AssetPins = value ?? new List<AgentRevisionAssetPin>();
            }
        }

        /// <summary>
        /// Capabilities.
        /// </summary>
        public List<string> Capabilities
        {
            get
            {
                return _Capabilities;
            }
            set
            {
                _Capabilities = value ?? new List<string>();
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
        /// Author user identifier. Read-only.
        /// </summary>
        public string? AuthorUserId { get; set; } = null;

        /// <summary>
        /// Author name. Read-only.
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Change note.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// Publisher user identifier. Read-only.
        /// </summary>
        public string? PublishedByUserId { get; set; } = null;

        /// <summary>
        /// Publisher name. Read-only.
        /// </summary>
        public string? PublishedByName { get; set; } = null;

        /// <summary>
        /// Publish timestamp (UTC), null for a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private List<string> _DelegationAllowList = new List<string>();
        private List<AgentRevisionPromptPin> _PromptPins = new List<AgentRevisionPromptPin>();
        private List<AgentRevisionAssetPin> _AssetPins = new List<AgentRevisionAssetPin>();
        private List<string> _Capabilities = new List<string>();
        private List<string> _Tags = new List<string>();

        #endregion
    }
}
