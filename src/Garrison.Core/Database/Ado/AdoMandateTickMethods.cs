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
    /// Provider-neutral keeper tick data access (AA1). Thread-safe.
    /// </summary>
    public class AdoMandateTickMethods : IMandateTickMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, mandateid, revisionid, revisionnumber, wakesource, scheduledutc, startedutc, finishedutc, runid, outcome, reported, requestednextwakeseconds, appliedintervalseconds, costusd, summary, templatename, templateversion, errorcode, errormessage, createdutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMandateTickMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("mandate_ticks");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<MandateTick> CreateAsync(MandateTick obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<MandateTick?> ReadAsync(string tenantId, string id, CancellationToken token = default)
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
        public async Task<MandateTick> UpdateAsync(MandateTick obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET runid = @runid, finishedutc = @finishedutc, outcome = @outcome, appliedintervalseconds = @appliedintervalseconds, costusd = @costusd, templatename = @templatename, templateversion = @templateversion, errorcode = @errorcode, errormessage = @errormessage WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> TryReportAsync(string tenantId, string id, TickOutcomeEnum outcome, string? summary, int? requestedNextWakeSeconds, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET reported = " + _Driver.Dialect.BooleanLiteral(true) + ", outcome = @outcome, summary = @summary, requestednextwakeseconds = @requested WHERE id = @id AND tenantid = @tenantid AND reported = " + _Driver.Dialect.BooleanLiteral(false) + " AND finishedutc IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "outcome", outcome.ToString());
                    AdoDatabaseDriver.Add(command, "summary", summary);
                    AdoDatabaseDriver.Add(command, "requested", requestedNextWakeSeconds);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<MandateTick>> EnumerateAsync(string tenantId, string mandateId, TickOutcomeEnum? outcome, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            string where = " WHERE tenantid = @tenantid AND mandateid = @mandateid" + (outcome.HasValue ? " AND outcome = @outcome" : String.Empty);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "mandateid", mandateId);
                if (outcome.HasValue) AdoDatabaseDriver.Add(command, "outcome", outcome.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            string order = query.Ordering == EnumerationOrderEnum.CreatedAscending ? " ORDER BY startedutc ASC, id ASC" : " ORDER BY startedutc DESC, id DESC";
            List<MandateTick> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + order + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<MandateTick>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<MandateTick>> ListRecentAsync(string tenantId, string mandateId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND mandateid = @mandateid AND finishedutc IS NOT NULL ORDER BY startedutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "mandateid", mandateId);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE createdutc < @cutoff AND finishedutc IS NOT NULL;", command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a tick row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static MandateTick Map(DbDataReader reader)
        {
            MandateTick obj = new MandateTick();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.MandateId = AdoConverters.Str(reader, "mandateid");
            obj.RevisionId = AdoConverters.NullableStr(reader, "revisionid");
            obj.RevisionNumber = AdoConverters.Int(reader, "revisionnumber");
            obj.WakeSource = AdoConverters.Enum<WakeSourceEnum>(reader, "wakesource", WakeSourceEnum.Timer);
            obj.ScheduledUtc = AdoConverters.Date(reader, "scheduledutc");
            obj.StartedUtc = AdoConverters.Date(reader, "startedutc");
            obj.FinishedUtc = AdoConverters.NullableDate(reader, "finishedutc");
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.Outcome = AdoConverters.NullableEnum<TickOutcomeEnum>(reader, "outcome");
            obj.Reported = AdoConverters.Bool(reader, "reported");
            obj.RequestedNextWakeSeconds = AdoConverters.NullableInt(reader, "requestednextwakeseconds");
            obj.AppliedIntervalSeconds = AdoConverters.NullableInt(reader, "appliedintervalseconds");
            obj.CostUsd = AdoConverters.NullableDouble(reader, "costusd");
            obj.Summary = AdoConverters.NullableStr(reader, "summary");
            obj.TemplateName = AdoConverters.NullableStr(reader, "templatename");
            obj.TemplateVersion = AdoConverters.Int(reader, "templateversion");
            obj.ErrorCode = AdoConverters.NullableStr(reader, "errorcode");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        /// <inheritdoc />
        public async Task<List<MandateTick>> ListByIdsAsync(string tenantId, List<string> ids, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<MandateTick> rows = await AdoIdSetQuery.QueryAsync(_Driver, tenantId, ids, names => "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND id IN (" + names + ") ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", Map, 100000, token).ConfigureAwait(false);
            return rows;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, MandateTick obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "mandateid", obj.MandateId);
            AdoDatabaseDriver.Add(command, "revisionid", obj.RevisionId);
            AdoDatabaseDriver.Add(command, "revisionnumber", obj.RevisionNumber);
            AdoDatabaseDriver.Add(command, "wakesource", obj.WakeSource.ToString());
            AdoDatabaseDriver.Add(command, "scheduledutc", obj.ScheduledUtc);
            AdoDatabaseDriver.Add(command, "startedutc", obj.StartedUtc);
            AdoDatabaseDriver.Add(command, "finishedutc", obj.FinishedUtc);
            AdoDatabaseDriver.Add(command, "runid", obj.RunId);
            AdoDatabaseDriver.Add(command, "outcome", obj.Outcome?.ToString());
            AdoDatabaseDriver.Add(command, "reported", obj.Reported);
            AdoDatabaseDriver.Add(command, "requestednextwakeseconds", obj.RequestedNextWakeSeconds);
            AdoDatabaseDriver.Add(command, "appliedintervalseconds", obj.AppliedIntervalSeconds);
            AdoDatabaseDriver.Add(command, "costusd", obj.CostUsd);
            AdoDatabaseDriver.Add(command, "summary", obj.Summary);
            AdoDatabaseDriver.Add(command, "templatename", obj.TemplateName);
            AdoDatabaseDriver.Add(command, "templateversion", obj.TemplateVersion);
            AdoDatabaseDriver.Add(command, "errorcode", obj.ErrorCode);
            AdoDatabaseDriver.Add(command, "errormessage", obj.ErrorMessage);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
        }

        #endregion
    }
}
