namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// A prompt template an agent revision uses, optionally pinned to one version (AD1). Roles are ToolDescription and
    /// SkillDescription today (the templates that describe the agent as an MCP tool and as A2A skills).
    /// </summary>
    public class AgentRevisionPromptPin
    {
        #region Public-Members

        /// <summary>
        /// Role the template plays, for example ToolDescription. 1 to 64 characters.
        /// </summary>
        public string Role
        {
            get
            {
                return _Role;
            }
            set
            {
                _Role = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Prompt template identifier.
        /// </summary>
        public string TemplateId
        {
            get
            {
                return _TemplateId;
            }
            set
            {
                _TemplateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pinned template version, or null to follow the template's current version.
        /// </summary>
        public int? PinnedVersion { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Role = String.Empty;
        private string _TemplateId = String.Empty;

        #endregion
    }
}
