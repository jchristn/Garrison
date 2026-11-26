namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Filter for listing eval set versions, newest first. Not thread-safe.
    /// </summary>
    public class EvalSetFilter
    {
        #region Public-Members

        /// <summary>
        /// Only versions in this state, or null for all.
        /// </summary>
        public EvalSetStateEnum? State { get; set; } = null;

        /// <summary>
        /// Only sets with this origin, or null for all.
        /// </summary>
        public EvalSetOriginEnum? Origin { get; set; } = null;

        /// <summary>
        /// Only sets carrying this tag, or null.
        /// </summary>
        public string? Tag { get; set; } = null;

        /// <summary>
        /// True for the newest version of each set name only. Default false.
        /// </summary>
        public bool LatestOnly { get; set; } = false;

        /// <summary>
        /// Text to match, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0, default 0.
        /// </summary>
        public int Skip
        {
            get
            {
                return _Skip;
            }
            set
            {
                if (value < 0) throw new ArgumentOutOfRangeException(nameof(Skip));
                _Skip = value;
            }
        }

        /// <summary>
        /// Page size. Default 100, minimum 1, maximum 1000.
        /// </summary>
        public int MaxResults
        {
            get
            {
                return _MaxResults;
            }
            set
            {
                if (value < 1 || value > 1000) throw new ArgumentOutOfRangeException(nameof(MaxResults));
                _MaxResults = value;
            }
        }

        #endregion

        #region Private-Members

        private int _Skip = 0;
        private int _MaxResults = 100;

        #endregion
    }
}
