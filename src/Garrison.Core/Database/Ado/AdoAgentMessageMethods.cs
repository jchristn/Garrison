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
    /// Provider-neutral data access for messages between agents (AA6). Thread-safe.
    /// </summary>
    public class AdoAgentMessageMethods : IAgentMessageMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, threadid, parentmessageid, hopcount, senderagentid, senderagentname, senderrunid, senderprincipaltype, senderprincipalid, sendername, recipientagentid, recipientagentname, urgency, subject, body, status, rejectionreason, rejectiondetail, escalationid, wokerecipient, deliveredrunid, deliveredutc, deliveryclaim, claimedutc, acknowledgedutc, expiresutc, sendkey, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Artifacts;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoAgentMessageMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("agent_messages");
            _Artifacts = driver.Table("agent_message_artifacts");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AgentMessage> CreateAsync(AgentMessage obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            if (String.IsNullOrEmpty(obj.ThreadId)) obj.ThreadId = obj.Id;
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                for (int i = 0; i < obj.Artifacts.Count; i++)
                {
                    AgentMessageArtifact artifact = obj.Artifacts[i];
                    int position = i;
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Artifacts + " (messageid, tenantid, position, artifactid, name, mediatype, sizebytes) VALUES (@messageid, @tenantid, @position, @artifactid, @name, @mediatype, @sizebytes);", command =>
                    {
                        AdoDatabaseDriver.Add(command, "messageid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "artifactid", artifact.ArtifactId);
                        AdoDatabaseDriver.Add(command, "name", artifact.Name);
                        AdoDatabaseDriver.Add(command, "mediatype", artifact.MediaType);
                        AdoDatabaseDriver.Add(command, "sizebytes", artifact.SizeBytes);
                    }, ct).ConfigureAwait(false);
                }
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentMessage?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            AgentMessage? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadArtifactsAsync(new List<AgentMessage> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentMessage?> ReadBySendKeyAsync(string tenantId, string sendKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(sendKey)) throw new ArgumentNullException(nameof(sendKey));
            AgentMessage? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND sendkey = @sendkey;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "sendkey", sendKey);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadArtifactsAsync(new List<AgentMessage> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<AgentMessage>> EnumerateAsync(AgentMessageFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            EnumerationQuery query = new EnumerationQuery { MaxResults = filter.MaxResults, Skip = Math.Max(0, filter.Skip) };
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(filter.SenderAgentId)) clauses.Add("senderagentid = @senderagentid");
            if (!String.IsNullOrEmpty(filter.RecipientAgentId)) clauses.Add("recipientagentid = @recipientagentid");
            if (!String.IsNullOrEmpty(filter.AgentId)) clauses.Add("(senderagentid = @agentid OR recipientagentid = @agentid)");
            if (filter.Status.HasValue) clauses.Add("status = @status");
            if (filter.Urgency.HasValue) clauses.Add("urgency = @urgency");
            if (filter.RejectionReason.HasValue) clauses.Add("rejectionreason = @rejectionreason");
            if (!String.IsNullOrEmpty(filter.ThreadId)) clauses.Add("threadid = @threadid");
            if (!String.IsNullOrEmpty(filter.DeliveredRunId)) clauses.Add("deliveredrunid = @deliveredrunid");
            if (filter.FromUtc.HasValue) clauses.Add("createdutc >= @fromutc");
            if (filter.ToUtc.HasValue) clauses.Add("createdutc < @toutc");
            if (!String.IsNullOrEmpty(filter.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("subject", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (!String.IsNullOrEmpty(filter.SenderAgentId)) AdoDatabaseDriver.Add(command, "senderagentid", filter.SenderAgentId);
                if (!String.IsNullOrEmpty(filter.RecipientAgentId)) AdoDatabaseDriver.Add(command, "recipientagentid", filter.RecipientAgentId);
                if (!String.IsNullOrEmpty(filter.AgentId)) AdoDatabaseDriver.Add(command, "agentid", filter.AgentId);
                if (filter.Status.HasValue) AdoDatabaseDriver.Add(command, "status", filter.Status.Value.ToString());
                if (filter.Urgency.HasValue) AdoDatabaseDriver.Add(command, "urgency", filter.Urgency.Value.ToString());
                if (filter.RejectionReason.HasValue) AdoDatabaseDriver.Add(command, "rejectionreason", filter.RejectionReason.Value.ToString());
                if (!String.IsNullOrEmpty(filter.ThreadId)) AdoDatabaseDriver.Add(command, "threadid", filter.ThreadId);
                if (!String.IsNullOrEmpty(filter.DeliveredRunId)) AdoDatabaseDriver.Add(command, "deliveredrunid", filter.DeliveredRunId);
                if (filter.FromUtc.HasValue) AdoDatabaseDriver.Add(command, "fromutc", filter.FromUtc.Value);
                if (filter.ToUtc.HasValue) AdoDatabaseDriver.Add(command, "toutc", filter.ToUtc.Value);
                if (!String.IsNullOrEmpty(filter.Search)) AdoDatabaseDriver.Add(command, "search", "%" + filter.Search + "%");
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<AgentMessage> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY createdutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            await LoadArtifactsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<AgentMessage>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<AgentMessage>> ListThreadAsync(string tenantId, string threadId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(threadId)) throw new ArgumentNullException(nameof(threadId));
            List<AgentMessage> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND threadid = @threadid ORDER BY createdutc, id" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "threadid", threadId);
                    AdoDatabaseDriver.Add(command, "max", 1000);
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            await LoadArtifactsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<long> CountLineAsync(string tenantId, string? senderAgentId, string? senderPrincipalId, string recipientAgentId, DateTime sinceUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            // A person is keyed by principal; an administrator without a principal identifier shares one key.
            string sender = !String.IsNullOrEmpty(senderAgentId) ? "senderagentid = @sender"
                : !String.IsNullOrEmpty(senderPrincipalId) ? "senderagentid IS NULL AND senderprincipalid = @sender"
                : "senderagentid IS NULL AND senderprincipalid IS NULL";
            string? senderKey = !String.IsNullOrEmpty(senderAgentId) ? senderAgentId : !String.IsNullOrEmpty(senderPrincipalId) ? senderPrincipalId : null;
            object? value = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND " + sender + " AND recipientagentid = @recipient AND status <> 'Rejected' AND createdutc >= @since;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    if (senderKey != null) AdoDatabaseDriver.Add(command, "sender", senderKey);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "since", sinceUtc);
                }, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<long> CountThreadAsync(string tenantId, string threadId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(threadId)) throw new ArgumentNullException(nameof(threadId));
            object? value = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " WHERE threadid = @threadid AND tenantid = @tenantid AND status <> 'Rejected';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "threadid", threadId);
                }, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<long> CountWakesAsync(string tenantId, string recipientAgentId, DateTime sinceUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            object? value = await _Driver.ScalarAsync(
                "SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND recipientagentid = @recipient AND wokerecipient = " + _Driver.Dialect.BooleanLiteral(true) + " AND createdutc >= @since;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "since", sinceUtc);
                }, token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<int?> MaxDeliveredHopAsync(string tenantId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            object? value = await _Driver.ScalarAsync(
                "SELECT MAX(hopcount) FROM " + _Table + " WHERE deliveredrunid = @runid AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "runid", runId);
                }, token).ConfigureAwait(false);
            if (value == null || value is DBNull) return null;
            return Convert.ToInt32(value);
        }

        /// <inheritdoc />
        public async Task<List<AgentMessage>> ClaimQueuedAsync(string tenantId, string recipientAgentId, string claim, int max, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            if (String.IsNullOrEmpty(claim)) throw new ArgumentNullException(nameof(claim));
            string open = "status = 'Queued' AND deliveryclaim IS NULL";
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deliveryclaim = @claim, claimedutc = @now WHERE tenantid = @tenantid AND " + open + " AND id IN (" +
                "SELECT id FROM " + _Table + " WHERE tenantid = @tenantid AND recipientagentid = @recipient AND " + open +
                " AND (expiresutc IS NULL OR expiresutc > @now) ORDER BY createdutc, id LIMIT @max);",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "claim", claim);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, max));
                }, token).ConfigureAwait(false);
            List<AgentMessage> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND deliveryclaim = @claim ORDER BY createdutc, id;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "claim", claim);
                }, Map, token).ConfigureAwait(false);
            await LoadArtifactsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<int> MarkDeliveredAsync(string tenantId, string claim, string runId, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(claim)) throw new ArgumentNullException(nameof(claim));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Delivered', deliveredrunid = @runid, deliveredutc = @now, deliveryclaim = NULL, claimedutc = NULL, lastupdateutc = @now " +
                "WHERE tenantid = @tenantid AND deliveryclaim = @claim AND status = 'Queued';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "claim", claim);
                    AdoDatabaseDriver.Add(command, "runid", runId);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> ReleaseClaimAsync(string tenantId, string claim, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(claim)) throw new ArgumentNullException(nameof(claim));
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deliveryclaim = NULL, claimedutc = NULL WHERE tenantid = @tenantid AND deliveryclaim = @claim;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "claim", claim);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> ReleaseStaleClaimsAsync(DateTime olderThanUtc, CancellationToken token = default)
        {
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET deliveryclaim = NULL, claimedutc = NULL WHERE deliveryclaim IS NOT NULL AND status = 'Queued' AND claimedutc < @before;",
                command => AdoDatabaseDriver.Add(command, "before", olderThanUtc), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task SetWokeAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET wokerecipient = " + _Driver.Dialect.BooleanLiteral(true) + " WHERE id = @id AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> AcknowledgeAsync(string tenantId, string id, string recipientAgentId, DateTime nowUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            int affected = await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET status = 'Acknowledged', acknowledgedutc = @now, lastupdateutc = @now " +
                "WHERE id = @id AND tenantid = @tenantid AND recipientagentid = @recipient AND status = 'Delivered';",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<List<AgentMessage>> ExpireAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            List<AgentMessage> candidates = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE status = 'Queued' AND deliveryclaim IS NULL AND expiresutc IS NOT NULL AND expiresutc <= @now ORDER BY expiresutc, id" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            List<AgentMessage> expired = new List<AgentMessage>();
            foreach (AgentMessage message in candidates)
            {
                token.ThrowIfCancellationRequested();
                int affected = await _Driver.NonQueryAsync(
                    "UPDATE " + _Table + " SET status = 'Expired', lastupdateutc = @now WHERE id = @id AND status = 'Queued' AND deliveryclaim IS NULL;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", message.Id);
                        AdoDatabaseDriver.Add(command, "now", nowUtc);
                    }, token).ConfigureAwait(false);
                if (affected == 0) continue;
                message.Status = MessageStatusEnum.Expired;
                message.LastUpdateUtc = nowUtc;
                expired.Add(message);
            }
            return expired;
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, long>> CountLoopGuardRejectionsAsync(string tenantId, List<string> senderAgentIds, DateTime fromUtc, DateTime toUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (senderAgentIds == null) throw new ArgumentNullException(nameof(senderAgentIds));
            Dictionary<string, long> result = new Dictionary<string, long>(StringComparer.Ordinal);
            if (senderAgentIds.Count == 0) return result;
            List<KeyValuePair<string, long>> rows = await _Driver.QueryAsync(
                "SELECT senderagentid, COUNT(*) AS total FROM " + _Table + " WHERE tenantid = @tenantid AND " + AdoInList.Clause("senderagentid", "a", senderAgentIds.Count) +
                " AND status = 'Rejected' AND rejectionreason IN ('HopLimit', 'LineRate', 'ThreadBudget') AND createdutc >= @fromutc AND createdutc < @toutc GROUP BY senderagentid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoInList.Bind(command, "a", senderAgentIds);
                    AdoDatabaseDriver.Add(command, "fromutc", fromUtc);
                    AdoDatabaseDriver.Add(command, "toutc", toUtc);
                },
                reader => new KeyValuePair<string, long>(AdoConverters.Str(reader, "senderagentid"), AdoConverters.Long(reader, "total")),
                token).ConfigureAwait(false);
            foreach (KeyValuePair<string, long> row in rows) result[row.Key] = row.Value;
            return result;
        }

        /// <inheritdoc />
        public async Task<List<AgentMessage>> ExpireQueuedForRecipientAsync(string tenantId, string recipientAgentId, DateTime nowUtc, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            List<AgentMessage> candidates = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND recipientagentid = @recipient AND status = 'Queued' ORDER BY createdutc, id" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            List<AgentMessage> expired = new List<AgentMessage>();
            foreach (AgentMessage message in candidates)
            {
                token.ThrowIfCancellationRequested();
                int affected = await _Driver.NonQueryAsync(
                    "UPDATE " + _Table + " SET status = 'Expired', deliveryclaim = NULL, claimedutc = NULL, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND status = 'Queued';",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", message.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        AdoDatabaseDriver.Add(command, "now", nowUtc);
                    }, token).ConfigureAwait(false);
                if (affected == 0) continue;
                message.Status = MessageStatusEnum.Expired;
                message.LastUpdateUtc = nowUtc;
                expired.Add(message);
            }
            return expired;
        }

        /// <inheritdoc />
        public async Task<List<AgentMessage>> ListChangedAfterAsync(string tenantId, string recipientAgentId, DateTime afterUtc, string? afterId, int limit, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(recipientAgentId)) throw new ArgumentNullException(nameof(recipientAgentId));
            List<AgentMessage> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND recipientagentid = @recipient AND (lastupdateutc > @after OR (lastupdateutc = @after AND id > @afterid)) ORDER BY lastupdateutc, id" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "recipient", recipientAgentId);
                    AdoDatabaseDriver.Add(command, "after", afterUtc);
                    AdoDatabaseDriver.Add(command, "afterid", afterId ?? String.Empty);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
            await LoadArtifactsAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <summary>
        /// Map a message row (without artifacts).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>The message.</returns>
        public static AgentMessage Map(DbDataReader reader)
        {
            AgentMessage obj = new AgentMessage();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.ThreadId = AdoConverters.Str(reader, "threadid");
            obj.ParentMessageId = AdoConverters.NullableStr(reader, "parentmessageid");
            obj.HopCount = AdoConverters.Int(reader, "hopcount");
            obj.SenderAgentId = AdoConverters.NullableStr(reader, "senderagentid");
            obj.SenderAgentName = AdoConverters.NullableStr(reader, "senderagentname");
            obj.SenderRunId = AdoConverters.NullableStr(reader, "senderrunid");
            obj.SenderPrincipalType = AdoConverters.Enum<PrincipalTypeEnum>(reader, "senderprincipaltype", PrincipalTypeEnum.Run);
            obj.SenderPrincipalId = AdoConverters.NullableStr(reader, "senderprincipalid");
            obj.SenderName = AdoConverters.NullableStr(reader, "sendername");
            obj.RecipientAgentId = AdoConverters.Str(reader, "recipientagentid");
            obj.RecipientAgentName = AdoConverters.NullableStr(reader, "recipientagentname");
            obj.Urgency = AdoConverters.Enum<MessageUrgencyEnum>(reader, "urgency", MessageUrgencyEnum.Normal);
            obj.Subject = AdoConverters.Str(reader, "subject");
            obj.Body = AdoConverters.NullableStr(reader, "body") ?? String.Empty;
            obj.Status = AdoConverters.Enum<MessageStatusEnum>(reader, "status", MessageStatusEnum.Queued);
            obj.RejectionReason = AdoConverters.NullableEnum<MessageRejectionEnum>(reader, "rejectionreason");
            obj.RejectionDetail = AdoConverters.NullableStr(reader, "rejectiondetail");
            obj.EscalationId = AdoConverters.NullableStr(reader, "escalationid");
            obj.WokeRecipient = AdoConverters.Bool(reader, "wokerecipient");
            obj.DeliveredRunId = AdoConverters.NullableStr(reader, "deliveredrunid");
            obj.DeliveredUtc = AdoConverters.NullableDate(reader, "deliveredutc");
            obj.DeliveryClaim = AdoConverters.NullableStr(reader, "deliveryclaim");
            obj.ClaimedUtc = AdoConverters.NullableDate(reader, "claimedutc");
            obj.AcknowledgedUtc = AdoConverters.NullableDate(reader, "acknowledgedutc");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.SendKey = AdoConverters.NullableStr(reader, "sendkey");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, AgentMessage obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "threadid", obj.ThreadId);
            AdoDatabaseDriver.Add(command, "parentmessageid", obj.ParentMessageId);
            AdoDatabaseDriver.Add(command, "hopcount", obj.HopCount);
            AdoDatabaseDriver.Add(command, "senderagentid", obj.SenderAgentId);
            AdoDatabaseDriver.Add(command, "senderagentname", obj.SenderAgentName);
            AdoDatabaseDriver.Add(command, "senderrunid", obj.SenderRunId);
            AdoDatabaseDriver.Add(command, "senderprincipaltype", obj.SenderPrincipalType.ToString());
            AdoDatabaseDriver.Add(command, "senderprincipalid", obj.SenderPrincipalId);
            AdoDatabaseDriver.Add(command, "sendername", obj.SenderName);
            AdoDatabaseDriver.Add(command, "recipientagentid", obj.RecipientAgentId);
            AdoDatabaseDriver.Add(command, "recipientagentname", obj.RecipientAgentName);
            AdoDatabaseDriver.Add(command, "urgency", obj.Urgency.ToString());
            AdoDatabaseDriver.Add(command, "subject", obj.Subject);
            AdoDatabaseDriver.Add(command, "body", obj.Body);
            AdoDatabaseDriver.Add(command, "status", obj.Status.ToString());
            AdoDatabaseDriver.Add(command, "rejectionreason", obj.RejectionReason?.ToString());
            AdoDatabaseDriver.Add(command, "rejectiondetail", obj.RejectionDetail);
            AdoDatabaseDriver.Add(command, "escalationid", obj.EscalationId);
            AdoDatabaseDriver.Add(command, "wokerecipient", obj.WokeRecipient);
            AdoDatabaseDriver.Add(command, "deliveredrunid", obj.DeliveredRunId);
            AdoDatabaseDriver.Add(command, "deliveredutc", obj.DeliveredUtc);
            AdoDatabaseDriver.Add(command, "deliveryclaim", obj.DeliveryClaim);
            AdoDatabaseDriver.Add(command, "claimedutc", obj.ClaimedUtc);
            AdoDatabaseDriver.Add(command, "acknowledgedutc", obj.AcknowledgedUtc);
            AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
            AdoDatabaseDriver.Add(command, "sendkey", obj.SendKey);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task LoadArtifactsAsync(List<AgentMessage> messages, CancellationToken token)
        {
            if (messages.Count == 0) return;
            Dictionary<string, AgentMessage> byId = messages.ToDictionary(m => m.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < messages.Count; i++) names.Add("@m" + i);
            await _Driver.QueryAsync("SELECT messageid, artifactid, name, mediatype, sizebytes FROM " + _Artifacts + " WHERE tenantid = @tenantid AND messageid IN (" + String.Join(", ", names) + ") ORDER BY messageid, position;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", messages[0].TenantId);
                for (int i = 0; i < messages.Count; i++) AdoDatabaseDriver.Add(command, "m" + i, messages[i].Id);
            }, reader =>
            {
                if (byId.TryGetValue(AdoConverters.Str(reader, "messageid"), out AgentMessage? message))
                {
                    AgentMessageArtifact artifact = new AgentMessageArtifact();
                    artifact.ArtifactId = AdoConverters.Str(reader, "artifactid");
                    artifact.Name = AdoConverters.Str(reader, "name");
                    artifact.MediaType = AdoConverters.Str(reader, "mediatype");
                    artifact.SizeBytes = AdoConverters.Long(reader, "sizebytes");
                    message.Artifacts.Add(artifact);
                }
                return true;
            }, token).ConfigureAwait(false);
        }

        #endregion
    }
}
