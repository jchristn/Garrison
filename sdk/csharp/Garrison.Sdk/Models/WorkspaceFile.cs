namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of WorkspaceTemplate: seeded files.
    /// </summary>
    public class WorkspaceFile
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
        /// Parent WorkspaceTemplate identifier.
        /// </summary>
        public string WorkspaceTemplateId
        {
            get
            {
                return _WorkspaceTemplateId;
            }
            set
            {
                _WorkspaceTemplateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Relative path.
        /// </summary>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Content.
        /// </summary>
        public string Content
        {
            get
            {
                return _Content;
            }
            set
            {
                _Content = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _WorkspaceTemplateId = String.Empty;
        private string _Path = String.Empty;
        private string _Content = String.Empty;

        #endregion
    }
}
