namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Report list filter (AA5). Results are newest first.
    /// </summary>
    public class ReportFilter
    {
        /// <summary>
        /// Author agent identifier or name, or null for any.
        /// </summary>
        public string? Author { get; set; } = null;

        /// <summary>
        /// App identifier or name, or null for any.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Organization unit identifier, or null for any.
        /// </summary>
        public string? Unit { get; set; } = null;

        /// <summary>
        /// Kind, or null for any.
        /// </summary>
        public ReportKindEnum? Kind { get; set; } = null;

        /// <summary>
        /// Health, or null for any.
        /// </summary>
        public ReportHealthEnum? Health { get; set; } = null;

        /// <summary>
        /// Filing run, or null for any.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Filed at or after this time (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Filed before this time (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Case-insensitive text matched against titles, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size, 1 to 1000. Default 25.
        /// </summary>
        public int MaxResults { get; set; } = 25;
    }
}
