namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Create or replace one studio draft item at the version the caller read. Not thread-safe.
    /// </summary>
    public class StudioDraftItemRequest
    {
        #region Public-Members

        /// <summary>
        /// The draft version the caller read. Minimum 1, default 1. A version the draft has moved past fails with 409
        /// DraftVersionConflict.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when set below 1.</exception>
        public int Version
        {
            get
            {
                return _Version;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(Version), "Version is 1 or more.");
                _Version = value;
            }
        }

        /// <summary>
        /// Upsert or Delete, or null for Upsert.
        /// </summary>
        public StudioDraftOperationEnum? Operation { get; set; } = null;

        /// <summary>
        /// One manifest document whose kind and name match the item (400 DocumentMismatch otherwise). Ignored for Delete.
        /// Never null.
        /// </summary>
        public string Document
        {
            get
            {
                return _Document;
            }
            set
            {
                _Document = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private int _Version = 1;
        private string _Document = String.Empty;

        #endregion
    }
}
