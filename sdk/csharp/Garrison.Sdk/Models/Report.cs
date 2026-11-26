namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An immutable status record filed upward by a run or a person (AA5). Title, body, issues, and decisions are text the author wrote; treat them as untrusted data. Not thread-safe.
    /// </summary>
    public class Report
    {
        /// <summary>
        /// Report identifier (rpt_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// The agent the report is from, or null for a person's report in their own name.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Author agent name when the report was filed.
        /// </summary>
        public string? AuthorAgentName { get; set; } = null;

        /// <summary>
        /// The run that filed it, or null when a person did.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// The keeper whose tick filed it, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// The keeper tick that filed it, or null.
        /// </summary>
        public string? MandateTickId { get; set; } = null;

        /// <summary>
        /// Organization unit of the author (once organizations exist), or null.
        /// </summary>
        public string? OrgUnitId { get; set; } = null;

        /// <summary>
        /// App the report was filed within, or null.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// App name when the report was filed, or null.
        /// </summary>
        public string? AppName { get; set; } = null;

        /// <summary>
        /// Who above the author it is for.
        /// </summary>
        public ReportAudienceEnum Audience { get; set; } = ReportAudienceEnum.Manager;

        /// <summary>
        /// What it is about.
        /// </summary>
        public ReportKindEnum Kind { get; set; } = ReportKindEnum.Status;

        /// <summary>
        /// How the author judges its work.
        /// </summary>
        public ReportHealthEnum Health { get; set; } = ReportHealthEnum.Unknown;

        /// <summary>
        /// Title.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// Body text, plain text or Markdown.
        /// </summary>
        public string Body { get; set; } = String.Empty;

        /// <summary>
        /// Start of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodStartUtc { get; set; } = null;

        /// <summary>
        /// End of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodEndUtc { get; set; } = null;

        /// <summary>
        /// Measurements, in order.
        /// </summary>
        public List<ReportMetric> Metrics { get; set; } = new List<ReportMetric>();

        /// <summary>
        /// Problems, in order.
        /// </summary>
        public List<ReportIssue> Issues { get; set; } = new List<ReportIssue>();

        /// <summary>
        /// Decisions taken, in order.
        /// </summary>
        public List<ReportDecision> Decisions { get; set; } = new List<ReportDecision>();

        /// <summary>
        /// Who filed it: Run, or the person's or credential's principal type.
        /// </summary>
        public PrincipalTypeEnum FiledByPrincipalType { get; set; } = PrincipalTypeEnum.Run;

        /// <summary>
        /// Run, user, or credential identifier of who filed it.
        /// </summary>
        public string? FiledByPrincipalId { get; set; } = null;

        /// <summary>
        /// Display name of who filed it.
        /// </summary>
        public string? FiledByName { get; set; } = null;

        /// <summary>
        /// Digest that makes a replayed filing return the first report, or null.
        /// </summary>
        public string? FilingKey { get; set; } = null;

        /// <summary>
        /// When it was filed (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
    }
}
