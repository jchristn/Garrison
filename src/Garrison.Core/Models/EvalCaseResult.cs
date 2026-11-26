namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Helpers;

    /// <summary>
    /// The outcome of one case (or one replayed recent input) in an eval run (AA9.1, AA9.3). Insert-only. Not
    /// thread-safe.
    /// </summary>
    public class EvalCaseResult
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix evx_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewEvalCaseResultId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Eval run the result belongs to.
        /// </summary>
        public string EvalRunId
        {
            get
            {
                return _EvalRunId;
            }
            set
            {
                _EvalRunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Case scored, or null for a replayed recent input (input mode RecentInputs).
        /// </summary>
        public string? CaseId { get; set; } = null;

        /// <summary>
        /// Zero-based position of the input in the run: the case's index in the set's case list, or the recent input's
        /// index. Unique within an eval run, so a case is recorded once. Minimum 0.
        /// </summary>
        public int Order
        {
            get
            {
                return _Order;
            }
            set
            {
                _Order = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Earlier run whose input was replayed (input mode RecentInputs), or null.
        /// </summary>
        public string? SourceRunId { get; set; } = null;

        /// <summary>
        /// The Eval run that produced the output, or null when it could not start.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Output of the run, or null.
        /// </summary>
        public string? OutputText { get; set; } = null;

        /// <summary>
        /// Weighted case score from 0 to 1; values outside are clamped.
        /// </summary>
        public double Score
        {
            get
            {
                return _Score;
            }
            set
            {
                _Score = Math.Clamp(value, 0, 1);
            }
        }

        /// <summary>
        /// Whether the case passed (every check with weight above 0 passed and the run succeeded).
        /// </summary>
        public bool Passed { get; set; } = false;

        /// <summary>
        /// Why the case could not be scored (the run failed, timed out, or could not start), or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// USD spent by the case run and its judge runs.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Per-check results, in the case's check order.
        /// </summary>
        public List<EvalCaseCheckResult> CheckResults
        {
            get
            {
                return _CheckResults;
            }
            set
            {
                _CheckResults = value ?? new List<EvalCaseCheckResult>();
            }
        }

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewEvalCaseResultId();
        private string _TenantId = String.Empty;
        private string _EvalRunId = String.Empty;
        private int _Order = 0;
        private double _Score = 0;
        private List<EvalCaseCheckResult> _CheckResults = new List<EvalCaseCheckResult>();

        #endregion
    }
}
