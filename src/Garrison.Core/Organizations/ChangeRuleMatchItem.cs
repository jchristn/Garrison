namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// How one change of an executive's draft fared against the change rules (AA8.6). Not thread-safe.
    /// </summary>
    public class ChangeRuleMatchItem
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind of the item.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Item name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What changed, or null.
        /// </summary>
        public string? Detail { get; set; } = null;

        /// <summary>
        /// What the change is about; count limits count distinct subjects.
        /// </summary>
        public string Subject { get; set; } = String.Empty;

        /// <summary>
        /// Classes of the change.
        /// </summary>
        public List<ChangeClassEnum> Classes { get; set; } = new List<ChangeClassEnum>();

        /// <summary>
        /// The rule that covers the change, or null when it needs a person.
        /// </summary>
        public string? RuleId { get; set; } = null;

        /// <summary>
        /// The covering rule's name, or null.
        /// </summary>
        public string? RuleName { get; set; } = null;

        /// <summary>
        /// Why no rule covers the change, or null when one does.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Machine-readable reason when the change waits for a person, or null. EvalGatePending (AA9.10): a rule would
        /// cover the change once the draft passes the rule's eval gate.
        /// </summary>
        public string? Code { get; set; } = null;

        /// <summary>
        /// The passing eval run that satisfied the covering rule's eval gate, or null when the rule has no gate.
        /// </summary>
        public string? GateEvalRunId { get; set; } = null;

        #endregion
    }
}
