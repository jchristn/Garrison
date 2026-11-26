namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// The change rules' verdict on an executive's draft (AA8.6): it applies without a person only when every change is
    /// covered. Not thread-safe.
    /// </summary>
    public class ChangeRuleMatch
    {
        #region Public-Members

        /// <summary>
        /// Per change.
        /// </summary>
        public List<ChangeRuleMatchItem> Items { get; set; } = new List<ChangeRuleMatchItem>();

        /// <summary>
        /// Whether the draft has at least one change and every change is covered by a rule.
        /// </summary>
        public bool AllMatched
        {
            get
            {
                return Items.Count > 0 && Items.All(i => i.RuleId != null);
            }
        }

        /// <summary>
        /// Distinct rules that cover changes, in first-use order.
        /// </summary>
        public List<string> RuleIds
        {
            get
            {
                return Items.Where(i => i.RuleId != null).Select(i => i.RuleId!).Distinct(StringComparer.Ordinal).ToList();
            }
        }

        #endregion
    }
}
