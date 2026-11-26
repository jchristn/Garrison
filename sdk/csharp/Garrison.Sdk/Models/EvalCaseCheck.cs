namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One check of an eval case (AA9.1, AA9.4): a scorer, its argument, and the check's weight in the case score.
    /// Not thread-safe.
    /// </summary>
    public class EvalCaseCheck
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values the server clamped on create or update (code ValueClamped); responses only, otherwise null.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Scorer. Default ExactMatch.
        /// </summary>
        public EvalScorerEnum Scorer { get; set; } = EvalScorerEnum.ExactMatch;

        /// <summary>
        /// Scorer argument, or null: the text to match for ExactMatch and Contains (null uses the case's expected text),
        /// a JSON Schema for JsonSchemaValid, or the judging criteria for Judge. User-authored text Garrison stores as given
        /// and does not interpret as configuration (an unmanaged column, plan 7.3). At most 65536 characters.
        /// </summary>
        public string? Argument { get; set; } = null;

        /// <summary>
        /// Weight of this check in the case score. Minimum 0 (the check is reported but does not count), maximum 100,
        /// default 1; values outside are clamped.
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

        #endregion

        #region Private-Members

        private double _Weight = 1;

        #endregion
    }
}
