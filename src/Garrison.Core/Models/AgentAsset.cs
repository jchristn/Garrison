namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A versioned file set an agent needs at run time (AD2, AD-004): a skill, a reference file, a document template, or
    /// a system prompt. A SystemPrompt asset names a prompt template and has no files (AD-010); the other kinds have
    /// versions with one or more files, stored under the reserved .garrison-assets/ prefix of an artifact store
    /// (AD-011). Asset files are not artifacts: they never appear in artifact listings and are not removed by artifact
    /// retention.
    /// </summary>
    public class AgentAsset
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix aas_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAgentAssetId() : value;
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
        /// Name, unique per tenant: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or
        /// digit. Placement paths use it, for example .claude/skills/{name}/.
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
        /// Kind.
        /// </summary>
        public AgentAssetKindEnum Kind { get; set; } = AgentAssetKindEnum.ReferenceFile;

        /// <summary>
        /// Optional description, at most 4000 characters. The asset listing in the system prompt shows it.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Prompt template identifier. Required for SystemPrompt assets (AssetTemplateRequired otherwise) and refused for
        /// the other kinds.
        /// </summary>
        public string? PromptTemplateId { get; set; } = null;

        /// <summary>
        /// Artifact store holding the files, or null to keep them in the Garrison database (AD-011). Cannot change once
        /// the asset has versions.
        /// </summary>
        public string? ArtifactStoreId { get; set; } = null;

        /// <summary>
        /// Latest version number, or 0 when the asset has no versions yet. Set by the server.
        /// </summary>
        public int CurrentVersion { get; set; } = 0;

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
        /// Creation timestamp, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewAgentAssetId();
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private List<string> _Tags = new List<string>();

        #endregion
    }
}
