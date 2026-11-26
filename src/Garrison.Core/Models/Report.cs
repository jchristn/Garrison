namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A structured status record filed upward by a run or a person (AA5, AA-019). Reports are immutable: once filed, no
    /// field changes. Title, body, issues, and decisions are text written by the author and reach a prompt only framed as
    /// data (AA-025). Not thread-safe.
    /// </summary>
    public class Report
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix rpt_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewReportId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The agent the report is from: the filing run's agent, or the agent a person named. Null for a report a person
        /// filed in their own name.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Name of the author agent when the report was filed. Kept after the agent is deleted.
        /// </summary>
        public string? AuthorAgentName { get; set; } = null;

        /// <summary>
        /// The run that filed the report, or null when a person filed it.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// The keeper whose tick filed the report, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// The keeper tick that filed the report, or null.
        /// </summary>
        public string? MandateTickId { get; set; } = null;

        /// <summary>
        /// The organization unit the author belonged to (AA7). Null until organizations exist.
        /// </summary>
        public string? OrgUnitId { get; set; } = null;

        /// <summary>
        /// The agentic app the report is filed within, or null. The author must be a member of it.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// Name of the app when the report was filed, or null.
        /// </summary>
        public string? AppName { get; set; } = null;

        /// <summary>
        /// Who above the author the report is addressed to. Default Manager.
        /// </summary>
        public ReportAudienceEnum Audience { get; set; } = ReportAudienceEnum.Manager;

        /// <summary>
        /// What the report is about. Default Status.
        /// </summary>
        public ReportKindEnum Kind { get; set; } = ReportKindEnum.Status;

        /// <summary>
        /// The author's judgment of the health of its work. Default Unknown.
        /// </summary>
        public ReportHealthEnum Health { get; set; } = ReportHealthEnum.Unknown;

        /// <summary>
        /// Title, 1 to 256 characters, trimmed.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 256 characters.</exception>
        public string Title
        {
            get
            {
                return _Title;
            }
            set
            {
                string trimmed = (value ?? String.Empty).Trim();
                if (trimmed.Length < 1 || trimmed.Length > 256) throw new ArgumentException("A report title holds 1 to 256 characters.", nameof(Title));
                _Title = trimmed;
            }
        }

        /// <summary>
        /// Body text, plain text or Markdown written by the author. At most Reports.MaxBodyBytes UTF-8 bytes (default
        /// 32768), checked when the report is filed. Empty when not set.
        /// </summary>
        public string Body
        {
            get
            {
                return _Body;
            }
            set
            {
                _Body = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Start of the period the report covers (UTC), or null.
        /// </summary>
        public DateTime? PeriodStartUtc { get; set; } = null;

        /// <summary>
        /// End of the period the report covers (UTC), or null. Must not be before PeriodStartUtc.
        /// </summary>
        public DateTime? PeriodEndUtc { get; set; } = null;

        /// <summary>
        /// Measurements, at most 50, in the order given.
        /// </summary>
        public List<ReportMetric> Metrics
        {
            get
            {
                return _Metrics;
            }
            set
            {
                _Metrics = value ?? new List<ReportMetric>();
            }
        }

        /// <summary>
        /// Problems, at most 50, in the order given.
        /// </summary>
        public List<ReportIssue> Issues
        {
            get
            {
                return _Issues;
            }
            set
            {
                _Issues = value ?? new List<ReportIssue>();
            }
        }

        /// <summary>
        /// Decisions taken, at most 50, in the order given.
        /// </summary>
        public List<ReportDecision> Decisions
        {
            get
            {
                return _Decisions;
            }
            set
            {
                _Decisions = value ?? new List<ReportDecision>();
            }
        }

        /// <summary>
        /// Who filed the report: Run for a run, otherwise the person's or credential's principal type.
        /// </summary>
        public PrincipalTypeEnum FiledByPrincipalType { get; set; } = PrincipalTypeEnum.Run;

        /// <summary>
        /// Principal identifier of who filed the report: the run, user, or credential identifier.
        /// </summary>
        public string? FiledByPrincipalId { get; set; } = null;

        /// <summary>
        /// Display name of who filed the report.
        /// </summary>
        public string? FiledByName { get; set; } = null;

        /// <summary>
        /// Uppercase hexadecimal SHA-256 that makes a replayed filing return the first report instead of filing another:
        /// computed from the run and the report's content for runs, or from the caller and idempotencyKey for people.
        /// Null for a person's filing without an idempotency key.
        /// </summary>
        public string? FilingKey { get; set; } = null;

        /// <summary>
        /// When the report was filed (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewReportId();
        private string _TenantId = String.Empty;
        private string _Title = "Report";
        private string _Body = String.Empty;
        private List<ReportMetric> _Metrics = new List<ReportMetric>();
        private List<ReportIssue> _Issues = new List<ReportIssue>();
        private List<ReportDecision> _Decisions = new List<ReportDecision>();

        #endregion
    }
}
