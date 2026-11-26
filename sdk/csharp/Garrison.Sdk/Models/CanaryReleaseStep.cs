namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One step of a canary release (AA9.1, AA9.8). The release holds the step until both minimums are met and health
    /// stays within thresholds, then advances to the next step. Steps run in list order. Not thread-safe.
    /// </summary>
    public class CanaryReleaseStep
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values the server clamped on create (code ValueClamped); responses only, otherwise null.
        /// </summary>
        public List<FieldWarning>? Warnings { get; set; } = null;

        /// <summary>
        /// Percent of the agent's traffic the candidate receives during the step. Minimum 1, maximum 100, default 10;
        /// values outside are clamped. The last step is normally 100.
        /// </summary>
        public int WeightPercent
        {
            get
            {
                return _WeightPercent;
            }
            set
            {
                _WeightPercent = Math.Clamp(value, 1, 100);
            }
        }

        /// <summary>
        /// Candidate runs that must finish during the step before it may advance. Minimum 0, maximum 1000000, default 20;
        /// values outside are clamped.
        /// </summary>
        public int MinimumRuns
        {
            get
            {
                return _MinimumRuns;
            }
            set
            {
                _MinimumRuns = Math.Clamp(value, 0, 1000000);
            }
        }

        /// <summary>
        /// Minutes the step must last before it may advance. Minimum 0, maximum 43200 (30 days), default 10; values
        /// outside are clamped.
        /// </summary>
        public int MinimumMinutes
        {
            get
            {
                return _MinimumMinutes;
            }
            set
            {
                _MinimumMinutes = Math.Clamp(value, 0, 43200);
            }
        }

        #endregion

        #region Private-Members

        private int _WeightPercent = 10;
        private int _MinimumRuns = 20;
        private int _MinimumMinutes = 10;

        #endregion
    }
}
