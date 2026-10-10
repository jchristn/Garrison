namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of Deployment: mCP server and secret bindings.
    /// </summary>
    public class DeploymentResourceBinding
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewDeploymentResourceBindingId() : value;
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
        /// Resource kind.
        /// </summary>
        public ResourceBindingKindEnum Kind { get; set; } = ResourceBindingKindEnum.Secret;

        /// <summary>
        /// Alias used in templates, for example {{secret.anthropic}}.
        /// </summary>
        public string Alias
        {
            get
            {
                return _Alias;
            }
            set
            {
                _Alias = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Bound resource identifier.
        /// </summary>
        public string ResourceId
        {
            get
            {
                return _ResourceId;
            }
            set
            {
                _ResourceId = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewDeploymentResourceBindingId();
        private string _DeploymentId = String.Empty;
        private string _Alias = String.Empty;
        private string _ResourceId = String.Empty;

        #endregion
    }
}
