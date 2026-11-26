namespace Garrison.Core.Evaluation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// One case an eval run runs (AA9.3): a case of the set, or in RecentInputs mode a recent run's input replayed with the
    /// set's judge checks (AA9.11). Not thread-safe.
    /// </summary>
    public class EvalWorkItem
    {
        #region Public-Members

        /// <summary>
        /// Position within the eval run, from 0; unique per eval run (the result's order).
        /// </summary>
        public int Order { get; set; } = 0;

        /// <summary>
        /// Case identifier, or null for a recent input.
        /// </summary>
        public string? CaseId { get; set; } = null;

        /// <summary>
        /// Case name, or null.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Input the target runs with. Never null.
        /// </summary>
        public string InputText
        {
            get
            {
                return _InputText;
            }
            set
            {
                _InputText = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Expected text, or null (always null for a recent input).
        /// </summary>
        public string? ExpectedText { get; set; } = null;

        /// <summary>
        /// Whether the case is hidden from the proposer's run tokens (AA-024).
        /// </summary>
        public bool Hidden { get; set; } = false;

        /// <summary>
        /// Checks scored against the output; empty means the defaults of <see cref="EvalCaseScoring.EffectiveChecks"/>.
        /// </summary>
        public List<EvalCaseCheck> Checks
        {
            get
            {
                return _Checks;
            }
            set
            {
                _Checks = value ?? new List<EvalCaseCheck>();
            }
        }

        /// <summary>
        /// Run whose input a recent-input item replays, or the run a case was saved from; null otherwise.
        /// </summary>
        public string? SourceRunId { get; set; } = null;

        #endregion

        #region Private-Members

        private string _InputText = String.Empty;
        private List<EvalCaseCheck> _Checks = new List<EvalCaseCheck>();

        #endregion
    }
}
