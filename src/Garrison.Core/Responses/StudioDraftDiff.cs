namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Organizations;

    /// <summary>
    /// A draft compared with live configuration and validated by a manifest dry run (AD7.2).
    /// </summary>
    public class StudioDraftDiff
    {
        /// <summary>
        /// Draft identifier.
        /// </summary>
        public string DraftId { get; set; } = String.Empty;

        /// <summary>
        /// Draft version compared.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Whether every item validated and nothing is stale.
        /// </summary>
        public bool Valid { get; set; } = false;

        /// <summary>
        /// Items, in apply order.
        /// </summary>
        public List<StudioDraftDiffItem> Items { get; set; } = new List<StudioDraftDiffItem>();

        /// <summary>
        /// For an executive's draft (AA8.3), the hard limits it breaks; empty otherwise or when it passes.
        /// </summary>
        public List<ExecutiveRefusal> Refusals { get; set; } = new List<ExecutiveRefusal>();

        /// <summary>
        /// For an executive's draft (AA8.5, AA8.6), each change with its classes and the change rule that covers it or why
        /// none does; empty for any other draft.
        /// </summary>
        public List<ChangeRuleMatchItem> RuleMatches { get; set; } = new List<ChangeRuleMatchItem>();

        /// <summary>
        /// For an executive's draft, whether requesting apply would apply it at once under change rules (valid, and every
        /// change covered); false otherwise.
        /// </summary>
        public bool AppliesByRule { get; set; } = false;
    }
}
