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
    /// Provider-neutral trigger data access (P12.5). Thread-safe.
    /// </summary>
    public class AdoTriggerMethods : ITriggerMethods
    {
        #region Private-Members

        private static readonly HashSet<string> _ReferenceColumns = new HashSet<string>(StringComparer.Ordinal) { "agentid", "deploymentid", "pipelineid", "inputtemplateid" };
        private static readonly string _Columns = "id, tenantid, name, description, triggertype, targettype, agentid, deploymentid, pipelineid, inputtemplateid, priority, cronexpression, timezone, active, secretencrypted, secretkeyversion, secretlast4, secretrotatedutc, runastype, runasid, runasname, lastfireutc, lastfireoutcome, nextfireutc, firecount, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Fires;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoTriggerMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("triggers");
            _Fires = driver.Table("trigger_fires");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Trigger> CreateAsync(Trigger obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.NonQueryAsync("INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Trigger?> ReadAsync(string tenantId, string id, CancellationToken token = default)
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
        public async Task<Trigger?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
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
        public async Task<Trigger> UpdateAsync(Trigger obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET name = @name, description = @description, targettype = @targettype, agentid = @agentid, deploymentid = @deploymentid, pipelineid = @pipelineid, inputtemplateid = @inputtemplateid, priority = @priority, cronexpression = @cronexpression, timezone = @timezone, active = @active, secretencrypted = @secretencrypted, secretkeyversion = @secretkeyversion, secretlast4 = @secretlast4, secretrotatedutc = @secretrotatedutc, runastype = @runastype, runasid = @runasid, runasname = @runasname, nextfireutc = @nextfireutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
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
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Fires + " WHERE triggerid = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Trigger>> EnumerateAsync(string tenantId, TriggerTypeEnum? type, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (query.ActiveOnly) clauses.Add("active = " + _Driver.Dialect.BooleanLiteral(true));
            if (type.HasValue) clauses.Add("triggertype = @triggertype");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
                if (type.HasValue) AdoDatabaseDriver.Add(command, "triggertype", type.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Trigger> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<Trigger>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<Trigger>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE triggertype = 'Cron' AND active = " + _Driver.Dialect.BooleanLiteral(true) + " AND nextfireutc IS NOT NULL AND nextfireutc <= @now ORDER BY nextfireutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> TryAdvanceAsync(string id, DateTime expectedNextUtc, DateTime? nextUtc, DateTime firedUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET nextfireutc = @next, lastfireutc = @fired WHERE id = @id AND triggertype = 'Cron' AND active = " + _Driver.Dialect.BooleanLiteral(true) + " AND nextfireutc = @expected;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "next", nextUtc);
                    AdoDatabaseDriver.Add(command, "fired", firedUtc);
                    AdoDatabaseDriver.Add(command, "expected", expectedNextUtc);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task RecordFireAsync(string id, TriggerFireOutcomeEnum outcome, DateTime? firedUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET firecount = firecount + 1, lastfireoutcome = @outcome" + (firedUtc.HasValue ? ", lastfireutc = @fired" : String.Empty) + " WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "outcome", outcome.ToString());
                    if (firedUtc.HasValue) AdoDatabaseDriver.Add(command, "fired", firedUtc.Value);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(resourceId)) throw new ArgumentNullException(nameof(resourceId));
            if (column == null || !_ReferenceColumns.Contains(column)) throw new ArgumentException("Column must be agentid, deploymentid, pipelineid, or inputtemplateid.", nameof(column));
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
        /// Map a trigger row.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Trigger Map(DbDataReader reader)
        {
            Trigger obj = new Trigger();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.Type = AdoConverters.Enum<TriggerTypeEnum>(reader, "triggertype", TriggerTypeEnum.Cron);
            obj.TargetType = AdoConverters.Enum<TriggerTargetTypeEnum>(reader, "targettype", TriggerTargetTypeEnum.Agent);
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid");
            obj.PipelineId = AdoConverters.NullableStr(reader, "pipelineid");
            obj.InputTemplateId = AdoConverters.NullableStr(reader, "inputtemplateid");
            obj.Priority = AdoConverters.Int(reader, "priority");
            obj.CronExpression = AdoConverters.NullableStr(reader, "cronexpression");
            obj.TimeZone = AdoConverters.Str(reader, "timezone");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.SecretEncrypted = AdoConverters.NullableStr(reader, "secretencrypted");
            obj.SecretKeyVersion = AdoConverters.Int(reader, "secretkeyversion");
            obj.SigningSecretLast4 = AdoConverters.NullableStr(reader, "secretlast4");
            obj.SigningSecretRotatedUtc = AdoConverters.NullableDate(reader, "secretrotatedutc");
            obj.RunAsType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "runastype", PrincipalTypeEnum.User);
            obj.RunAsId = AdoConverters.NullableStr(reader, "runasid");
            obj.RunAsName = AdoConverters.NullableStr(reader, "runasname");
            obj.LastFireUtc = AdoConverters.NullableDate(reader, "lastfireutc");
            obj.LastFireOutcome = AdoConverters.NullableEnum<TriggerFireOutcomeEnum>(reader, "lastfireoutcome");
            obj.NextFireUtc = AdoConverters.NullableDate(reader, "nextfireutc");
            obj.FireCount = AdoConverters.Long(reader, "firecount");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Trigger obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "triggertype", obj.Type.ToString());
            AdoDatabaseDriver.Add(command, "targettype", obj.TargetType.ToString());
            AdoDatabaseDriver.Add(command, "agentid", String.IsNullOrEmpty(obj.AgentId) ? null : obj.AgentId);
            AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(obj.DeploymentId) ? null : obj.DeploymentId);
            AdoDatabaseDriver.Add(command, "pipelineid", String.IsNullOrEmpty(obj.PipelineId) ? null : obj.PipelineId);
            AdoDatabaseDriver.Add(command, "inputtemplateid", String.IsNullOrEmpty(obj.InputTemplateId) ? null : obj.InputTemplateId);
            AdoDatabaseDriver.Add(command, "priority", obj.Priority);
            AdoDatabaseDriver.Add(command, "cronexpression", obj.CronExpression);
            AdoDatabaseDriver.Add(command, "timezone", obj.TimeZone);
            AdoDatabaseDriver.Add(command, "active", obj.Active);
            AdoDatabaseDriver.Add(command, "secretencrypted", obj.SecretEncrypted);
            AdoDatabaseDriver.Add(command, "secretkeyversion", obj.SecretKeyVersion);
            AdoDatabaseDriver.Add(command, "secretlast4", obj.SigningSecretLast4);
            AdoDatabaseDriver.Add(command, "secretrotatedutc", obj.SigningSecretRotatedUtc);
            AdoDatabaseDriver.Add(command, "runastype", obj.RunAsType.ToString());
            AdoDatabaseDriver.Add(command, "runasid", obj.RunAsId);
            AdoDatabaseDriver.Add(command, "runasname", obj.RunAsName);
            AdoDatabaseDriver.Add(command, "lastfireutc", obj.LastFireUtc);
            AdoDatabaseDriver.Add(command, "lastfireoutcome", obj.LastFireOutcome?.ToString());
            AdoDatabaseDriver.Add(command, "nextfireutc", obj.NextFireUtc);
            AdoDatabaseDriver.Add(command, "firecount", obj.FireCount);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
