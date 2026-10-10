namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewManifestApplyItemId() : value;
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
        /// What the apply does (or, in a dry run, would do) with this document: Created, Updated, or Unchanged; Failed
        /// when it failed validation. In a dry run Result is Validated and this carries the planned outcome.
        /// </summary>
        public ManifestApplyResultEnum? PlannedResult { get; set; } = null;

        /// <summary>
        /// Fields that change on an existing resource (planned result Updated), with before and after values as text.
        /// Empty for created, unchanged, and failed documents.
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

        private string _Id = IdGenerator.NewManifestApplyItemId();
        private string _ManifestApplyId = String.Empty;
        private string _Kind = String.Empty;
        private string _Name = String.Empty;
        private List<ManifestFieldChange> _Changes = new List<ManifestFieldChange>();

        #endregion
    }
}
