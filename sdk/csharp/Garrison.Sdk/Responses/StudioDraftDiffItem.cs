namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Models;

    /// <summary>
    /// How one studio draft item compares with live configuration. Not thread-safe.
    /// </summary>
    public class StudioDraftDiffItem
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind. Never null.
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
        /// Resource name. Never null.
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
        /// Create (the resource does not exist yet), Update (it exists and differs; see Changes), Delete (the draft deletes
        /// it), Unchanged (applying changes nothing), or Failed (the document does not validate; see Message and ErrorCode).
        /// Default Unchanged. Never null.
        /// </summary>
        public string Change
        {
            get
            {
                return _Change;
            }
            set
            {
                _Change = value ?? "Unchanged";
            }
        }

        /// <summary>
        /// Changed fields of an Update. Never null.
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

        /// <summary>
        /// Why the item failed, or null.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Machine code of the failure, or null.
        /// </summary>
        public string? ErrorCode { get; set; } = null;

        /// <summary>
        /// True when the live resource changed after the draft was based on it.
        /// </summary>
        public bool Stale { get; set; } = false;

        #endregion

        #region Private-Members

        private string _Kind = String.Empty;
        private string _Name = String.Empty;
        private string _Change = "Unchanged";
        private List<ManifestFieldChange> _Changes = new List<ManifestFieldChange>();

        #endregion
    }
}
