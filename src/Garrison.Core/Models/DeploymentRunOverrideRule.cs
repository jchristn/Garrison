namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of Deployment: parameters callers may override per run.
    /// </summary>
    public class DeploymentRunOverrideRule
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewDeploymentRunOverrideRuleId() : value;
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
        /// Parameter name (deployment parameter or model).
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
        /// Validation kind. Default Enum, so a rule saved without a validation needs its allowed values in Pattern; choose
        /// Any explicitly to accept whatever the caller sends (SR-26).
        /// </summary>
        public RunOverrideValidationEnum Validation { get; set; } = RunOverrideValidationEnum.Enum;

        /// <summary>
        /// Regex, comma-separated enum values, or min,max range.
        /// </summary>
        public string? Pattern { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewDeploymentRunOverrideRuleId();
        private string _DeploymentId = String.Empty;
        private string _Name = String.Empty;

        #endregion
    }
}
