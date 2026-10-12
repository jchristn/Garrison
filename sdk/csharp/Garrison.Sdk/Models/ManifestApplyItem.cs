namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Child record of ManifestApply: per-document results.
    /// </summary>
    public class ManifestApplyItem
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
        /// Parent ManifestApply identifier.
        /// </summary>
        public string ManifestApplyId
        {
            get
            {
                return _ManifestApplyId;
            }
            set
            {
                _ManifestApplyId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Zero-based position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Document kind.
        /// </summary>
        public string Kind
        {
            get
            {
                return _Kind;
            }
            set
            {
                _Kind = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Document name.
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
        /// Result.
        /// </summary>
        public ManifestApplyResultEnum Result { get; set; } = ManifestApplyResultEnum.Validated;

        /// <summary>
        /// Resulting resource identifier.
        /// </summary>
        public string? ResourceId { get; set; } = null;

        /// <summary>
        /// Message.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Stable error code of a failed document: ManifestInvalid (a spec field has the wrong type or a value that is
        /// not allowed), ValidationFailed, or a reference or template code such as ReferenceNotFound. Null otherwise.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// Path of the field that failed, for example documents[1].spec.kind; null when the failure is not about one field.
        /// </summary>
        public string? ErrorField { get; set; } = null;

        /// <summary>
        /// Field-level changes for Updated items (also reported by dry runs): one entry per changed field, with values as strings truncated to 200 characters. Empty for other results.
        /// </summary>
        public List<ManifestFieldChange> Changes
        {
            get
            {
                return _Changes;
            }
            set
            {
                _Changes = value ?? new List<ManifestFieldChange>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _ManifestApplyId = String.Empty;
        private string _Kind = String.Empty;
        private string _Name = String.Empty;
        private List<ManifestFieldChange> _Changes = new List<ManifestFieldChange>();

        #endregion
    }
}
