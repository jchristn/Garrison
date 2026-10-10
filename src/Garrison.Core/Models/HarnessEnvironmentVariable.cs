namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of HarnessProfile: environment variable templates.
    /// </summary>
    public class HarnessEnvironmentVariable
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewHarnessEnvironmentVariableId() : value;
            }
        }

        /// <summary>
        /// Parent HarnessProfile identifier.
        /// </summary>
        public string HarnessProfileId
        {
            get
            {
                return _HarnessProfileId;
            }
            set
            {
                _HarnessProfileId = value ?? String.Empty;
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
        /// Value template. May reference secrets.
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
        /// Optional condition template.
        /// </summary>
        public string? Condition { get; set; } = null;

        /// <summary>
        /// Whether the rendered value is secret and must be scrubbed.
        /// </summary>
        public bool IsSecret { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewHarnessEnvironmentVariableId();
        private string _HarnessProfileId = String.Empty;
        private string _Name = String.Empty;
        private string _ValueTemplate = String.Empty;

        #endregion
    }
}
