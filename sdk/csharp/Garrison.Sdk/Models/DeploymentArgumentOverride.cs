namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Deployment: argument overrides applied to the profile.
    /// </summary>
    public class DeploymentArgumentOverride
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
        /// Zero-based position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Operation.
        /// </summary>
        public ArgumentOverrideOperationEnum Operation { get; set; } = ArgumentOverrideOperationEnum.Append;

        /// <summary>
        /// For Remove and Replace, the profile argument template to match.
        /// </summary>
        public string? Match { get; set; } = null;

        /// <summary>
        /// Argument template for Append, Prepend, and Replace.
        /// </summary>
        public string? Template { get; set; } = null;

        /// <summary>
        /// Optional condition template.
        /// </summary>
        public string? Condition { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _DeploymentId = String.Empty;

        #endregion
    }
}
