namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Keepers;
    using Garrison.Core.Models;
    using Garrison.Core.Reports;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Reports (AA5, AA-019, AA-056): runs and people file immutable status records upward; managers read them through
    /// ReportVisibility, and keeper ticks receive their subordinates' new reports through the report-digest template. A
    /// replayed filing (the same content from the same run, or the same idempotency key from the same person) returns the
    /// first report. Thread-safe.
    /// </summary>
    public class ReportService
    {
        #region Private-Members

        private static readonly string _Header = "[Reports] ";
        private readonly DatabaseDriverBase _Database;
        private readonly AuditService _Audit;
        private readonly ReportOptions _Options;
        private readonly ReportVisibility _Visibility;
        private readonly LoggingModule _Logging;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="audit">Audit writer.</param>
        /// <param name="options">Report options.</param>
        /// <param name="visibility">Visibility rules.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ReportService(DatabaseDriverBase database, AuditService audit, ReportOptions options, ReportVisibility visibility, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Visibility = visibility ?? throw new ArgumentNullException(nameof(visibility));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// File a report from a run. The author is the run's agent; the run, keeper, and tick are recorded. A report filed
        /// within an app requires the agent to be a member of it. Filing the same content again from the same run returns
        /// the first report.
        /// </summary>
        /// <param name="run">The filing run.</param>
        /// <param name="request">Kind, health, audience, title, body, period, metrics, issues, decisions, and app.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or request is null.</exception>
        /// <exception cref="ValidationException">Thrown when the report is out of bounds or names an app the agent is not a member of.</exception>
        /// <exception cref="ConflictException">Thrown with RunNotActive when the run has finished.</exception>
        public async Task<Report> FileFromRunAsync(Run run, Report request, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (RunService.IsTerminal(run.Status)) throw new ConflictException("RunNotActive", "Run " + run.Id + " has finished; it cannot file a report.");
            Report report = request;
            report.Id = String.Empty;
            report.TenantId = run.TenantId;
            report.AuthorAgentId = run.AgentId;
            report.AuthorAgentName = run.AgentName;
            report.RunId = run.Id;
            report.MandateId = run.MandateId;
            report.MandateTickId = run.MandateTickId;
            report.OrgUnitId = null;
            report.FiledByPrincipalType = PrincipalTypeEnum.Run;
            report.FiledByPrincipalId = run.Id;
            report.FiledByName = run.AgentName;
            report.FilingKey = Digest("run|" + run.Id + "|" + Canonical(report));
            RequestContext ctx = new RequestContext { TenantId = run.TenantId, PrincipalType = PrincipalTypeEnum.Run, RunId = run.Id, PrincipalName = run.AgentName };
            return await StoreAsync(ctx, report, token).ConfigureAwait(false);
        }

        /// <summary>
        /// File a report from a person or an API credential, optionally in an agent's name. With an idempotency key, filing
        /// again with the same key returns the first report.
        /// </summary>
        /// <param name="ctx">The filing principal.</param>
        /// <param name="tenantId">Tenant the report is filed in.</param>
        /// <param name="request">Report, with AuthorAgentId and AppId already resolved to identifiers or null.</param>
        /// <param name="idempotencyKey">Optional idempotency key, at most 256 characters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when ctx or request is null, or tenantId is null or empty.</exception>
        /// <exception cref="ValidationException">Thrown when the report is out of bounds, its agent or app does not exist, or the agent is not a member of the app.</exception>
        public async Task<Report> FileFromPersonAsync(RequestContext ctx, string tenantId, Report request, string? idempotencyKey, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (idempotencyKey != null && idempotencyKey.Length > 256) throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["idempotencyKey"] = "An idempotency key holds at most 256 characters." });
            Report report = request;
            report.Id = String.Empty;
            report.TenantId = tenantId;
            report.AuthorAgentName = null;
            if (!String.IsNullOrEmpty(report.AuthorAgentId))
            {
                Agent agent = await _Database.Agents.ReadAsync(tenantId, report.AuthorAgentId, token).ConfigureAwait(false)
                    ?? throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["authorAgentId"] = "Agent " + report.AuthorAgentId + " does not exist." }, new Dictionary<string, string> { ["authorAgentId"] = "ReferenceNotFound" });
                report.AuthorAgentName = agent.Name;
            }
            report.RunId = null;
            report.MandateId = null;
            report.MandateTickId = null;
            report.OrgUnitId = null;
            report.FiledByPrincipalType = ctx.PrincipalType;
            report.FiledByPrincipalId = ctx.PrincipalId;
            report.FiledByName = ctx.PrincipalName;
            report.FilingKey = String.IsNullOrWhiteSpace(idempotencyKey) ? null : Digest("person|" + ctx.PrincipalType + "|" + ctx.PrincipalId + "|" + idempotencyKey.Trim());
            return await StoreAsync(ctx, report, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Enumerate reports for a person (the caller checked Read on Report).
        /// </summary>
        /// <param name="filter">Filter with the tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page, newest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        public async Task<EnumerationResult<Report>> ListAsync(ReportFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            filter.MaxResults = Math.Clamp(filter.MaxResults, 1, 1000);
            return await _Database.Reports.EnumerateAsync(filter, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Enumerate the reports a run may see: its agent's own and its subordinates'.
        /// </summary>
        /// <param name="run">The viewing run.</param>
        /// <param name="filter">Filter with the tenant; its Visibility is replaced.</param>
        /// <param name="includeOwn">Whether to include the agent's own reports.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page, newest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or filter is null.</exception>
        public async Task<EnumerationResult<Report>> ListForRunAsync(Run run, ReportFilter filter, bool includeOwn, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            filter.TenantId = run.TenantId;
            filter.Visibility = await _Visibility.ScopeForAsync(run.TenantId, run.AgentId, includeOwn, token).ConfigureAwait(false);
            return await ListAsync(filter, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a report a run may see.
        /// </summary>
        /// <param name="run">The viewing run.</param>
        /// <param name="id">Report identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the report does not exist or the run may not see it.</exception>
        public async Task<Report> ReadForRunAsync(Run run, string id, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            Report? report = String.IsNullOrWhiteSpace(id) ? null : await _Database.Reports.ReadAsync(run.TenantId, id.Trim(), token).ConfigureAwait(false);
            if (report == null || !await _Visibility.VisibleToAgentAsync(run.AgentId, report, token).ConfigureAwait(false)) throw new NotFoundException("Report not found.");
            return report;
        }

        /// <summary>
        /// Metric series for a person (the caller checked Read on Report).
        /// </summary>
        /// <param name="filter">Filter with the tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Points, oldest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        public async Task<List<ReportMetricPoint>> MetricSeriesAsync(ReportMetricFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            return await _Database.Reports.MetricSeriesAsync(filter, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Render the reports a keeper's subordinates filed since a time through the report-digest template (AA5.5), or
        /// null when there are none or the digest is turned off (Reports.DigestMaxReports 0). The newest DigestMaxReports
        /// reports are shown, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">The keeper's agent.</param>
        /// <param name="sinceUtc">Only reports filed at or after this time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered text, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or agentId is null or empty.</exception>
        /// <exception cref="Garrison.Core.Templates.TemplateException">Thrown when the template does not render.</exception>
        public async Task<string?> RenderDigestAsync(string tenantId, string agentId, DateTime sinceUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            int max = _Options.DigestMaxReports;
            if (max == 0) return null;
            ReportVisibilityScope scope = await _Visibility.ScopeForAsync(tenantId, agentId, false, token).ConfigureAwait(false);
            if (scope.SubordinateAgentIds.Count == 0) return null;
            ReportFilter filter = new ReportFilter { TenantId = tenantId, Visibility = scope, FromUtc = sinceUtc, MaxResults = max };
            EnumerationResult<Report> page = await _Database.Reports.EnumerateAsync(filter, token).ConfigureAwait(false);
            if (page.Objects.Count == 0) return null;
            List<Report> reports = page.Objects.AsEnumerable().Reverse().ToList();
            PromptTemplate template = await new KeeperTemplateResolver(_Database).ResolveAsync(tenantId, ReportDigestRenderer.TemplateName, PromptTemplateKindEnum.Fragment, token).ConfigureAwait(false);
            string text = ReportDigestRenderer.Render(template.Content, template.Name, reports, page.TotalRecords > reports.Count);
            return String.IsNullOrWhiteSpace(text) ? null : text;
        }

        #endregion

        #region Private-Methods

        private async Task<Report> StoreAsync(RequestContext ctx, Report report, CancellationToken token)
        {
            if (!String.IsNullOrEmpty(report.FilingKey))
            {
                Report? earlier = await _Database.Reports.ReadByFilingKeyAsync(report.TenantId, report.FilingKey, token).ConfigureAwait(false);
                if (earlier != null) return earlier;
            }
            ReportValidator.Validate(report, _Options.MaxBodyBytes);
            report.AppName = null;
            if (!String.IsNullOrEmpty(report.AppId))
            {
                AgenticApp app = await _Database.Apps.ReadAsync(report.TenantId, report.AppId, token).ConfigureAwait(false)
                    ?? throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["appId"] = "App " + report.AppId + " does not exist." }, new Dictionary<string, string> { ["appId"] = "ReferenceNotFound" });
                if (!String.IsNullOrEmpty(report.AuthorAgentId))
                {
                    List<string> apps = await _Database.Apps.AppIdsWithMemberAsync(report.TenantId, report.AuthorAgentId, token).ConfigureAwait(false);
                    if (!apps.Contains(app.Id)) throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["appId"] = "Agent " + (report.AuthorAgentName ?? report.AuthorAgentId) + " is not a member of app " + app.Name + "." }, new Dictionary<string, string> { ["appId"] = "NotAMember" });
                }
                report.AppId = app.Id;
                report.AppName = app.Name;
            }

            using (Activity? span = GarrisonTracing.Start("report file", ActivityKind.Internal))
            {
                span?.SetTag("garrison.report.kind", report.Kind.ToString().ToLowerInvariant());
                try
                {
                    await _Database.Reports.CreateAsync(report, token).ConfigureAwait(false);
                }
                catch (Exception) when (!String.IsNullOrEmpty(report.FilingKey))
                {
                    // Two replays racing: the unique filing key lets one insert win; the other returns it.
                    Report? winner = await _Database.Reports.ReadByFilingKeyAsync(report.TenantId, report.FilingKey!, CancellationToken.None).ConfigureAwait(false);
                    if (winner != null) return winner;
                    throw;
                }
                GarrisonTracing.Ok(span);
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.Reports, "kind", report.Kind.ToString().ToLowerInvariant(), "health", report.Health.ToString().ToLowerInvariant());
            // Titles and bodies are written by agents and never go to the audit log or the server log.
            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Report", report.Id, "Filed report " + report.Id + " (" + report.Kind + ", " + report.Health + ")" + (report.AuthorAgentId != null ? " from agent " + report.AuthorAgentId : String.Empty) + ".", report.TenantId, token).ConfigureAwait(false);
            _Logging.Info(_Header + report.Id + " filed by " + report.FiledByPrincipalType + " " + (report.FiledByPrincipalId ?? "unknown") + ", " + report.Kind + ", " + report.Health + ", " + report.Metrics.Count.ToString(CultureInfo.InvariantCulture) + " metrics");
            return report;
        }

        private static string Canonical(Report report)
        {
            Dictionary<string, object?> map = new Dictionary<string, object?>(StringComparer.Ordinal);
            map["kind"] = report.Kind.ToString();
            map["health"] = report.Health.ToString();
            map["audience"] = report.Audience.ToString();
            map["title"] = report.Title;
            map["body"] = report.Body;
            map["periodStartUtc"] = report.PeriodStartUtc?.ToString("o", CultureInfo.InvariantCulture);
            map["periodEndUtc"] = report.PeriodEndUtc?.ToString("o", CultureInfo.InvariantCulture);
            map["appId"] = report.AppId;
            map["metrics"] = report.Metrics.Select(m => m.Name + "=" + m.Value.ToString("R", CultureInfo.InvariantCulture) + " " + (m.Unit ?? String.Empty)).ToList();
            map["issues"] = report.Issues.Select(i => i.Severity + ":" + i.Text).ToList();
            map["decisions"] = report.Decisions.Select(d => d.Text).ToList();
            return Serializer.Serialize(map);
        }

        private static string Digest(string value)
        {
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        }

        #endregion
    }
}
