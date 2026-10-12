namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed conversation enumeration filter. Null filters are not sent.
    /// </summary>
    public class ConversationFilter
    {
        #region Public-Members

        /// <summary>
        /// Agent filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Client-supplied A2A context identifier filter.
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Caller principal filter.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Free-text search.
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
                _Skip = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Page size. Minimum 1, maximum 1000, default 25.
        /// </summary>
        public int MaxResults
        {
            get
            {
                return _MaxResults;
            }
            set
            {
                _MaxResults = Math.Clamp(value, 1, 1000);
            }
        }

        /// <summary>
        /// Ordering. Default CreatedDescending.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;

        #endregion

        #region Private-Members

        private int _Skip = 0;
        private int _MaxResults = 25;

        #endregion
    }
}
