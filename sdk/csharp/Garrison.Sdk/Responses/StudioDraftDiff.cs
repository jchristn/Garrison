namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A studio draft compared with live configuration, per document: a manifest dry run of the draft's documents plus a
    /// check of each delete and of every item's base. Not thread-safe.
    /// </summary>
    public class StudioDraftDiff
    {
        #region Public-Members

        /// <summary>
        /// Draft identifier. Never null.
        /// </summary>
        public string DraftId
        {
            get
            {
                return _DraftId;
            }
            set
            {
                _DraftId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The draft version compared.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// True when no item failed and no item is stale.
        /// </summary>
        public bool Valid { get; set; } = false;

        /// <summary>
        /// One entry per draft item. Never null.
        /// </summary>
        public List<StudioDraftDiffItem> Items
        {
            get
            {
                return _Items;
            }
            set
            {
                _Items = value ?? new List<StudioDraftDiffItem>();
            }
        }

        #endregion

        #region Private-Members

        private string _DraftId = String.Empty;
        private List<StudioDraftDiffItem> _Items = new List<StudioDraftDiffItem>();

        #endregion
    }
}
