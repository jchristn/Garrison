namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// The outcome of one check of an eval case in an eval run (AA9.1, AA9.4). Not thread-safe.
    /// </summary>
    public class EvalCaseCheckResult
    {
        #region Public-Members

        /// <summary>
        /// Scorer that produced the result.
        /// </summary>
        public EvalScorerEnum Scorer { get; set; } = EvalScorerEnum.ExactMatch;

        /// <summary>
        /// Weight the check carried, copied from the case at run time. Minimum 0, maximum 100.
        /// </summary>
        public double Weight
        {
            get
            {
                return _Weight;
            }
            set
            {
                _Weight = Math.Clamp(value, 0, 100);
            }
        }

        /// <summary>
        /// Score from 0 to 1; values outside are clamped.
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
        /// Whether the check passed.
        /// </summary>
        public bool Passed { get; set; } = false;

        /// <summary>
        /// Run of the judge agent for a Judge check, or null.
        /// </summary>
        public string? JudgeRunId { get; set; } = null;

        /// <summary>
        /// The scorer's explanation (a judge's reasoning, a schema error), at most 4000 characters, or null.
        /// </summary>
        public string? Note { get; set; } = null;

        #endregion

        #region Private-Members

        private double _Weight = 1;
        private double _Score = 0;

        #endregion
    }
}
