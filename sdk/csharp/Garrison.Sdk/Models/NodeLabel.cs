namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of Node: labels.
    /// </summary>
    public class NodeLabel
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
        /// Parent Node identifier.
        /// </summary>
        public string NodeId
        {
            get
            {
                return _NodeId;
            }
            set
            {
                _NodeId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Label key.
        /// </summary>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                _Key = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Label value.
        /// </summary>
        public string Value
        {
            get
            {
                return _Value;
            }
            set
            {
                _Value = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _NodeId = String.Empty;
        private string _Key = String.Empty;
        private string _Value = String.Empty;

        #endregion
    }
}
