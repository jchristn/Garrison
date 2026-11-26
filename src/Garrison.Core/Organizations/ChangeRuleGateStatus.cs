namespace Garrison.Core.Organizations
{
    using System;

    /// <summary>
    /// Whether one draft passes one change rule's eval gate (AA9.10): a completed eval run of the draft against the gate
    /// set's latest approved version, created after the draft's last change, at or above the rule's threshold. Computed
    /// before rule matching, because matching itself reads nothing. Not thread-safe.
    /// </summary>
    public class ChangeRuleGateStatus
    {
        #region Public-Members

        /// <summary>
        /// Rule identifier.
        /// </summary>
        public string RuleId { get; set; } = String.Empty;

        /// <summary>
        /// Whether the gate is passed.
        /// </summary>
        public bool Satisfied { get; set; } = false;

        /// <summary>
        /// The passing eval run, or when the gate is not passed the latest current eval run against the set, or null.
        /// </summary>
        public string? EvalRunId { get; set; } = null;

        /// <summary>
        /// Why the gate is not passed, phrased to follow "Needs a person: ", or null when it is.
        /// </summary>
        public string? Reason { get; set; } = null;

        #endregion
    }
}
