namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Provider-neutral report data access (AA5). Insert-only. Thread-safe.
    /// </summary>
    public class AdoReportMethods : IReportMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, authoragentid, authoragentname, runid, mandateid, mandatetickid, orgunitid, appid, appname, audience, kind, health, title, body, periodstartutc, periodendutc, filedbyprincipaltype, filedbyprincipalid, filedbyname, filingkey, createdutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Metrics;
        private readonly string _Issues;
        private readonly string _Decisions;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoReportMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("reports");
            _Metrics = driver.Table("report_metrics");
            _Issues = driver.Table("report_issues");
            _Decisions = driver.Table("report_decisions");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Report> CreateAsync(Report obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            DateTime pointUtc = obj.PeriodEndUtc ?? obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                for (int i = 0; i < obj.Metrics.Count; i++)
                {
                    ReportMetric metric = obj.Metrics[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Metrics + " (reportid, tenantid, position, authoragentid, metricname, metricvalue, unit, pointutc, createdutc) VALUES (@reportid, @tenantid, @position, @authoragentid, @metricname, @metricvalue, @unit, @pointutc, @createdutc);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "reportid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "authoragentid", obj.AuthorAgentId);
                        AdoDatabaseDriver.Add(command, "metricname", metric.Name);
                        AdoDatabaseDriver.Add(command, "metricvalue", metric.Value);
                        AdoDatabaseDriver.Add(command, "unit", metric.Unit);
                        AdoDatabaseDriver.Add(command, "pointutc", pointUtc);
                        AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
                    }, ct).ConfigureAwait(false);
                }
                for (int i = 0; i < obj.Issues.Count; i++)
                {
                    ReportIssue issue = obj.Issues[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Issues + " (reportid, tenantid, position, severity, issuetext) VALUES (@reportid, @tenantid, @position, @severity, @issuetext);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "reportid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "severity", issue.Severity.ToString());
                        AdoDatabaseDriver.Add(command, "issuetext", issue.Text);
                    }, ct).ConfigureAwait(false);
                }
                for (int i = 0; i < obj.Decisions.Count; i++)
                {
                    ReportDecision decision = obj.Decisions[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Decisions + " (reportid, tenantid, position, decisiontext) VALUES (@reportid, @tenantid, @position, @decisiontext);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "reportid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "decisiontext", decision.Text);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Report?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Report? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<Report> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Report?> ReadByFilingKeyAsync(string tenantId, string filingKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(filingKey)) throw new ArgumentNullException(nameof(filingKey));
            Report? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND filingkey = @filingkey;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "filingkey", filingKey);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<Report> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Report>> EnumerateAsync(ReportFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            EnumerationQuery query = new EnumerationQuery { MaxResults = filter.MaxResults, Skip = Math.Max(0, filter.Skip) };
            if (filter.AuthorAgentIds != null && filter.AuthorAgentIds.Count == 0) return EnumerationResult<Report>.Build(query, 0, new List<Report>());
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(filter.AuthorAgentId)) clauses.Add("authoragentid = @authoragentid");
            if (filter.AuthorAgentIds != null)
            {
                List<string> names = new List<string>();
                for (int i = 0; i < filter.AuthorAgentIds.Count; i++) names.Add("@a" + i);
                clauses.Add("authoragentid IN (" + String.Join(", ", names) + ")");
            }
            if (!String.IsNullOrEmpty(filter.OrgUnitId)) clauses.Add("orgunitid = @orgunitid");
            if (!String.IsNullOrEmpty(filter.AppId)) clauses.Add("appid = @appid");
            if (filter.Visibility != null) clauses.Add(VisibilityClause(filter.Visibility));
            if (filter.Kind.HasValue) clauses.Add("kind = @kind");
            if (filter.Health.HasValue) clauses.Add("health = @health");
            if (!String.IsNullOrEmpty(filter.RunId)) clauses.Add("runid = @runid");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            if (!String.IsNullOrEmpty(filter.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("title", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (!String.IsNullOrEmpty(filter.AuthorAgentId)) AdoDatabaseDriver.Add(command, "authoragentid", filter.AuthorAgentId);
                if (filter.AuthorAgentIds != null)
                {
                    for (int i = 0; i < filter.AuthorAgentIds.Count; i++) AdoDatabaseDriver.Add(command, "a" + i, filter.AuthorAgentIds[i]);
                }
                if (!String.IsNullOrEmpty(filter.OrgUnitId)) AdoDatabaseDriver.Add(command, "orgunitid", filter.OrgUnitId);
                if (!String.IsNullOrEmpty(filter.AppId)) AdoDatabaseDriver.Add(command, "appid", filter.AppId);
                if (filter.Visibility != null) BindVisibility(command, filter.Visibility);
                if (filter.Kind.HasValue) AdoDatabaseDriver.Add(command, "kind", filter.Kind.Value.ToString());
                if (filter.Health.HasValue) AdoDatabaseDriver.Add(command, "health", filter.Health.Value.ToString());
                if (!String.IsNullOrEmpty(filter.RunId)) AdoDatabaseDriver.Add(command, "runid", filter.RunId);
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
                if (!String.IsNullOrEmpty(filter.Search)) AdoDatabaseDriver.Add(command, "search", "%" + filter.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Report> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<Report>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<ReportMetricPoint>> MetricSeriesAsync(ReportMetricFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            List<string> clauses = new List<string> { "m.tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(filter.AuthorAgentId)) clauses.Add("m.authoragentid = @authoragentid");
            if (!String.IsNullOrEmpty(filter.Name)) clauses.Add("m.metricname = @metricname");
            if (filter.FromUtc.HasValue) clauses.Add("m.createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("m.createdutc < @toutc");
            List<ReportMetricPoint> points = await _Driver.QueryAsync(
                "SELECT m.reportid, m.authoragentid, r.authoragentname, m.metricname, m.metricvalue, m.unit, m.pointutc FROM " + _Metrics + " m JOIN " + _Table + " r ON r.id = m.reportid AND r.tenantid = m.tenantid WHERE " + String.Join(" AND ", clauses) +
                " ORDER BY m.pointutc DESC, m.reportid DESC, m.position DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                    if (!String.IsNullOrEmpty(filter.AuthorAgentId)) AdoDatabaseDriver.Add(command, "authoragentid", filter.AuthorAgentId);
                    if (!String.IsNullOrEmpty(filter.Name)) AdoDatabaseDriver.Add(command, "metricname", filter.Name);
                    if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                    if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
                    AdoDatabaseDriver.Add(command, "max", filter.MaxPoints);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                },
                reader => new ReportMetricPoint
                {
                    ReportId = AdoConverters.Str(reader, "reportid"),
                    AuthorAgentId = AdoConverters.NullableStr(reader, "authoragentid"),
                    AuthorAgentName = AdoConverters.NullableStr(reader, "authoragentname"),
                    Name = AdoConverters.Str(reader, "metricname"),
                    Value = AdoConverters.Double(reader, "metricvalue"),
                    Unit = AdoConverters.NullableStr(reader, "unit"),
                    TimestampUtc = AdoConverters.Date(reader, "pointutc")
                }, token).ConfigureAwait(false);
            points.Reverse();
            return points;
        }

        /// <inheritdoc />
        public async Task<List<Report>> ListFiledAfterAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<Report> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND (createdutc > @after OR (createdutc = @after AND id > @afterid)) ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "after", afterUtc);
                    AdoDatabaseDriver.Add(command, "afterid", afterId ?? String.Empty);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <summary>
        /// Map a report row (without children).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The report.</returns>
        public static Report Map(DbDataReader reader)
        {
            Report obj = new Report();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AuthorAgentId = AdoConverters.NullableStr(reader, "authoragentid");
            obj.AuthorAgentName = AdoConverters.NullableStr(reader, "authoragentname");
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.MandateId = AdoConverters.NullableStr(reader, "mandateid");
            obj.MandateTickId = AdoConverters.NullableStr(reader, "mandatetickid");
            obj.OrgUnitId = AdoConverters.NullableStr(reader, "orgunitid");
            obj.AppId = AdoConverters.NullableStr(reader, "appid");
            obj.AppName = AdoConverters.NullableStr(reader, "appname");
            obj.Audience = AdoConverters.Enum<ReportAudienceEnum>(reader, "audience", ReportAudienceEnum.Manager);
            obj.Kind = AdoConverters.Enum<ReportKindEnum>(reader, "kind", ReportKindEnum.Status);
            obj.Health = AdoConverters.Enum<ReportHealthEnum>(reader, "health", ReportHealthEnum.Unknown);
            obj.Title = AdoConverters.Str(reader, "title");
            obj.Body = AdoConverters.NullableStr(reader, "body") ?? String.Empty;
            obj.PeriodStartUtc = AdoConverters.NullableDate(reader, "periodstartutc");
            obj.PeriodEndUtc = AdoConverters.NullableDate(reader, "periodendutc");
            obj.FiledByPrincipalType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "filedbyprincipaltype", PrincipalTypeEnum.Run);
            obj.FiledByPrincipalId = AdoConverters.NullableStr(reader, "filedbyprincipalid");
            obj.FiledByName = AdoConverters.NullableStr(reader, "filedbyname");
            obj.FilingKey = AdoConverters.NullableStr(reader, "filingkey");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Report obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "authoragentid", obj.AuthorAgentId);
            AdoDatabaseDriver.Add(command, "authoragentname", obj.AuthorAgentName);
            AdoDatabaseDriver.Add(command, "runid", obj.RunId);
            AdoDatabaseDriver.Add(command, "mandateid", obj.MandateId);
            AdoDatabaseDriver.Add(command, "mandatetickid", obj.MandateTickId);
            AdoDatabaseDriver.Add(command, "orgunitid", obj.OrgUnitId);
            AdoDatabaseDriver.Add(command, "appid", obj.AppId);
            AdoDatabaseDriver.Add(command, "appname", obj.AppName);
            AdoDatabaseDriver.Add(command, "audience", obj.Audience.ToString());
            AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
            AdoDatabaseDriver.Add(command, "health", obj.Health.ToString());
            AdoDatabaseDriver.Add(command, "title", obj.Title);
            AdoDatabaseDriver.Add(command, "body", obj.Body);
            AdoDatabaseDriver.Add(command, "periodstartutc", obj.PeriodStartUtc);
            AdoDatabaseDriver.Add(command, "periodendutc", obj.PeriodEndUtc);
            AdoDatabaseDriver.Add(command, "filedbyprincipaltype", obj.FiledByPrincipalType.ToString());
            AdoDatabaseDriver.Add(command, "filedbyprincipalid", obj.FiledByPrincipalId);
            AdoDatabaseDriver.Add(command, "filedbyname", obj.FiledByName);
            AdoDatabaseDriver.Add(command, "filingkey", obj.FilingKey);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
        }

        private static string VisibilityClause(ReportVisibilityScope scope)
        {
            // Own reports, plus subordinates' reports filed without an app or within an app the viewer manages.
            string clause = "authoragentid = @vown";
            if (scope.SubordinateAgentIds.Count > 0)
            {
                List<string> subs = new List<string>();
                for (int i = 0; i < scope.SubordinateAgentIds.Count; i++) subs.Add("@vs" + i);
                List<string> apps = new List<string>();
                for (int i = 0; i < scope.ManagedAppIds.Count; i++) apps.Add("@vp" + i);
                string app = apps.Count == 0 ? "appid IS NULL" : "(appid IS NULL OR appid IN (" + String.Join(", ", apps) + "))";
                string others = "(authoragentid IN (" + String.Join(", ", subs) + ") AND " + app + ")";
                clause = scope.IncludeOwn ? "(" + clause + " OR " + others + ")" : others;
            }
            else if (!scope.IncludeOwn)
            {
                clause = "1 = 0";
            }
            return clause;
        }

        private static void BindVisibility(DbCommand command, ReportVisibilityScope scope)
        {
            AdoDatabaseDriver.Add(command, "vown", scope.AgentId);
            for (int i = 0; i < scope.SubordinateAgentIds.Count; i++) AdoDatabaseDriver.Add(command, "vs" + i, scope.SubordinateAgentIds[i]);
            for (int i = 0; i < scope.ManagedAppIds.Count; i++) AdoDatabaseDriver.Add(command, "vp" + i, scope.ManagedAppIds[i]);
        }

        private async Task LoadChildrenAsync(List<Report> reports, CancellationToken token)
        {
            if (reports.Count == 0) return;
            Dictionary<string, Report> byId = reports.ToDictionary(r => r.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < reports.Count; i++) names.Add("@r" + i);
            string inList = String.Join(", ", names);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", reports[0].TenantId);
                for (int i = 0; i < reports.Count; i++) AdoDatabaseDriver.Add(command, "r" + i, reports[i].Id);
            };
            await _Driver.QueryAsync("SELECT reportid, metricname, metricvalue, unit FROM " + _Metrics + " WHERE tenantid = @tenantid AND reportid IN (" + inList + ") ORDER BY reportid, position;", bind, reader =>
            {
                if (byId.TryGetValue(AdoConverters.Str(reader, "reportid"), out Report? report))
                    report.Metrics.Add(new ReportMetric { Name = AdoConverters.Str(reader, "metricname"), Value = AdoConverters.Double(reader, "metricvalue"), Unit = AdoConverters.NullableStr(reader, "unit") });
                return true;
            }, token).ConfigureAwait(false);
            await _Driver.QueryAsync("SELECT reportid, severity, issuetext FROM " + _Issues + " WHERE tenantid = @tenantid AND reportid IN (" + inList + ") ORDER BY reportid, position;", bind, reader =>
            {
                if (byId.TryGetValue(AdoConverters.Str(reader, "reportid"), out Report? report))
                    report.Issues.Add(new ReportIssue { Severity = AdoConverters.Enum<ReportIssueSeverityEnum>(reader, "severity", ReportIssueSeverityEnum.Medium), Text = AdoConverters.Str(reader, "issuetext") });
                return true;
            }, token).ConfigureAwait(false);
            await _Driver.QueryAsync("SELECT reportid, decisiontext FROM " + _Decisions + " WHERE tenantid = @tenantid AND reportid IN (" + inList + ") ORDER BY reportid, position;", bind, reader =>
            {
                if (byId.TryGetValue(AdoConverters.Str(reader, "reportid"), out Report? report))
                    report.Decisions.Add(new ReportDecision { Text = AdoConverters.Str(reader, "decisiontext") });
                return true;
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
