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

        /// <summary>
        /// For an executive's draft (AA8.3), the hard limits it breaks; empty otherwise or when it passes. Never null.
        /// </summary>
        public List<ExecutiveRefusal> Refusals
        {
            get
            {
                return _Refusals;
            }
            set
            {
                _Refusals = value ?? new List<ExecutiveRefusal>();
            }
        }

        /// <summary>
        /// For an executive's draft (AA8.5, AA8.6), each change with its classes and the change rule that covers it or why
        /// none does; empty for any other draft. Never null.
        /// </summary>
        public List<ChangeRuleMatchItem> RuleMatches
        {
            get
            {
                return _RuleMatches;
            }
            set
            {
                _RuleMatches = value ?? new List<ChangeRuleMatchItem>();
            }
        }

        /// <summary>
        /// For an executive's draft, whether requesting apply would apply it at once under change rules (valid, and every
        /// change covered); false otherwise.
        /// </summary>
        public bool AppliesByRule { get; set; } = false;

        #endregion

        #region Private-Members

        private string _DraftId = String.Empty;
        private List<StudioDraftDiffItem> _Items = new List<StudioDraftDiffItem>();
        private List<ExecutiveRefusal> _Refusals = new List<ExecutiveRefusal>();
        private List<ChangeRuleMatchItem> _RuleMatches = new List<ChangeRuleMatchItem>();

        #endregion
    }
}
