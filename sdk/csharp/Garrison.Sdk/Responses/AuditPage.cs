namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Page of audit records.
    /// </summary>
    public class AuditPage
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
        /// Total matching records.
        /// </summary>
        public long TotalCount { get; set; } = 0;

        /// <summary>
        /// Total pages.
        /// </summary>
        public int TotalPages { get; set; } = 0;

        /// <summary>
        /// Records.
        /// </summary>
        public List<Garrison.Sdk.Models.AuditRecord> Objects { get; set; } = new List<Garrison.Sdk.Models.AuditRecord>();
    }
}
