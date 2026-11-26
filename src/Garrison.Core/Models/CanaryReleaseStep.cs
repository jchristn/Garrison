namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One step of a canary release (AA9.1, AA9.8). The release holds the step until both minimums are met and health
    /// stays within thresholds, then advances to the next step. Steps run in list order. Not thread-safe.
    /// </summary>
    public class CanaryReleaseStep
    {
        #region Public-Members

        /// <summary>
        /// Warnings about values that were clamped on create (code ValueClamped), or null. Never stored.
        /// </summary>
        public List<FieldWarning>? Warnings
        {
            get
            {
                return _ClampWarnings.Count > 0 ? _ClampWarnings : null;
            }
        }

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
                _WeightPercent = ValueClamp.Int(value, 1, 100, "weightPercent", _ClampWarnings);
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
                _MinimumRuns = ValueClamp.Int(value, 0, 1000000, "minimumRuns", _ClampWarnings);
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
                _MinimumMinutes = ValueClamp.Int(value, 0, 43200, "minimumMinutes", _ClampWarnings);
            }
        }

        #endregion

        #region Private-Members

        private readonly List<FieldWarning> _ClampWarnings = new List<FieldWarning>();
        private int _WeightPercent = 10;
        private int _MinimumRuns = 20;
        private int _MinimumMinutes = 10;

        #endregion
    }
}
