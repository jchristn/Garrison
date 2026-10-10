namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Run: prompt template versions used to compile the run.
    /// </summary>
    public class RunTemplateVersion
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
        /// Parent Run identifier.
        /// </summary>
        public string RunId
        {
            get
            {
                return _RunId;
            }
            set
            {
                _RunId = value ?? String.Empty;
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
        /// Template name.
        /// </summary>
        public string TemplateName
        {
            get
            {
                return _TemplateName;
            }
            set
            {
                _TemplateName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Version.
        /// </summary>
        public int Version { get; set; } = 0;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _RunId = String.Empty;
        private string _TemplateId = String.Empty;
        private string _TemplateName = String.Empty;

        #endregion
    }
}
