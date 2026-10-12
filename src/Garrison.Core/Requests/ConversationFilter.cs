namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Typed filter for listing conversations.
    /// </summary>
    public class ConversationFilter
    {
        /// <summary>
        /// Tenant identifier, or null to list across tenants (system administrators only).
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Agent identifier filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Client-supplied A2A context identifier filter.
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Caller principal identifier filter (who started the conversation).
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Case-insensitive substring of the title.
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
        /// Maximum records to return. Minimum 1, maximum 1000, default 25.
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
        /// Ordering. Default newest first.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;

        private int _Skip = 0;
        private int _MaxResults = 25;
    }
}
