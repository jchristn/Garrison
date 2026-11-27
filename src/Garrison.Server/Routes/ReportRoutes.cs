namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Report routes (AA5.6): list and read reports, a metric series, and filing by people and API credentials. Runs file
    /// and read reports through the MCP tools and their visibility rules, not through these routes. Every route filters by
    /// the request's tenant; another tenant's report answers 404. Reports are immutable, so there is no update or delete.
    /// </summary>
    public class ReportRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ReportService _Reports;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/reports";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="reports">Report service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ReportRoutes(ServerContext server, ReportService reports)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Reports = reports ?? throw new ArgumentNullException(nameof(reports));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Reports";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Report, OperationTypeEnum.Read, ListAsync, "List reports, newest first (query: author, unit, app, kind, health, runId, from, to, search, maxResults, skip)", tag, null, typeof(EnumerationResult<Report>), "id", null, new RouteScopeOptions().Query("author", ResourceTypeEnum.Agent).Query("unit", ResourceTypeEnum.Organization).Query("runId", ResourceTypeEnum.Run).FilteredByOrganization());
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Report, OperationTypeEnum.Create, FileAsync, "File a report in your own name or an agent's. Reports are immutable; idempotencyKey makes a retried filing return the first report", tag, typeof(ReportFileRequest), typeof(Report));
            routes.Scoped(HttpMethod.GET, _Base + "/metrics", ResourceTypeEnum.Report, OperationTypeEnum.Read, MetricsAsync, "Metric series from reports, oldest first (query: author, name, from, to, maxPoints 1 to 5000, default 500)", tag, null, typeof(List<ReportMetricPoint>), "id", null, new RouteScopeOptions().Query("author", ResourceTypeEnum.Agent));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Report, OperationTypeEnum.Read, ReadAsync, "Read a report with its metrics, issues, and decisions", tag, null, typeof(Report));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            string tenantId = RouteHelpers.Tenant(http);
            ReportFilter filter = new ReportFilter();
            filter.TenantId = tenantId;
            string? author = RouteHelpers.Query(http, "author");
            if (!String.IsNullOrWhiteSpace(author)) filter.AuthorAgentId = await AgentIdAsync(_Server.Database, tenantId, author, http.Token).ConfigureAwait(false) ?? author.Trim();
            filter.OrgUnitId = RouteHelpers.Query(http, "unit");
            string? app = RouteHelpers.Query(http, "app");
            if (!String.IsNullOrWhiteSpace(app)) filter.AppId = await AppIdAsync(_Server.Database, tenantId, app, http.Token).ConfigureAwait(false) ?? app.Trim();
            filter.Kind = RouteHelpers.QueryEnum<ReportKindEnum>(http, "kind");
            filter.Health = RouteHelpers.QueryEnum<ReportHealthEnum>(http, "health");
            filter.RunId = RouteHelpers.Query(http, "runId");
            filter.FromUtc = RouteHelpers.QueryDate(http, "from");
            filter.ToUtc = RouteHelpers.QueryDate(http, "to");
            filter.Search = query.Search;
            filter.MaxResults = query.MaxResults;
            filter.Skip = query.Skip;
            OrganizationMembers? members = await RouteHelpers.ScopedMembersAsync(_Server, http).ConfigureAwait(false);
            if (members != null) filter.AuthorAgentIds = members.AgentIds.ToList();
            EnumerationResult<Report> page = await _Reports.ListAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task FileAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ReportFileRequest request = RouteHelpers.RequiredBody<ReportFileRequest>(http);
            Report report = await ToReportAsync(_Server.Database, tenantId, request, http.Token).ConfigureAwait(false);
            Report filed = await _Reports.FileFromPersonAsync(RouteHelpers.Context(http), tenantId, report, request.IdempotencyKey, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, filed).ConfigureAwait(false);
        }

        private async Task MetricsAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ReportMetricFilter filter = new ReportMetricFilter();
            filter.TenantId = tenantId;
            string? author = RouteHelpers.Query(http, "author");
            if (!String.IsNullOrWhiteSpace(author)) filter.AuthorAgentId = await AgentIdAsync(_Server.Database, tenantId, author, http.Token).ConfigureAwait(false) ?? author.Trim();
            filter.Name = RouteHelpers.Query(http, "name");
            filter.FromUtc = RouteHelpers.QueryDate(http, "from");
            filter.ToUtc = RouteHelpers.QueryDate(http, "to");
            int? max = RouteHelpers.QueryInt(http, "maxPoints");
            if (max.HasValue) filter.MaxPoints = max.Value;
            List<ReportMetricPoint> points = await _Reports.MetricSeriesAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, points).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Report? report = String.IsNullOrEmpty(id) ? null : await _Server.Database.Reports.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (report == null) throw new NotFoundException("Report " + id + " not found.");
            await RouteHelpers.JsonAsync(http, 200, report).ConfigureAwait(false);
        }

        /// <summary>
        /// Build a report from a person's filing request, resolving the agent and app by identifier or name.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Report to file.</returns>
        /// <exception cref="ValidationException">Thrown when a field is invalid or the agent or app does not exist.</exception>
        internal static async Task<Report> ToReportAsync(DatabaseDriverBase database, string tenantId, ReportFileRequest request, CancellationToken token)
        {
            Report report = new Report();
            try
            {
                if (String.IsNullOrWhiteSpace(request.Title)) throw new ArgumentException("A report title holds 1 to 256 characters.", "title");
                report.Title = request.Title;
                report.Body = request.Body ?? String.Empty;
            }
            catch (ArgumentException e)
            {
                throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["title"] = e.Message });
            }
            report.Audience = request.Audience ?? ReportAudienceEnum.Manager;
            report.Kind = request.Kind ?? ReportKindEnum.Status;
            report.Health = request.Health ?? ReportHealthEnum.Unknown;
            report.PeriodStartUtc = request.PeriodStartUtc;
            report.PeriodEndUtc = request.PeriodEndUtc;
            report.Metrics = request.Metrics ?? new List<ReportMetric>();
            report.Issues = request.Issues ?? new List<ReportIssue>();
            report.Decisions = request.Decisions ?? new List<ReportDecision>();
            if (!String.IsNullOrWhiteSpace(request.Agent))
            {
                report.AuthorAgentId = await AgentIdAsync(database, tenantId, request.Agent, token).ConfigureAwait(false)
                    ?? throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["agent"] = "Agent " + request.Agent.Trim() + " does not exist." }, new Dictionary<string, string> { ["agent"] = "ReferenceNotFound" });
            }
            if (!String.IsNullOrWhiteSpace(request.App))
            {
                report.AppId = await AppIdAsync(database, tenantId, request.App, token).ConfigureAwait(false)
                    ?? throw new ValidationException("The report is invalid.", new Dictionary<string, string> { ["app"] = "App " + request.App.Trim() + " does not exist." }, new Dictionary<string, string> { ["app"] = "ReferenceNotFound" });
            }
            return report;
        }

        /// <summary>
        /// Resolve an agent by identifier or name.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent identifier, or null when no agent matches.</returns>
        internal static async Task<string?> AgentIdAsync(DatabaseDriverBase database, string tenantId, string idOrName, CancellationToken token)
        {
            string value = idOrName.Trim();
            Agent? agent = await database.Agents.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await database.Agents.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
            return agent?.Id;
        }

        /// <summary>
        /// Resolve an app by identifier or name.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="idOrName">Identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>App identifier, or null when no app matches.</returns>
        internal static async Task<string?> AppIdAsync(DatabaseDriverBase database, string tenantId, string idOrName, CancellationToken token)
        {
            string value = idOrName.Trim();
            AgenticApp? app = await database.Apps.ReadAsync(tenantId, value, token).ConfigureAwait(false)
                ?? await database.Apps.ReadByNameAsync(tenantId, value, token).ConfigureAwait(false);
            return app?.Id;
        }

        #endregion
    }
}
