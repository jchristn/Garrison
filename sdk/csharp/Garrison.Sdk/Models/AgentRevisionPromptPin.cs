namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A prompt template pinned by an agent revision.
    /// </summary>
    public class AgentRevisionPromptPin
    {
        #region Public-Members

        /// <summary>
        /// Prompt role, for example system or user.
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
        /// Pinned template version, or null to follow the latest version.
        /// </summary>
        public int? PinnedVersion { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Role = String.Empty;
        private string _TemplateId = String.Empty;

        #endregion
    }
}
