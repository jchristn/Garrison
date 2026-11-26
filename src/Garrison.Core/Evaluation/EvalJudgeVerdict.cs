namespace Garrison.Core.Evaluation
{
    using System;

    /// <summary>
    /// The verdict a judge agent replies with (AA9.4): the typed output schema builtin/eval-judge asks for, a JSON object
    /// <c>{"score": 0.8, "passed": true, "reason": "..."}</c>. Not thread-safe.
    /// </summary>
    public class EvalJudgeVerdict
    {
        #region Public-Members

        /// <summary>
        /// Score from 0 to 1. Values outside are clamped.
        /// </summary>
        public double Score
        {
            get
            {
                return _Score;
            }
            set
            {
                _Score = Double.IsNaN(value) ? 0 : Math.Clamp(value, 0, 1);
            }
        }

        /// <summary>
        /// Whether the answer passes, or null to decide by score.
        /// </summary>
        public bool? Passed { get; set; } = null;

        /// <summary>
        /// The judge's reason in a sentence or two, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        #endregion

        #region Private-Members

        private double _Score = 0;

        #endregion
    }
}
