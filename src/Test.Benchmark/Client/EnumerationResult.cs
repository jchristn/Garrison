namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Envelope of every Garrison list endpoint (REST_API.md, Enumeration).
    /// </summary>
    /// <typeparam name="T">Record type.</typeparam>
    public class EnumerationResult<T>
    {
        /// <summary>
        /// Page size used.
        /// </summary>
        public int MaxResults { get; set; }

        /// <summary>
        /// Records skipped.
        /// </summary>
        public int Skip { get; set; }

        /// <summary>
        /// Total matching records.
        /// </summary>
        public long TotalRecords { get; set; }

        /// <summary>
        /// Whether this page is the last.
        /// </summary>
        public bool EndOfResults { get; set; }

        /// <summary>
        /// Records on this page.
        /// </summary>
        public List<T> Objects { get; set; } = new List<T>();
    }
}
