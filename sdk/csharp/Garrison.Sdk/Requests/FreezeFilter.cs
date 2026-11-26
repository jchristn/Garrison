namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Filter for listing freezes. Not thread-safe.
    /// </summary>
    public class FreezeFilter
    {
        #region Public-Members

        /// <summary>
        /// Only freezes of this target kind, or null for all.
        /// </summary>
        public FreezeTargetKindEnum? TargetKind { get; set; } = null;

        /// <summary>
        /// Only freezes of this target identifier, or null for all.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// True for active freezes only, false for lifted ones only, null for both.
        /// </summary>
        public bool? Active { get; set; } = null;

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
