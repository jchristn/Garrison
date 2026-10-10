namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Deployment: prompt role to template bindings.
    /// </summary>
    public class DeploymentPromptBinding
    {
        #region Public-Members

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
        /// Parent Deployment identifier.
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
        /// Prompt role, for example System or Task.
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
        /// Template identifier.
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
        /// Pinned version, or null to follow the current version.
        /// </summary>
        public int? PinnedVersion { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _DeploymentId = String.Empty;
        private string _Role = String.Empty;
        private string _TemplateId = String.Empty;

        #endregion
    }
}
