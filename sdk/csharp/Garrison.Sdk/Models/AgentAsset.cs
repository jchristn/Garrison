namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A versioned agent asset: a system prompt, skill, reference file, or document template.
    /// </summary>
    public class AgentAsset
    {
        #region Public-Members

        /// <summary>
        /// Identifier, assigned by the server.
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
        /// Tenant identifier, assigned by the server.
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
        /// Name, unique within the tenant.
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
        /// Asset kind. Default Skill.
        /// </summary>
        public AgentAssetKindEnum Kind { get; set; } = AgentAssetKindEnum.Skill;

        /// <summary>
        /// Optional description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Prompt template identifier. Required for SystemPrompt assets, ignored otherwise.
        /// </summary>
        public string? PromptTemplateId { get; set; } = null;

        /// <summary>
        /// Artifact store holding the asset files, or null to store them in the Garrison database.
        /// </summary>
        public string? ArtifactStoreId { get; set; } = null;

        /// <summary>
        /// Current version number; 0 means no version has been uploaded.
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

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private List<string> _Tags = new List<string>();

        #endregion
    }
}
