namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral mandate data access (AA1). Thread-safe.
    /// </summary>
    public class AdoMandateMethods : IMandateMethods
    {
        #region Private-Members

        private static readonly HashSet<string> _ReferenceColumns = new HashSet<string>(StringComparer.Ordinal) { "agentid", "deploymentid" };
        private static readonly string _Columns = "id, tenantid, name, description, agentid, deploymentid, status, currentrevisionid, currentrevisionnumber, nextwakeutc, pendingwakesource, currentintervalseconds, consecutivequietticks, lasttickutc, lasttickoutcome, activerunid, activetickid, tickcount, runastype, runasid, runasname, createdby, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Revisions;
        private readonly string _Signals;
        private readonly string _Ticks;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMandateMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mandates");
            _Revisions = driver.Table("mandate_revisions");
            _Signals = driver.Table("mandate_revision_signals");
            _Ticks = driver.Table("mandate_ticks");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Mandate> CreateAsync(Mandate obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Mandate?> ReadAsync(string tenantId, string id, CancellationToken token = default)
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
        public async Task<Mandate?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Mandate> UpdateAsync(Mandate obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET name = @name, description = @description, deploymentid = @deploymentid, runastype = @runastype, runasid = @runasid, runasname = @runasname, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Mandate> UpdateScheduleAsync(Mandate obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, currentrevisionid = @currentrevisionid, currentrevisionnumber = @currentrevisionnumber, nextwakeutc = @nextwakeutc, pendingwakesource = @pendingwakesource, currentintervalseconds = @currentintervalseconds, consecutivequietticks = @consecutivequietticks, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Signals + " WHERE tenantid = @tenantid AND revisionid IN (SELECT id FROM " + _Revisions + " WHERE mandateid = @id AND tenantid = @tenantid);", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Revisions + " WHERE mandateid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Ticks + " WHERE mandateid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Mandate>> EnumerateAsync(string tenantId, MandateStatusEnum? status, string? agentId, string? deploymentId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (status.HasValue) clauses.Add("status = @status");
            if (!String.IsNullOrEmpty(agentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(deploymentId)) clauses.Add("deploymentid = @deploymentid");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
                if (!String.IsNullOrEmpty(agentId)) AdoDatabaseDriver.Add(command, "agentid", agentId);
                if (!String.IsNullOrEmpty(deploymentId)) AdoDatabaseDriver.Add(command, "deploymentid", deploymentId);
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Mandate> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<Mandate>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<Mandate>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Active' AND nextwakeutc IS NOT NULL AND nextwakeutc <= @now ORDER BY nextwakeutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Mandate>> ListWithActiveTickAsync(int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE activetickid IS NOT NULL ORDER BY lastupdateutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> TryClaimAsync(string id, DateTime expectedNextWakeUtc, string tickId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET activetickid = @tick, activerunid = NULL, nextwakeutc = NULL, pendingwakesource = NULL, tickcount = tickcount + 1, lastupdateutc = @now WHERE id = @id AND status = 'Active' AND activetickid IS NULL AND nextwakeutc = @expected;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tick", tickId);
                    AdoDatabaseDriver.Add(command, "expected", expectedNextWakeUtc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> TrySetStatusAsync(string tenantId, string id, MandateStatusEnum expected, MandateStatusEnum status, DateTime? nextWakeUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, nextwakeutc = @next, pendingwakesource = NULL, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND status = @expected;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "status", status.ToString());
                    AdoDatabaseDriver.Add(command, "expected", expected.ToString());
                    AdoDatabaseDriver.Add(command, "next", nextWakeUtc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> ReactivateCapsAsync(DateTime nowUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Active', lastupdateutc = @now WHERE status = 'CapReached' AND nextwakeutc IS NOT NULL AND nextwakeutc <= @due;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "due", nowUtc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> TryDeferAsync(string id, DateTime expectedNextWakeUtc, DateTime nextWakeUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET nextwakeutc = @next, pendingwakesource = NULL, lastupdateutc = @now WHERE id = @id AND nextwakeutc = @expected;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "next", nextWakeUtc);
                    AdoDatabaseDriver.Add(command, "expected", expectedNextWakeUtc);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> SetActiveRunAsync(string id, string tickId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET activerunid = @run WHERE id = @id AND activetickid = @tick;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tick", tickId);
                    AdoDatabaseDriver.Add(command, "run", runId);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> TryFinishTickAsync(Mandate obj, string tickId, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            obj.LastUpdateUtc = DateTime.UtcNow;
            // A wake requested while the tick ran (nextwakeutc set during the tick) wins when it is earlier. With no next
            // wake of its own (the mandate stopped scheduling), only a requested wake remains.
            string schedule = obj.NextWakeUtc.HasValue
                ? "pendingwakesource = CASE WHEN nextwakeutc IS NOT NULL AND nextwakeutc < @nextwakeutc THEN pendingwakesource ELSE NULL END, " +
                  "nextwakeutc = CASE WHEN nextwakeutc IS NOT NULL AND nextwakeutc < @nextwakeutc THEN nextwakeutc ELSE @nextwakeutc END, "
                : String.Empty;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET activetickid = NULL, activerunid = NULL, " + schedule +
                "currentintervalseconds = @currentintervalseconds, consecutivequietticks = @consecutivequietticks, lasttickutc = @lasttickutc, lasttickoutcome = @lasttickoutcome, lastupdateutc = @lastupdateutc " +
                "WHERE id = @id AND activetickid = @tick;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tick", tickId);
                    if (obj.NextWakeUtc.HasValue) AdoDatabaseDriver.Add(command, "nextwakeutc", obj.NextWakeUtc.Value);
                    AdoDatabaseDriver.Add(command, "currentintervalseconds", obj.CurrentIntervalSeconds);
                    AdoDatabaseDriver.Add(command, "consecutivequietticks", obj.ConsecutiveQuietTicks);
                    AdoDatabaseDriver.Add(command, "lasttickutc", obj.LastTickUtc);
                    AdoDatabaseDriver.Add(command, "lasttickoutcome", obj.LastTickOutcome?.ToString());
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> RequestWakeAsync(string tenantId, string id, WakeSourceEnum source, DateTime wakeUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET " +
                "pendingwakesource = CASE WHEN nextwakeutc IS NULL OR nextwakeutc > @wake THEN @source ELSE pendingwakesource END, " +
                "nextwakeutc = CASE WHEN nextwakeutc IS NULL OR nextwakeutc > @wake THEN @wake ELSE nextwakeutc END, " +
                "lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND status = 'Active';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "wake", wakeUtc);
                    AdoDatabaseDriver.Add(command, "source", source.ToString());
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(resourceId)) throw new ArgumentNullException(nameof(resourceId));
            if (column == null || !_ReferenceColumns.Contains(column)) throw new ArgumentException("Column must be agentid or deploymentid.", nameof(column));
            return await _Driver.QueryAsync(
                "SELECT name FROM " + _Table + " WHERE tenantid = @tenantid AND " + column + " = @value ORDER BY name;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "value", resourceId);
                },
                reader => AdoConverters.Str(reader, "name"),
                token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a mandate row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Mandate Map(DbDataReader reader)
        {
            Mandate obj = new Mandate();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.DeploymentId = AdoConverters.Str(reader, "deploymentid");
            obj.Status = AdoConverters.Enum<MandateStatusEnum>(reader, "status", MandateStatusEnum.Draft);
            obj.CurrentRevisionId = AdoConverters.NullableStr(reader, "currentrevisionid");
            obj.CurrentRevisionNumber = AdoConverters.Int(reader, "currentrevisionnumber");
            obj.NextWakeUtc = AdoConverters.NullableDate(reader, "nextwakeutc");
            obj.PendingWakeSource = AdoConverters.NullableEnum<WakeSourceEnum>(reader, "pendingwakesource");
            obj.CurrentIntervalSeconds = AdoConverters.Int(reader, "currentintervalseconds");
            obj.ConsecutiveQuietTicks = AdoConverters.Int(reader, "consecutivequietticks");
            obj.LastTickUtc = AdoConverters.NullableDate(reader, "lasttickutc");
            obj.LastTickOutcome = AdoConverters.NullableEnum<TickOutcomeEnum>(reader, "lasttickoutcome");
            obj.ActiveRunId = AdoConverters.NullableStr(reader, "activerunid");
            obj.ActiveTickId = AdoConverters.NullableStr(reader, "activetickid");
            obj.TickCount = AdoConverters.Long(reader, "tickcount");
            obj.RunAsType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "runastype", PrincipalTypeEnum.User);
            obj.RunAsId = AdoConverters.NullableStr(reader, "runasid");
            obj.RunAsName = AdoConverters.NullableStr(reader, "runasname");
            obj.CreatedBy = AdoConverters.NullableStr(reader, "createdby");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Mandate obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "deploymentid", obj.DeploymentId);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "currentrevisionid", obj.CurrentRevisionId);
            AdoDatabaseDriver.Add(command, "currentrevisionnumber", obj.CurrentRevisionNumber);
            AdoDatabaseDriver.Add(command, "nextwakeutc", obj.NextWakeUtc);
            AdoDatabaseDriver.Add(command, "pendingwakesource", obj.PendingWakeSource?.ToString());
            AdoDatabaseDriver.Add(command, "currentintervalseconds", obj.CurrentIntervalSeconds);
            AdoDatabaseDriver.Add(command, "consecutivequietticks", obj.ConsecutiveQuietTicks);
            AdoDatabaseDriver.Add(command, "lasttickutc", obj.LastTickUtc);
            AdoDatabaseDriver.Add(command, "lasttickoutcome", obj.LastTickOutcome?.ToString());
            AdoDatabaseDriver.Add(command, "activerunid", obj.ActiveRunId);
            AdoDatabaseDriver.Add(command, "activetickid", obj.ActiveTickId);
            AdoDatabaseDriver.Add(command, "tickcount", obj.TickCount);
            AdoDatabaseDriver.Add(command, "runastype", obj.RunAsType.ToString());
            AdoDatabaseDriver.Add(command, "runasid", obj.RunAsId);
            AdoDatabaseDriver.Add(command, "runasname", obj.RunAsName);
            AdoDatabaseDriver.Add(command, "createdby", obj.CreatedBy);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
