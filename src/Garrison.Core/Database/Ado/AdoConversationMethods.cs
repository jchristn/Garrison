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
    using Garrison.Core.Requests;

    /// <summary>
    /// Provider-neutral Conversation data access. Thread-safe.
    /// </summary>
    public class AdoConversationMethods : IConversationMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoConversationMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("conversations");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<Conversation> CreateAsync(Conversation obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;

            string sql = "INSERT INTO " + _Table + " (id, tenantid, agentid, agentname, deploymentid, harnesstype, contextid, appid, title, callertype, callerid, callername, sessionid, sessionharnessprofileid, affinitynodeid, affinitynodename, activerunid, lastrunid, turncount, fallbackcount, lastfallbackreason, lastfallbackutc, lastactivityutc, active, isprotected, createdutc, lastupdateutc) " +
                "VALUES (@id, @tenantid, @agentid, @agentname, @deploymentid, @harnesstype, @contextid, @appid, @title, @callertype, @callerid, @callername, @sessionid, @sessionharnessprofileid, @affinitynodeid, @affinitynodename, @activerunid, @lastrunid, @turncount, @fallbackcount, @lastfallbackreason, @lastfallbackutc, @lastactivityutc, @active, @isprotected, @createdutc, @lastupdateutc);";
            await _Driver.NonQueryAsync(sql, command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<Conversation?> ReadAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id;",
                command => AdoDatabaseDriver.Add(command, "id", id),
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Conversation?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Conversation?> ReadByContextIdAsync(string tenantId, string agentId, string contextId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            if (String.IsNullOrEmpty(contextId)) throw new ArgumentNullException(nameof(contextId));
            return await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND agentid = @agentid AND contextid = @contextid ORDER BY createdutc ASC;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "agentid", agentId);
                    AdoDatabaseDriver.Add(command, "contextid", contextId);
                },
                Map,
                token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Conversation> UpdateAsync(Conversation obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;

            string sql = "UPDATE " + _Table + " SET tenantid = @tenantid, agentid = @agentid, agentname = @agentname, deploymentid = @deploymentid, harnesstype = @harnesstype, contextid = @contextid, appid = @appid, title = @title, " +
                "callertype = @callertype, callerid = @callerid, callername = @callername, sessionid = @sessionid, sessionharnessprofileid = @sessionharnessprofileid, affinitynodeid = @affinitynodeid, " +
                "affinitynodename = @affinitynodename, activerunid = @activerunid, lastrunid = @lastrunid, turncount = @turncount, fallbackcount = @fallbackcount, lastfallbackreason = @lastfallbackreason, " +
                "lastfallbackutc = @lastfallbackutc, lastactivityutc = @lastactivityutc, active = @active, isprotected = @isprotected, lastupdateutc = @lastupdateutc WHERE id = @id;";
            await _Driver.NonQueryAsync(sql, command => Bind(command, obj), token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            object? result = await _Driver.ScalarAsync("SELECT 1 FROM " + _Table + " WHERE id = @id;", command => AdoDatabaseDriver.Add(command, "id", id), token).ConfigureAwait(false);
            return result != null;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Conversation>> EnumerateAsync(ConversationFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));

            List<string> clauses = new List<string>();
            if (!String.IsNullOrEmpty(filter.TenantId)) clauses.Add("tenantid = @tenantid");
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("agentid = @agentid");
            if (!String.IsNullOrEmpty(filter.ContextId)) clauses.Add("contextid = @contextid");
            if (!String.IsNullOrEmpty(filter.CallerId)) clauses.Add("callerid = @callerid");
            if (!String.IsNullOrEmpty(filter.AppId)) clauses.Add("appid = @appid");
            if (!String.IsNullOrEmpty(filter.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("title", "search"));
            string where = clauses.Count > 0 ? " WHERE " + String.Join(" AND ", clauses) : String.Empty;

            Action<DbCommand> bind = command =>
            {
                if (!String.IsNullOrEmpty(filter.TenantId)) AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (!String.IsNullOrEmpty(filter.ContextId)) AdoDatabaseDriver.Add(command, "contextid", filter.ContextId);
                if (!String.IsNullOrEmpty(filter.CallerId)) AdoDatabaseDriver.Add(command, "callerid", filter.CallerId);
                if (!String.IsNullOrEmpty(filter.AppId)) AdoDatabaseDriver.Add(command, "appid", filter.AppId);
                if (!String.IsNullOrEmpty(filter.Search)) AdoDatabaseDriver.Add(command, "search", "%" + filter.Search + "%");
            };

            EnumerationQuery query = new EnumerationQuery();
            query.Skip = filter.Skip;
            query.MaxResults = filter.MaxResults;
            query.Ordering = filter.Ordering;

            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);

            // Title stands in for a name in name ordering.
            string order = AdoEnumerationSql.OrderBy(query.Ordering, true).Replace("ORDER BY name", "ORDER BY title", StringComparison.Ordinal);
            List<Conversation> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + order + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);

            return EnumerationResult<Conversation>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<bool> TryAcquireTurnAsync(string id, string? expectedActiveRunId, string runId, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            string guard = String.IsNullOrEmpty(expectedActiveRunId) ? "activerunid IS NULL" : "activerunid = @expected";
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET activerunid = @run, lastactivityutc = @now, lastupdateutc = @now WHERE id = @id AND " + guard + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "run", runId);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    if (!String.IsNullOrEmpty(expectedActiveRunId)) AdoDatabaseDriver.Add(command, "expected", expectedActiveRunId);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> ReleaseTurnAsync(string id, string runId, string? previousActiveRunId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET activerunid = @previous, lastupdateutc = @now WHERE id = @id AND activerunid = @run;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "run", runId);
                    AdoDatabaseDriver.Add(command, "previous", previousActiveRunId);
                    AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> RecordTurnStartedAsync(Conversation obj, string runId, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            DateTime now = DateTime.UtcNow;
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lastrunid = @run, turncount = turncount + 1, deploymentid = @deploymentid, harnesstype = @harnesstype, title = @title, lastactivityutc = @now, lastupdateutc = @now WHERE id = @id AND activerunid = @run;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", obj.Id);
                    AdoDatabaseDriver.Add(command, "run", runId);
                    AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(obj.DeploymentId) ? null : obj.DeploymentId);
                    AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
                    AdoDatabaseDriver.Add(command, "title", obj.Title);
                    AdoDatabaseDriver.Add(command, "now", now);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> RecordTurnSucceededAsync(string id, string runId, string? sessionId, string? harnessProfileId, string? nodeId, string? nodeName, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET sessionid = @session, sessionharnessprofileid = @profile, affinitynodeid = @node, affinitynodename = @nodename, lastactivityutc = @now, lastupdateutc = @now WHERE id = @id AND activerunid = @run;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "run", runId);
                    AdoDatabaseDriver.Add(command, "session", sessionId);
                    AdoDatabaseDriver.Add(command, "profile", harnessProfileId);
                    AdoDatabaseDriver.Add(command, "node", nodeId);
                    AdoDatabaseDriver.Add(command, "nodename", nodeName);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> RecordFallbackAsync(string id, ConversationFallbackReasonEnum reason, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET fallbackcount = fallbackcount + 1, lastfallbackreason = @reason, lastfallbackutc = @now, affinitynodeid = NULL, affinitynodename = NULL, lastupdateutc = @now WHERE id = @id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "reason", reason.ToString());
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                },
                token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <summary>
        /// Map a row to a Conversation.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The record.</returns>
        public static Conversation Map(DbDataReader reader)
        {
            Conversation obj = new Conversation();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.AgentName = AdoConverters.Str(reader, "agentname");
            obj.DeploymentId = AdoConverters.NullableStr(reader, "deploymentid") ?? String.Empty;
            obj.HarnessType = AdoConverters.Enum<HarnessTypeEnum>(reader, "harnesstype", HarnessTypeEnum.Generic);
            obj.ContextId = AdoConverters.NullableStr(reader, "contextid");
            obj.AppId = AdoConverters.NullableStr(reader, "appid");
            obj.Title = AdoConverters.NullableStr(reader, "title");
            obj.CallerType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "callertype", PrincipalTypeEnum.User);
            obj.CallerId = AdoConverters.NullableStr(reader, "callerid");
            obj.CallerName = AdoConverters.NullableStr(reader, "callername");
            obj.SessionId = AdoConverters.NullableStr(reader, "sessionid");
            obj.SessionHarnessProfileId = AdoConverters.NullableStr(reader, "sessionharnessprofileid");
            obj.AffinityNodeId = AdoConverters.NullableStr(reader, "affinitynodeid");
            obj.AffinityNodeName = AdoConverters.NullableStr(reader, "affinitynodename");
            obj.ActiveRunId = AdoConverters.NullableStr(reader, "activerunid");
            obj.LastRunId = AdoConverters.NullableStr(reader, "lastrunid");
            obj.TurnCount = AdoConverters.Int(reader, "turncount");
            obj.FallbackCount = AdoConverters.Int(reader, "fallbackcount");
            obj.LastFallbackReason = AdoConverters.NullableEnum<ConversationFallbackReasonEnum>(reader, "lastfallbackreason");
            obj.LastFallbackUtc = AdoConverters.NullableDate(reader, "lastfallbackutc");
            obj.LastActivityUtc = AdoConverters.NullableDate(reader, "lastactivityutc");
            obj.Active = AdoConverters.Bool(reader, "active");
            obj.IsProtected = AdoConverters.Bool(reader, "isprotected");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, Conversation obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "agentname", obj.AgentName);
            AdoDatabaseDriver.Add(command, "deploymentid", String.IsNullOrEmpty(obj.DeploymentId) ? null : obj.DeploymentId);
            AdoDatabaseDriver.Add(command, "harnesstype", obj.HarnessType.ToString());
            AdoDatabaseDriver.Add(command, "contextid", obj.ContextId);
            AdoDatabaseDriver.Add(command, "appid", String.IsNullOrEmpty(obj.AppId) ? null : obj.AppId);
            AdoDatabaseDriver.Add(command, "title", obj.Title);
            AdoDatabaseDriver.Add(command, "callertype", obj.CallerType.ToString());
            AdoDatabaseDriver.Add(command, "callerid", obj.CallerId);
            AdoDatabaseDriver.Add(command, "callername", obj.CallerName);
            AdoDatabaseDriver.Add(command, "sessionid", obj.SessionId);
            AdoDatabaseDriver.Add(command, "sessionharnessprofileid", obj.SessionHarnessProfileId);
            AdoDatabaseDriver.Add(command, "affinitynodeid", obj.AffinityNodeId);
            AdoDatabaseDriver.Add(command, "affinitynodename", obj.AffinityNodeName);
            AdoDatabaseDriver.Add(command, "activerunid", obj.ActiveRunId);
            AdoDatabaseDriver.Add(command, "lastrunid", obj.LastRunId);
            AdoDatabaseDriver.Add(command, "turncount", obj.TurnCount);
            AdoDatabaseDriver.Add(command, "fallbackcount", obj.FallbackCount);
            AdoDatabaseDriver.Add(command, "lastfallbackreason", obj.LastFallbackReason?.ToString());
            AdoDatabaseDriver.Add(command, "lastfallbackutc", obj.LastFallbackUtc);
            AdoDatabaseDriver.Add(command, "lastactivityutc", obj.LastActivityUtc);
            AdoDatabaseDriver.Add(command, "active", obj.Active);
            AdoDatabaseDriver.Add(command, "isprotected", obj.IsProtected);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
