namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Fields carried by ReportUnhealthy notifications (AA5.7). The title is included so a person can see what is wrong
    /// from the notification; the body, issues, and decisions are not, and are read from the report.
    /// </summary>
    public class NotificationReportSummary
    {
        #region Public-Members

        /// <summary>
        /// Report identifier (rpt_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Author agent identifier, or null for a person's report.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Author agent name when the report was filed, or null.
        /// </summary>
        public string? AuthorAgentName { get; set; } = null;

        /// <summary>
        /// The keeper whose tick filed the report, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// The app the report was filed within, or null.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// Report kind.
        /// </summary>
        public ReportKindEnum Kind { get; set; } = ReportKindEnum.Status;

        /// <summary>
        /// Report health. Always Unhealthy for ReportUnhealthy.
        /// </summary>
        public ReportHealthEnum Health { get; set; } = ReportHealthEnum.Unhealthy;

        /// <summary>
        /// Report title, written by the author.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// When the report was filed (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
