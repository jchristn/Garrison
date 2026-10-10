namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewRunTemplateVersionId() : value;
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

        private string _Id = IdGenerator.NewRunTemplateVersionId();
        private string _RunId = String.Empty;
        private string _TemplateId = String.Empty;
        private string _TemplateName = String.Empty;

        #endregion
    }
}
