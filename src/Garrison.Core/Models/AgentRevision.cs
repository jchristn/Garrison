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
    /// An immutable snapshot of an agent's definition (AD1, AD-003). An agent has at most one open draft at a time; a
    /// published revision never changes again. Deployments pin a revision, or follow the agent's latest published
    /// revision when unpinned (AD-012). Runs record the revision they compiled from.
    /// </summary>
    public class AgentRevision
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix arv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAgentRevisionId() : value;
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
        /// Revision number, per agent, starting at 1. A published number is never reused; the number of a discarded draft goes to the next revision.
        /// </summary>
        public int Number
        {
            get
            {
                return _Number;
            }
            set
            {
                _Number = value < 1 ? 1 : value;
            }
        }

        /// <summary>
        /// State: Draft (editable) or Published (frozen).
        /// </summary>
        public AgentRevisionStateEnum State { get; set; } = AgentRevisionStateEnum.Draft;

        /// <summary>
        /// SHA-256 (lowercase hex) of the revision's content fields, computed by <see cref="Garrison.Core.Services.AgentRevisionContent"/>.
        /// Two revisions with the same hash define the agent the same way.
        /// </summary>
        public string ContentHash { get; set; } = String.Empty;

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
        /// Input JSON Schema copied from the agent (unmanaged JSON column, section 7.3 of the plan).
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
        /// Output JSON Schema copied from the agent (unmanaged JSON column, section 7.3 of the plan).
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
        /// Delegation mode.
        /// </summary>
        public DelegationModeEnum DelegationMode { get; set; } = DelegationModeEnum.None;

        /// <summary>
        /// Maximum delegation depth below this agent. Minimum 0, maximum 10, default 2. Values outside the range are
        /// clamped.
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
        /// Whether the agent may appear twice in a delegation chain.
        /// </summary>
        public bool DelegationAllowRecursion { get; set; } = false;

        /// <summary>
        /// Agent names this revision may delegate to when the mode is AllowList.
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
        /// Prompt templates the revision uses, with optional version pins.
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
        /// Assets the revision uses (AD2), with optional version pins.
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
        /// Names of capabilities the revision is bound to (AD4). Empty until capabilities are bound.
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
        /// User identifier of the author, when a user created the revision.
        /// </summary>
        public string? AuthorUserId { get; set; } = null;

        /// <summary>
        /// Display name of the author (user email, credential name, or "system").
        /// </summary>
        public string? AuthorName { get; set; } = null;

        /// <summary>
        /// Optional change note, at most 2000 characters.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        /// <summary>
        /// User identifier of the person who published the revision.
        /// </summary>
        public string? PublishedByUserId { get; set; } = null;

        /// <summary>
        /// Display name of the publisher.
        /// </summary>
        public string? PublishedByName { get; set; } = null;

        /// <summary>
        /// When the revision was published, or null for a draft.
        /// </summary>
        public DateTime? PublishedUtc { get; set; } = null;

        /// <summary>
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp, UTC. A published revision is never updated after publication.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewAgentRevisionId();
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private int _Number = 1;
        private int _DelegationMaxDepth = 2;
        private List<string> _DelegationAllowList = new List<string>();
        private List<AgentRevisionPromptPin> _PromptPins = new List<AgentRevisionPromptPin>();
        private List<AgentRevisionAssetPin> _AssetPins = new List<AgentRevisionAssetPin>();
        private List<string> _Capabilities = new List<string>();
        private List<string> _Tags = new List<string>();

        #endregion
    }
}
