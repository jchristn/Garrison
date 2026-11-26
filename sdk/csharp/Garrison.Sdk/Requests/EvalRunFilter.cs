namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Filter for listing eval runs, newest first. Not thread-safe.
    /// </summary>
    public class EvalRunFilter
    {
        #region Public-Members

        /// <summary>
        /// Only runs of this eval set (a version identifier or a set name), or null for all.
        /// </summary>
        public string? Set { get; set; } = null;

        /// <summary>
        /// Only runs against this deployment identifier, or null.
        /// </summary>
        public string? Deployment { get; set; } = null;

        /// <summary>
        /// Only runs of this agent revision identifier, or null.
        /// </summary>
        public string? Revision { get; set; } = null;

        /// <summary>
        /// Only runs in this status, or null for all.
        /// </summary>
        public EvalRunStatusEnum? Status { get; set; } = null;

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
