namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Child record of McpServer: hTTP header templates.
    /// </summary>
    public class McpServerHeader
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMcpServerHeaderId() : value;
            }
        }

        /// <summary>
        /// Parent McpServer identifier.
        /// </summary>
        public string McpServerId
        {
            get
            {
                return _McpServerId;
            }
            set
            {
                _McpServerId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Header name.
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

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewMcpServerHeaderId();
        private string _McpServerId = String.Empty;
        private string _Name = String.Empty;
        private string _ValueTemplate = String.Empty;

        #endregion
    }
}
