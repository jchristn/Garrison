namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// A person's or API credential's request to file a report (AA5.6). Runs file with garrison_file_report instead.
    /// </summary>
    public class ReportFileRequest
    {
        /// <summary>
        /// Agent the report is from, by identifier or name, or null to file in your own name.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// App the report is filed within, by identifier or name, or null. A named agent must be a member of it.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Audience. Default Manager.
        /// </summary>
        public ReportAudienceEnum? Audience { get; set; } = null;

        /// <summary>
        /// Kind. Default Status.
        /// </summary>
        public ReportKindEnum? Kind { get; set; } = null;

        /// <summary>
        /// Health. Default Unknown.
        /// </summary>
        public ReportHealthEnum? Health { get; set; } = null;

        /// <summary>
        /// Title, 1 to 256 characters. Required.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Body text, at most Reports.MaxBodyBytes UTF-8 bytes.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Start of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodStartUtc { get; set; } = null;

        /// <summary>
        /// End of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodEndUtc { get; set; } = null;

        /// <summary>
        /// Measurements, at most 50.
        /// </summary>
        public List<ReportMetric>? Metrics { get; set; } = null;

        /// <summary>
        /// Problems, at most 50.
        /// </summary>
        public List<ReportIssue>? Issues { get; set; } = null;

        /// <summary>
        /// Decisions taken, at most 50.
        /// </summary>
        public List<ReportDecision>? Decisions { get; set; } = null;

        /// <summary>
        /// Optional idempotency key, at most 256 characters: filing again with the same key returns the first report.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;
    }
}
