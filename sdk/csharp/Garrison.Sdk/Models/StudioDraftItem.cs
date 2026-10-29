namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One manifest document in a studio draft, keyed by kind and name. Not thread-safe.
    /// </summary>
    public class StudioDraftItem
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind, for example Agent or AgenticApp. Never null.
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
        /// What applying does with the item. Default Upsert.
        /// </summary>
        public StudioDraftOperationEnum Operation { get; set; } = StudioDraftOperationEnum.Upsert;

        /// <summary>
        /// Manifest YAML as stored; empty for a Delete item. Never null.
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

        /// <summary>
        /// Hash of the live document the item started from, or null when the resource did not exist. The studio uses it to
        /// notice when live configuration changed under the draft (the diff marks the item stale).
        /// </summary>
        public string? BaseHash { get; set; } = null;

        /// <summary>
        /// Last change, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Kind = String.Empty;
        private string _Name = String.Empty;
        private string _Document = String.Empty;

        #endregion
    }
}
