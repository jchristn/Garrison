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
    /// Provider-neutral escalation data access (AA2). Thread-safe.
    /// </summary>
    public class AdoEscalationMethods : IEscalationMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, raisingrunid, leaseepoch, agentid, agentname, mandateid, mandatetickid, targetkind, targetid, targetname, severity, mode, status, question, context, defaultanswer, timeoutseconds, expiresutc, timeoutaction, parentescalationid, escalatedtoid, routedrunid, answerchoice, answertext, resolvedby, resolutionsource, resolvedutc, deliveredtickid, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Options;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoEscalationMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("escalations");
            _Options = driver.Table("escalation_options");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Escalation> CreateAsync(Escalation obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            DateTime now = DateTime.UtcNow;
            obj.CreatedUtc = now;
            obj.LastUpdateUtc = now;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                for (int i = 0; i < obj.Options.Count; i++)
                {
                    EscalationOption option = obj.Options[i];
                    option.Order = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Options + " (escalationid, tenantid, position, optionkey, label) VALUES (@escalationid, @tenantid, @position, @optionkey, @label);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "escalationid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", i);
                        AdoDatabaseDriver.Add(command, "optionkey", option.Key);
                        AdoDatabaseDriver.Add(command, "label", option.Label);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Escalation?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            Escalation? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadOptionsAsync(new List<Escalation> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Escalation>> EnumerateAsync(EscalationFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (filter.TargetKind.HasValue) clauses.Add("targetkind = @targetkind");
            if (!String.IsNullOrEmpty(filter.TargetId)) clauses.Add("targetid = @targetid");
            if (filter.Severity.HasValue) clauses.Add("severity = @severity");
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(filter.MandateId)) clauses.Add("mandateid = @mandateid");
            if (!String.IsNullOrEmpty(filter.RaisingRunId)) clauses.Add("raisingrunid = @raisingrunid");
            if (filter.WithinAgentIds != null) clauses.Add(filter.WithinAgentIds.Count == 0 ? "1 = 0" : AdoInList.Clause("agentid", "within", filter.WithinAgentIds.Count));
            if (!String.IsNullOrEmpty(filter.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("question", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (filter.TargetKind.HasValue) AdoDatabaseDriver.Add(command, "targetkind", filter.TargetKind.Value.ToString());
                if (!String.IsNullOrEmpty(filter.TargetId)) AdoDatabaseDriver.Add(command, "targetid", filter.TargetId);
                if (filter.Severity.HasValue) AdoDatabaseDriver.Add(command, "severity", filter.Severity.Value.ToString());
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (!String.IsNullOrEmpty(filter.MandateId)) AdoDatabaseDriver.Add(command, "mandateid", filter.MandateId);
                if (!String.IsNullOrEmpty(filter.RaisingRunId)) AdoDatabaseDriver.Add(command, "raisingrunid", filter.RaisingRunId);
                if (filter.WithinAgentIds != null && filter.WithinAgentIds.Count > 0) AdoInList.Bind(command, "within", filter.WithinAgentIds);
                if (!String.IsNullOrEmpty(filter.Search)) AdoDatabaseDriver.Add(command, "search", "%" + filter.Search + "%");
            };
            EnumerationQuery query = new EnumerationQuery { MaxResults = filter.MaxResults, Skip = Math.Max(0, filter.Skip) };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<Escalation> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY CASE WHEN status = 'Open' THEN 0 ELSE 1 END, createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            await LoadOptionsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<Escalation>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> TryResolveAsync(Escalation obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = @status, answerchoice = @answerchoice, answertext = @answertext, resolvedby = @resolvedby, resolutionsource = @resolutionsource, resolvedutc = @resolvedutc, expiresutc = NULL, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid AND status = 'Open';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
                    AdoDatabaseDriver.Add(command, "answerchoice", obj.AnswerChoice);
                    AdoDatabaseDriver.Add(command, "answertext", obj.AnswerText);
                    AdoDatabaseDriver.Add(command, "resolvedby", obj.ResolvedBy);
                    AdoDatabaseDriver.Add(command, "resolutionsource", obj.ResolutionSource?.ToString());
                    AdoDatabaseDriver.Add(command, "resolvedutc", obj.ResolvedUtc);
                    AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, token).ConfigureAwait(false);
            if (affected > 0) obj.ExpiresUtc = null;
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> TrySetEscalatedToAsync(string tenantId, string id, string escalatedToId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(escalatedToId)) throw new ArgumentNullException(nameof(escalatedToId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET escalatedtoid = @to, expiresutc = NULL, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND status = 'Open' AND escalatedtoid IS NULL;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "to", escalatedToId);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task SetRoutedRunAsync(string tenantId, string id, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            await _Driver.NonQueryAsync("UPDATE " + _Table + " SET routedrunid = @run WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "run", runId);
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Escalation>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Open' AND expiresutc IS NOT NULL AND expiresutc <= @now ORDER BY expiresutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<List<Escalation>> ListUndeliveredAsync(string tenantId, string mandateId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            List<Escalation> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND mandateid = @mandateid AND status = 'Answered' AND mode = 'NonBlocking' AND deliveredtickid IS NULL ORDER BY resolvedutc ASC, id ASC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "mandateid", mandateId);
                }, Map, token).ConfigureAwait(false);
            await LoadOptionsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<int> MarkDeliveredAsync(string tenantId, List<string> ids, string tickId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (ids == null) throw new ArgumentNullException(nameof(ids));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            if (ids.Count == 0) return 0;
            List<string> names = new List<string>();
            for (int i = 0; i < ids.Count; i++) names.Add("@e" + i);
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deliveredtickid = @tick WHERE tenantid = @tenantid AND deliveredtickid IS NULL AND id IN (" + String.Join(", ", names) + ");",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tick", tickId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    for (int i = 0; i < ids.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, ids[i]);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> ReleaseDeliveredAsync(string tenantId, string tickId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(tickId)) throw new ArgumentNullException(nameof(tickId));
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deliveredtickid = NULL WHERE tenantid = @tenantid AND deliveredtickid = @tick;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tick", tickId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, long>> CountRaisedByAgentAsync(string tenantId, List<string> agentIds, DateTime fromUtc, DateTime toUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (agentIds == null) throw new ArgumentNullException(nameof(agentIds));
            Dictionary<string, long> result = new Dictionary<string, long>(StringComparer.Ordinal);
            if (agentIds.Count == 0) return result;
            List<KeyValuePair<string, long>> rows = await _Driver.QueryAsync(
                "SELECT agentid, COUNT(*) AS total FROM " + _Table + " WHERE tenantid = @tenantid AND " + AdoInList.Clause("agentid", "a", agentIds.Count) +
                " AND parentescalationid IS NULL AND createdutc >= @fromutc AND createdutc < @toutc GROUP BY agentid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoInList.Bind(command, "a", agentIds);
                    AdoDatabaseDriver.Add(command, "fromutc", fromUtc);
                    AdoDatabaseDriver.Add(command, "toutc", toUtc);
                },
                reader => new KeyValuePair<string, long>(AdoConverters.Str(reader, "agentid"), AdoConverters.Long(reader, "total")),
                token).ConfigureAwait(false);
            foreach (KeyValuePair<string, long> row in rows) result[row.Key] = row.Value;
            return result;
        }

        /// <inheritdoc />
        public async Task<long> CountOpenAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND status = 'Open' AND escalatedtoid IS NULL;", command => AdoDatabaseDriver.Add(command, "tenantid", tenantId), token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<bool> HasOpenBlockingAsync(string tenantId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND raisingrunid = @run AND mode = 'Blocking' AND status = 'Open';", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "run", runId);
            }, token).ConfigureAwait(false);
            return value != null && Convert.ToInt64(value) > 0;
        }

        /// <inheritdoc />
        public async Task<List<Escalation>> ListChangedAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<Escalation> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND (lastupdateutc > @after OR (lastupdateutc = @after AND id > @afterid)) ORDER BY lastupdateutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "after", afterUtc);
                    AdoDatabaseDriver.Add(command, "afterid", afterId ?? String.Empty);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            await LoadOptionsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<List<Escalation>> ListByRaisingRunsAsync(string tenantId, List<string> ids, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<Escalation> rows = await AdoIdSetQuery.QueryAsync(_Driver, tenantId, ids, names => "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND raisingrunid IN (" + names + ") ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", Map, limit, token).ConfigureAwait(false);
            return rows;
        }

        /// <inheritdoc />
        public async Task<List<Escalation>> ListByRoutedRunsAsync(string tenantId, List<string> ids, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<Escalation> rows = await AdoIdSetQuery.QueryAsync(_Driver, tenantId, ids, names => "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND routedrunid IN (" + names + ") ORDER BY createdutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";", Map, limit, token).ConfigureAwait(false);
            return rows;
        }

        #endregion

        #region Private-Methods

        /// <summary>
        /// Map an escalation row (without options).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The escalation.</returns>
        public static Escalation Map(DbDataReader reader)
        {
            Escalation obj = new Escalation();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.RaisingRunId = AdoConverters.NullableStr(reader, "raisingrunid");
            obj.LeaseEpoch = AdoConverters.Long(reader, "leaseepoch");
            obj.AgentId = AdoConverters.NullableStr(reader, "agentid");
            obj.AgentName = AdoConverters.NullableStr(reader, "agentname");
            obj.MandateId = AdoConverters.NullableStr(reader, "mandateid");
            obj.MandateTickId = AdoConverters.NullableStr(reader, "mandatetickid");
            obj.TargetKind = AdoConverters.Enum<EscalationTargetKindEnum>(reader, "targetkind", EscalationTargetKindEnum.User);
            obj.TargetId = AdoConverters.NullableStr(reader, "targetid");
            obj.TargetName = AdoConverters.NullableStr(reader, "targetname");
            obj.Severity = AdoConverters.Enum<EscalationSeverityEnum>(reader, "severity", EscalationSeverityEnum.Warning);
            obj.Mode = AdoConverters.Enum<EscalationModeEnum>(reader, "mode", EscalationModeEnum.NonBlocking);
            obj.Status = AdoConverters.Enum<EscalationStatusEnum>(reader, "status", EscalationStatusEnum.Open);
            obj.Question = AdoConverters.Str(reader, "question");
            obj.Context = AdoConverters.NullableStr(reader, "context");
            obj.DefaultAnswer = AdoConverters.NullableStr(reader, "defaultanswer");
            obj.TimeoutSeconds = AdoConverters.Int(reader, "timeoutseconds");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.TimeoutAction = AdoConverters.Enum<EscalationTimeoutActionEnum>(reader, "timeoutaction", EscalationTimeoutActionEnum.EscalateUp);
            obj.ParentEscalationId = AdoConverters.NullableStr(reader, "parentescalationid");
            obj.EscalatedToId = AdoConverters.NullableStr(reader, "escalatedtoid");
            obj.RoutedRunId = AdoConverters.NullableStr(reader, "routedrunid");
            obj.AnswerChoice = AdoConverters.NullableStr(reader, "answerchoice");
            obj.AnswerText = AdoConverters.NullableStr(reader, "answertext");
            obj.ResolvedBy = AdoConverters.NullableStr(reader, "resolvedby");
            obj.ResolutionSource = AdoConverters.NullableEnum<EscalationResolutionSourceEnum>(reader, "resolutionsource");
            obj.ResolvedUtc = AdoConverters.NullableDate(reader, "resolvedutc");
            obj.DeliveredTickId = AdoConverters.NullableStr(reader, "deliveredtickid");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static void Bind(DbCommand command, Escalation obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "raisingrunid", obj.RaisingRunId);
            AdoDatabaseDriver.Add(command, "leaseepoch", obj.LeaseEpoch);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "agentname", obj.AgentName);
            AdoDatabaseDriver.Add(command, "mandateid", obj.MandateId);
            AdoDatabaseDriver.Add(command, "mandatetickid", obj.MandateTickId);
            AdoDatabaseDriver.Add(command, "targetkind", obj.TargetKind.ToString());
            AdoDatabaseDriver.Add(command, "targetid", obj.TargetId);
            AdoDatabaseDriver.Add(command, "targetname", obj.TargetName);
            AdoDatabaseDriver.Add(command, "severity", obj.Severity.ToString());
            AdoDatabaseDriver.Add(command, "mode", obj.Mode.ToString());
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "question", obj.Question);
            AdoDatabaseDriver.Add(command, "context", obj.Context);
            AdoDatabaseDriver.Add(command, "defaultanswer", obj.DefaultAnswer);
            AdoDatabaseDriver.Add(command, "timeoutseconds", obj.TimeoutSeconds);
            AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
            AdoDatabaseDriver.Add(command, "timeoutaction", obj.TimeoutAction.ToString());
            AdoDatabaseDriver.Add(command, "parentescalationid", obj.ParentEscalationId);
            AdoDatabaseDriver.Add(command, "escalatedtoid", obj.EscalatedToId);
            AdoDatabaseDriver.Add(command, "routedrunid", obj.RoutedRunId);
            AdoDatabaseDriver.Add(command, "answerchoice", obj.AnswerChoice);
            AdoDatabaseDriver.Add(command, "answertext", obj.AnswerText);
            AdoDatabaseDriver.Add(command, "resolvedby", obj.ResolvedBy);
            AdoDatabaseDriver.Add(command, "resolutionsource", obj.ResolutionSource?.ToString());
            AdoDatabaseDriver.Add(command, "resolvedutc", obj.ResolvedUtc);
            AdoDatabaseDriver.Add(command, "deliveredtickid", obj.DeliveredTickId);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task LoadOptionsAsync(List<Escalation> escalations, CancellationToken token)
        {
            if (escalations.Count == 0) return;
            Dictionary<string, Escalation> byId = escalations.ToDictionary(e => e.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < escalations.Count; i++) names.Add("@e" + i);
            List<EscalationOptionRow> rows = await _Driver.QueryAsync(
                "SELECT escalationid, position, optionkey, label FROM " + _Options + " WHERE tenantid = @tenantid AND escalationid IN (" + String.Join(", ", names) + ") ORDER BY escalationid, position;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", escalations[0].TenantId);
                    for (int i = 0; i < escalations.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, escalations[i].Id);
                },
                reader => new EscalationOptionRow
                {
                    EscalationId = AdoConverters.Str(reader, "escalationid"),
                    Option = new EscalationOption
                    {
                        Key = AdoConverters.Str(reader, "optionkey"),
                        Label = AdoConverters.NullableStr(reader, "label"),
                        Order = AdoConverters.Int(reader, "position")
                    }
                },
                token).ConfigureAwait(false);
            foreach (EscalationOptionRow row in rows)
            {
                if (byId.TryGetValue(row.EscalationId, out Escalation? escalation)) escalation.Options.Add(row.Option);
            }
        }

        #endregion
    }
}
