namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Deployment: file overrides.
    /// </summary>
    public class DeploymentFileOverride
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
        /// Base directory.
        /// </summary>
        public FileBaseDirectoryEnum BaseDirectory { get; set; } = FileBaseDirectoryEnum.Config;

        /// <summary>
        /// Relative path template.
        /// </summary>
        public string PathTemplate
        {
            get
            {
                return _PathTemplate;
            }
            set
            {
                _PathTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Content template.
        /// </summary>
        public string ContentTemplate
        {
            get
            {
                return _ContentTemplate;
            }
            set
            {
                _ContentTemplate = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Optional octal file mode.
        /// </summary>
        public string? Mode { get; set; } = null;

        /// <summary>
        /// Whether the content is secret.
        /// </summary>
        public bool IsSecret { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _DeploymentId = String.Empty;
        private string _PathTemplate = String.Empty;
        private string _ContentTemplate = String.Empty;

        #endregion
    }
}
