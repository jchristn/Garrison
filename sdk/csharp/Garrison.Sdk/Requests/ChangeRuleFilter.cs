namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Filter for listing change rules. Not thread-safe.
    /// </summary>
    public class ChangeRuleFilter
    {
        #region Public-Members

        /// <summary>
        /// Only rules of this organization (identifier or name), or null for all. An unknown organization answers 404.
        /// </summary>
        public string? Organization { get; set; } = null;

        /// <summary>
        /// Only rules on this unit (identifier or name) of the organization, or null for all. Needs Organization.
        /// </summary>
        public string? Unit { get; set; } = null;

        /// <summary>
        /// True for active rules only. Default false.
        /// </summary>
        public bool ActiveOnly { get; set; } = false;

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
