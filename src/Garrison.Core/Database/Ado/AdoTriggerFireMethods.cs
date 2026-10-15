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
    /// Provider-neutral trigger fire history (P12.5). Inserts use ON CONFLICT DO NOTHING against the unique
    /// (triggerid, firekey) index, which Sqlite and Postgresql both support. Thread-safe.
    /// </summary>
    public class AdoTriggerFireMethods : ITriggerFireMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, triggerid, triggername, source, firekey, deliveryid, scheduledutc, firedutc, outcome, runid, pipelinerunid, errorcode, errormessage, createdutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoTriggerFireMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("trigger_fires");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<bool> TryCreateAsync(TriggerFire obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(obj.FireKey)) obj.FireKey = obj.Id;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            int affected = await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ") ON CONFLICT DO NOTHING;", command => Bind(command, obj), token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<TriggerFire?> ReadByKeyAsync(string triggerId, string fireKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(triggerId)) throw new ArgumentNullException(nameof(triggerId));
            if (String.IsNullOrEmpty(fireKey)) throw new ArgumentNullException(nameof(fireKey));
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE triggerid = @triggerid AND firekey = @firekey;", command =>
            {
                AdoDatabaseDriver.Add(command, "triggerid", triggerId);
                AdoDatabaseDriver.Add(command, "firekey", fireKey);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<TriggerFire?> ReadAsync(string tenantId, string id, CancellationToken token = default)
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
        public async Task<TriggerFire> UpdateAsync(TriggerFire obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET outcome = @outcome, runid = @runid, pipelinerunid = @pipelinerunid, errorcode = @errorcode, errormessage = @errormessage, firedutc = @firedutc WHERE id = @id AND tenantid = @tenantid;",
                command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<TriggerFire>> EnumerateAsync(string tenantId, string triggerId, TriggerFireOutcomeEnum? outcome, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(triggerId)) throw new ArgumentNullException(nameof(triggerId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid", "triggerid = @triggerid" };
            if (outcome.HasValue) clauses.Add("outcome = @outcome");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "triggerid", triggerId);
                if (outcome.HasValue) AdoDatabaseDriver.Add(command, "outcome", outcome.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<TriggerFire> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, false) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<TriggerFire>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE createdutc < @cutoff;", command => AdoDatabaseDriver.Add(command, "cutoff", olderThanUtc), token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a fire row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static TriggerFire Map(DbDataReader reader)
        {
            TriggerFire obj = new TriggerFire();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.TriggerId = AdoConverters.Str(reader, "triggerid");
            obj.TriggerName = AdoConverters.Str(reader, "triggername");
            obj.Source = AdoConverters.Enum<TriggerFireSourceEnum>(reader, "source", TriggerFireSourceEnum.Cron);
            obj.FireKey = AdoConverters.Str(reader, "firekey");
            obj.DeliveryId = AdoConverters.NullableStr(reader, "deliveryid");
            obj.ScheduledUtc = AdoConverters.Date(reader, "scheduledutc");
            obj.FiredUtc = AdoConverters.Date(reader, "firedutc");
            obj.Outcome = AdoConverters.Enum<TriggerFireOutcomeEnum>(reader, "outcome", TriggerFireOutcomeEnum.Failed);
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.PipelineRunId = AdoConverters.NullableStr(reader, "pipelinerunid");
            obj.ErrorCode = AdoConverters.NullableStr(reader, "errorcode");
            obj.ErrorMessage = AdoConverters.NullableStr(reader, "errormessage");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, TriggerFire obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "triggerid", obj.TriggerId);
            AdoDatabaseDriver.Add(command, "triggername", obj.TriggerName);
            AdoDatabaseDriver.Add(command, "source", obj.Source.ToString());
            AdoDatabaseDriver.Add(command, "firekey", obj.FireKey);
            AdoDatabaseDriver.Add(command, "deliveryid", obj.DeliveryId);
            AdoDatabaseDriver.Add(command, "scheduledutc", obj.ScheduledUtc);
            AdoDatabaseDriver.Add(command, "firedutc", obj.FiredUtc);
            AdoDatabaseDriver.Add(command, "outcome", obj.Outcome.ToString());
            AdoDatabaseDriver.Add(command, "runid", obj.RunId);
            AdoDatabaseDriver.Add(command, "pipelinerunid", obj.PipelineRunId);
            AdoDatabaseDriver.Add(command, "errorcode", obj.ErrorCode);
            AdoDatabaseDriver.Add(command, "errormessage", Truncate(obj.ErrorMessage, 2000));
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
        }

        private static string? Truncate(string? value, int max)
        {
            if (value == null || value.Length <= max) return value;
            return value.Substring(0, max);
        }

        #endregion
    }
}
