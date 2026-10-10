namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Page of request history entries (bodies omitted).
    /// </summary>
    public class RequestHistoryPage
    {
        /// <summary>
        /// Page number.
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Page size.
        /// </summary>
        public int PageSize { get; set; } = 25;

        /// <summary>
        /// Total matching entries.
        /// </summary>
        public long TotalCount { get; set; } = 0;

        /// <summary>
        /// Total pages.
        /// </summary>
        public int TotalPages { get; set; } = 0;

        /// <summary>
        /// Entries.
        /// </summary>
        public List<Garrison.Core.Models.RequestHistoryEntry> Objects { get; set; } = new List<Garrison.Core.Models.RequestHistoryEntry>();
    }
}
