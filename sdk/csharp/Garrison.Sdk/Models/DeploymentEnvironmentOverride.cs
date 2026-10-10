namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Deployment: environment overrides.
    /// </summary>
    public class DeploymentEnvironmentOverride
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
        /// Variable name.
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
        /// Value template.
        /// </summary>
        public string ValueTemplate
        {
            get
            {
                return _ValueTemplate;
            }
            set
            {
                _ValueTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the value is secret.
        /// </summary>
        public bool IsSecret { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _DeploymentId = String.Empty;
        private string _Name = String.Empty;
        private string _ValueTemplate = String.Empty;

        #endregion
    }
}
