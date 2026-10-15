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

    /// <summary>
    /// Provider-neutral notification outbox, delivery log, sweep cursors, and event source queries (P12.14). Queueing uses
    /// ON CONFLICT DO NOTHING against the unique (endpointid, eventkey) index; claims are compare-and-set on status and
    /// claim expiry. Thread-safe.
    /// </summary>
    public class AdoNotificationDeliveryMethods : INotificationDeliveryMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, endpointid, eventname, eventkey, subjecttype, subjectid, status, attempts, maxattempts, nextattemptutc, claimedby, claimuntilutc, laststatuscode, lasterror, lastattemptutc, lastdurationms, deliveredutc, payload, createdutc, lastupdateutc";
        private static readonly string _FinishedRunStatuses = "'Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'";
        private static readonly string _FinishedPipelineStatuses = "'Succeeded', 'Failed', 'Cancelled', 'TimedOut'";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Cursors;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoNotificationDeliveryMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("notification_deliveries");
            _Cursors = driver.Table("notification_cursors");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<bool> TryCreateAsync(NotificationDelivery obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(obj.EventKey)) obj.EventKey = obj.Id;
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            int affected = await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ") ON CONFLICT DO NOTHING;", command => Bind(command, obj), token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<NotificationDelivery?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<NotificationDelivery>> EnumerateAsync(string tenantId, string endpointId, NotificationDeliveryStatusEnum? status, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(endpointId)) throw new ArgumentNullException(nameof(endpointId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid", "endpointid = @endpointid" };
            if (status.HasValue) clauses.Add("status = @status");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "endpointid", endpointId);
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<NotificationDelivery> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<NotificationDelivery>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<NotificationDelivery>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE (status = 'Pending' AND nextattemptutc <= @now) OR (status = 'Delivering' AND claimuntilutc < @now) ORDER BY nextattemptutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> TryClaimAsync(string id, string claimedBy, DateTime nowUtc, DateTime claimUntilUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(claimedBy)) throw new ArgumentNullException(nameof(claimedBy));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Delivering', claimedby = @claimedby, claimuntilutc = @until, lastupdateutc = @now WHERE id = @id AND ((status = 'Pending' AND nextattemptutc <= @now) OR (status = 'Delivering' AND claimuntilutc < @now));",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "claimedby", claimedBy);
                    AdoDatabaseDriver.Add(command, "until", claimUntilUtc);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> CompleteAttemptAsync(NotificationDelivery obj, string claimedBy, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(claimedBy)) throw new ArgumentNullException(nameof(claimedBy));
            obj.LastUpdateUtc = DateTime.UtcNow;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, attempts = @attempts, nextattemptutc = @nextattemptutc, claimedby = NULL, claimuntilutc = NULL, laststatuscode = @laststatuscode, lasterror = @lasterror, lastattemptutc = @lastattemptutc, lastdurationms = @lastdurationms, deliveredutc = @deliveredutc, lastupdateutc = @lastupdateutc WHERE id = @id AND status = 'Delivering' AND claimedby = @claimer;",
                command =>
                {
                    Bind(command, obj);
                    AdoDatabaseDriver.Add(command, "claimer", claimedBy);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE status IN ('Succeeded', 'Failed') AND createdutc < @cutoff;", command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<NotificationCursor?> ReadCursorAsync(string source, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(source)) throw new ArgumentNullException(nameof(source));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Cursors + " WHERE source = @source;", command => AdoDatabaseDriver.Add(command, "source", source), reader => new NotificationCursor
            {
                Source = AdoConverters.Str(reader, "source"),
                CursorUtc = AdoConverters.Date(reader, "cursorutc"),
                CursorId = AdoConverters.NullableStr(reader, "cursorid") ?? String.Empty,
                LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc")
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task WriteCursorAsync(NotificationCursor cursor, CancellationToken token = default)
        {
            if (cursor == null) throw new ArgumentNullException(nameof(cursor));
            cursor.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "INSERT INTO " + _Cursors + " (source, cursorutc, cursorid, lastupdateutc) VALUES (@source, @cursorutc, @cursorid, @lastupdateutc) ON CONFLICT (source) DO UPDATE SET cursorutc = @cursorutc, cursorid = @cursorid, lastupdateutc = @lastupdateutc;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "source", cursor.Source);
                    AdoDatabaseDriver.Add(command, "cursorutc", cursor.CursorUtc);
                    AdoDatabaseDriver.Add(command, "cursorid", cursor.CursorId);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", cursor.LastUpdateUtc);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Run>> ListFinishedRunsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default)
        {
            if (tenantIds == null || tenantIds.Count == 0) return new List<Run>();
            return await KeysetAsync(_Driver.Table("runs"), "completedutc", "status IN (" + _FinishedRunStatuses + ")", tenantIds, afterUtc, afterId, untilUtc, limit, AdoRunMethods.Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<PipelineRun>> ListFinishedPipelineRunsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default)
        {
            if (tenantIds == null || tenantIds.Count == 0) return new List<PipelineRun>();
            return await KeysetAsync(_Driver.Table("pipeline_runs"), "completedutc", "status IN (" + _FinishedPipelineStatuses + ")", tenantIds, afterUtc, afterId, untilUtc, limit, AdoPipelineRunMethods.Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Approval>> ListRequestedApprovalsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default)
        {
            if (tenantIds == null || tenantIds.Count == 0) return new List<Approval>();
            return await KeysetAsync(_Driver.Table("approvals"), "createdutc", null, tenantIds, afterUtc, afterId, untilUtc, limit, AdoApprovalMethods.Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<PipelineReview>> ListRequestedReviewsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default)
        {
            if (tenantIds == null || tenantIds.Count == 0) return new List<PipelineReview>();
            return await KeysetAsync(_Driver.Table("pipeline_reviews"), "createdutc", null, tenantIds, afterUtc, afterId, untilUtc, limit, AdoPipelineReviewMethods.Map, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a delivery row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static NotificationDelivery Map(DbDataReader reader)
        {
            NotificationDelivery obj = new NotificationDelivery();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.EndpointId = AdoConverters.Str(reader, "endpointid");
            obj.Event = AdoConverters.Enum<NotificationEventEnum>(reader, "eventname", NotificationEventEnum.Test);
            obj.EventKey = AdoConverters.Str(reader, "eventkey");
            obj.SubjectType = AdoConverters.Str(reader, "subjecttype");
            obj.SubjectId = AdoConverters.NullableStr(reader, "subjectid");
            obj.Status = AdoConverters.Enum<NotificationDeliveryStatusEnum>(reader, "status", NotificationDeliveryStatusEnum.Pending);
            obj.Attempts = AdoConverters.Int(reader, "attempts");
            obj.MaxAttempts = AdoConverters.Int(reader, "maxattempts");
            obj.NextAttemptUtc = AdoConverters.NullableDate(reader, "nextattemptutc");
            obj.ClaimedBy = AdoConverters.NullableStr(reader, "claimedby");
            obj.ClaimUntilUtc = AdoConverters.NullableDate(reader, "claimuntilutc");
            obj.LastStatusCode = AdoConverters.NullableInt(reader, "laststatuscode");
            obj.LastError = AdoConverters.NullableStr(reader, "lasterror");
            obj.LastAttemptUtc = AdoConverters.NullableDate(reader, "lastattemptutc");
            obj.LastDurationMs = AdoConverters.Long(reader, "lastdurationms");
            obj.DeliveredUtc = AdoConverters.NullableDate(reader, "deliveredutc");
            obj.Payload = AdoConverters.Str(reader, "payload");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, NotificationDelivery obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "endpointid", obj.EndpointId);
            AdoDatabaseDriver.Add(command, "eventname", obj.Event.ToString());
            AdoDatabaseDriver.Add(command, "eventkey", obj.EventKey);
            AdoDatabaseDriver.Add(command, "subjecttype", obj.SubjectType);
            AdoDatabaseDriver.Add(command, "subjectid", obj.SubjectId);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "attempts", obj.Attempts);
            AdoDatabaseDriver.Add(command, "maxattempts", obj.MaxAttempts);
            AdoDatabaseDriver.Add(command, "nextattemptutc", obj.NextAttemptUtc);
            AdoDatabaseDriver.Add(command, "claimedby", obj.ClaimedBy);
            AdoDatabaseDriver.Add(command, "claimuntilutc", obj.ClaimUntilUtc);
            AdoDatabaseDriver.Add(command, "laststatuscode", obj.LastStatusCode);
            AdoDatabaseDriver.Add(command, "lasterror", Truncate(obj.LastError, 2000));
            AdoDatabaseDriver.Add(command, "lastattemptutc", obj.LastAttemptUtc);
            AdoDatabaseDriver.Add(command, "lastdurationms", obj.LastDurationMs);
            AdoDatabaseDriver.Add(command, "deliveredutc", obj.DeliveredUtc);
            AdoDatabaseDriver.Add(command, "payload", obj.Payload);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task<List<T>> KeysetAsync<T>(string table, string column, string? extra, List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, Func<DbDataReader, T> map, CancellationToken token)
        {
            List<string> tenants = tenantIds.Distinct(StringComparer.Ordinal).ToList();
            List<string> names = new List<string>();
            for (int i = 0; i < tenants.Count; i++) names.Add("@t" + i);
            string sql = "SELECT * FROM " + table + " WHERE tenantid IN (" + String.Join(", ", names) + ")"
                + (extra != null ? " AND " + extra : String.Empty)
                + " AND " + column + " IS NOT NULL AND (" + column + " > @after OR (" + column + " = @after AND id > @afterid)) AND " + column + " <= @until"
                + " ORDER BY " + column + " ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            return await _Driver.QueryAsync(sql, command =>
            {
                for (int i = 0; i < tenants.Count; i++) AdoDatabaseDriver.Add(command, "t" + i, tenants[i]);
                AdoDatabaseDriver.Add(command, "after", afterUtc);
                AdoDatabaseDriver.Add(command, "afterid", afterId ?? String.Empty);
                AdoDatabaseDriver.Add(command, "until", untilUtc);
                AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, map, token).ConfigureAwait(false);
        }

        private static string? Truncate(string? value, int max)
        {
            if (value == null || value.Length <= max) return value;
            return value.Substring(0, max);
        }

        #endregion
    }
}
