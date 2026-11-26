namespace Garrison.Core.Evaluation
{
    using System;

    /// <summary>
    /// What one judge run returned (AA9.4). Not thread-safe.
    /// </summary>
    public class EvalJudgeRunResult
    {
        #region Public-Members

        /// <summary>
        /// Judge run identifier, or null when no run started.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// The judge's reply text, or null.
        /// </summary>
        public string? Output { get; set; } = null;

        /// <summary>
        /// The judge's structured output as JSON text when its agent has an output schema, or null.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// USD the judge run spent, 0 or more.
        /// </summary>
        public double CostUsd
        {
            get
            {
                return _CostUsd;
            }
            set
            {
                _CostUsd = Double.IsNaN(value) ? 0 : Math.Max(0, value);
            }
        }

        /// <summary>
        /// Why the judge gave no reply (it could not start, failed, or timed out), or null when it replied.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        #endregion

        #region Private-Members

        private double _CostUsd = 0;

        #endregion
    }
}
