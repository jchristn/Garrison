namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// The System prompt an architect deployment uses. Not thread-safe.
    /// </summary>
    public class ArchitectPromptSelection
    {
        #region Public-Members

        /// <summary>
        /// Deployment identifier. Never null.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Template identifier. Never null.
        /// </summary>
        public string ArchitectPromptTemplateId
        {
            get
            {
                return _ArchitectPromptTemplateId;
            }
            set
            {
                _ArchitectPromptTemplateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Template name. Never null.
        /// </summary>
        public string ArchitectPromptName
        {
            get
            {
                return _ArchitectPromptName;
            }
            set
            {
                _ArchitectPromptName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pinned version, or null when each turn renders the template's current version.
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;

        /// <summary>
        /// The template's current version. Default 1.
        /// </summary>
        public int CurrentVersion { get; set; } = 1;

        #endregion

        #region Private-Members

        private string _DeploymentId = String.Empty;
        private string _ArchitectPromptTemplateId = String.Empty;
        private string _ArchitectPromptName = String.Empty;

        #endregion
    }
}
