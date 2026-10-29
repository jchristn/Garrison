namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Provider-neutral agent revision data access (AD1). Child lists (prompt pins, allow list, capabilities, tags) are
    /// written with their revision in one transaction. No statement here updates a published revision. Thread-safe.
    /// </summary>
    public class AdoAgentRevisionMethods : IAgentRevisionMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, agentid, number, state, contenthash, displayname, description, inputmode, inputschemajson, outputschemajson, delegationmode, delegationmaxdepth, delegationallowrecursion, authoruserid, authorname, changenote, publishedbyuserid, publishedbyname, publishedutc, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Pins;
        private readonly string _Allow;
        private readonly string _Capabilities;
        private readonly string _Assets;
        private readonly string _Tags;
        private readonly string _Agents;
        private readonly string _AgentTags;
        private readonly string _AgentAllow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoAgentRevisionMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("agent_revisions");
            _Pins = driver.Table("agent_revision_prompt_pins");
            _Allow = driver.Table("agent_revision_allowlist");
            _Capabilities = driver.Table("agent_revision_capabilities");
            _Assets = driver.Table("agent_revision_asset_pins");
            _Tags = driver.Table("agent_revision_tags");
            _Agents = driver.Table("agents");
            _AgentTags = driver.Table("agent_tags");
            _AgentAllow = driver.Table("agent_delegation_allowlist");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AgentRevision?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            AgentRevision? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<AgentRevision> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentRevision?> ReadByNumberAsync(string tenantId, string agentId, int number, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            AgentRevision? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE agentid = @agentid AND number = @number AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "agentid", agentId);
                AdoDatabaseDriver.Add(command, "number", number);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadChildrenAsync(new List<AgentRevision> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<AgentRevision>> EnumerateAsync(string tenantId, string agentId, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            string where = " WHERE tenantid = @tenantid AND agentid = @agentid";
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "agentid", agentId);
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<AgentRevision> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + " ORDER BY number DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<AgentRevision>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<List<AgentRevision>> ListAsync(string tenantId, string agentId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            List<AgentRevision> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND agentid = @agentid ORDER BY number ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "agentid", agentId);
            }, Map, token).ConfigureAwait(false);
            await LoadChildrenAsync(objects, token).ConfigureAwait(false);
            return objects;
        }

        /// <inheritdoc />
        public async Task<AgentRevision> SaveDraftAsync(AgentRevision draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            draft.State = AgentRevisionStateEnum.Draft;
            draft.PublishedUtc = null;
            draft.PublishedByUserId = null;
            draft.PublishedByName = null;
            draft.ContentHash = AgentRevisionContent.ComputeHash(draft);
            draft.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<string?> pointer = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT draftrevisionid FROM " + _Agents + " WHERE id = @agentid AND tenantid = @tenantid;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "agentid", draft.AgentId);
                        AdoDatabaseDriver.Add(command, "tenantid", draft.TenantId);
                    },
                    reader => AdoConverters.NullableStr(reader, "draftrevisionid"), ct).ConfigureAwait(false);
                if (pointer.Count == 0) throw new InvalidOperationException("Agent " + draft.AgentId + " does not exist in tenant " + draft.TenantId + ".");
                string? existingId = pointer[0];
                if (!String.IsNullOrEmpty(existingId))
                {
                    List<AgentRevision> existing = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                        "SELECT * FROM " + _Table + " WHERE id = @id AND state = 'Draft';",
                        command => AdoDatabaseDriver.Add(command, "id", existingId),
                        Map, ct).ConfigureAwait(false);
                    if (existing.Count > 0)
                    {
                        draft.Id = existing[0].Id;
                        draft.Number = existing[0].Number;
                        draft.CreatedUtc = existing[0].CreatedUtc;
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                            "UPDATE " + _Table + " SET contenthash = @contenthash, displayname = @displayname, description = @description, inputmode = @inputmode, inputschemajson = @inputschemajson, outputschemajson = @outputschemajson, delegationmode = @delegationmode, delegationmaxdepth = @delegationmaxdepth, delegationallowrecursion = @delegationallowrecursion, authoruserid = @authoruserid, authorname = @authorname, changenote = @changenote, lastupdateutc = @lastupdateutc WHERE id = @id AND state = 'Draft';",
                            command => Bind(command, draft), ct).ConfigureAwait(false);
                        await DeleteChildrenAsync(connection, transaction, draft.Id, ct).ConfigureAwait(false);
                        await InsertChildrenAsync(connection, transaction, draft, ct).ConfigureAwait(false);
                        return;
                    }
                }

                draft.Id = IdGenerator.NewAgentRevisionId();
                draft.Number = await NextNumberAsync(connection, transaction, draft.AgentId, ct).ConfigureAwait(false);
                draft.CreatedUtc = draft.LastUpdateUtc;
                await InsertAsync(connection, transaction, draft, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Agents + " SET draftrevisionid = @revisionid WHERE id = @agentid AND tenantid = @tenantid;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "revisionid", draft.Id);
                        AdoDatabaseDriver.Add(command, "agentid", draft.AgentId);
                        AdoDatabaseDriver.Add(command, "tenantid", draft.TenantId);
                    }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return draft;
        }

        /// <inheritdoc />
        public async Task<AgentRevision?> PublishAsync(string tenantId, string revisionId, string? publishedByUserId, string? publishedByName, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(revisionId)) throw new ArgumentNullException(nameof(revisionId));
            AgentRevision? draft = await ReadAsync(tenantId, revisionId, token).ConfigureAwait(false);
            if (draft == null || draft.State != AgentRevisionStateEnum.Draft) return null;
            DateTime now = DateTime.UtcNow;
            bool published = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET state = 'Published', publishedbyuserid = @userid, publishedbyname = @username, publishedutc = @now, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND state = 'Draft';",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "userid", publishedByUserId);
                        AdoDatabaseDriver.Add(command, "username", publishedByName);
                        AdoDatabaseDriver.Add(command, "now", now);
                        AdoDatabaseDriver.Add(command, "id", revisionId);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    }, ct).ConfigureAwait(false);
                if (affected == 0) return;
                published = true;
                await WriteAgentRowAsync(connection, transaction, draft, now, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            if (!published) return null;
            return await ReadAsync(tenantId, revisionId, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DiscardDraftAsync(string tenantId, string revisionId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(revisionId)) throw new ArgumentNullException(nameof(revisionId));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid AND state = 'Draft';",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revisionId);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    }, ct).ConfigureAwait(false);
                if (affected == 0) return;
                await DeleteChildrenAsync(connection, transaction, revisionId, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Agents + " SET draftrevisionid = NULL WHERE draftrevisionid = @id AND tenantid = @tenantid;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", revisionId);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<int> BackfillAsync(CancellationToken token = default)
        {
            List<string> pending = await _Driver.QueryAsync("SELECT id FROM " + _Agents + " WHERE latestpublishedrevisionid IS NULL ORDER BY id;", null, reader => AdoConverters.Str(reader, "id"), token).ConfigureAwait(false);
            int count = 0;
            foreach (string agentId in pending)
            {
                token.ThrowIfCancellationRequested();
                Agent? agent = await _Driver.Agents.ReadAsync(agentId, token).ConfigureAwait(false);
                if (agent == null) continue;
                await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
                {
                    await InsertInitialAsync(connection, transaction, agent, ct).ConfigureAwait(false);
                }, token).ConfigureAwait(false);
                count++;
            }
            return count;
        }

        /// <summary>
        /// Insert a published revision built from an agent's current fields, numbered after the agent's existing
        /// revisions, and point the agent's latest published revision at it. Used for revision 1 of a new agent and for
        /// direct agent edits that change content (AD-030).
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Transaction.</param>
        /// <param name="agent">Agent with child lists loaded.</param>
        /// <param name="token">Cancellation token.</param>
        /// <param name="content">Revision content to publish, or null to build it from the agent's fields.</param>
        /// <returns>The published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<AgentRevision> InsertInitialAsync(DbConnection connection, DbTransaction transaction, Agent agent, CancellationToken token, AgentRevision? content = null)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision revision = content ?? AgentRevisionContent.FromAgent(agent);
            revision.Number = await NextNumberAsync(connection, transaction, agent.Id, token).ConfigureAwait(false);
            revision.State = AgentRevisionStateEnum.Published;
            revision.AuthorName = "system";
            revision.PublishedByName = "system";
            revision.CreatedUtc = DateTime.UtcNow;
            revision.LastUpdateUtc = revision.CreatedUtc;
            revision.PublishedUtc = revision.CreatedUtc;
            await InsertAsync(connection, transaction, revision, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                "UPDATE " + _Agents + " SET latestpublishedrevisionid = @revisionid WHERE id = @agentid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                    AdoDatabaseDriver.Add(command, "agentid", agent.Id);
                }, token).ConfigureAwait(false);
            agent.LatestPublishedRevisionId = revision.Id;
            return revision;
        }

        /// <summary>
        /// Build the revision a direct edit of an agent publishes (AD-030): the agent's fields, plus the content an agent
        /// row cannot hold (asset pins, capabilities, and prompt pin versions) carried over from the latest published
        /// revision. Read inside a transaction.
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Transaction.</param>
        /// <param name="agent">Agent with child lists loaded.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision content with its hash, and the latest published hash (null when there is none).</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<AgentRevision> DirectEditContentAsync(DbConnection connection, DbTransaction transaction, Agent agent, CancellationToken token)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            AgentRevision content = AgentRevisionContent.FromAgent(agent);
            List<string> latest = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                "SELECT latestpublishedrevisionid FROM " + _Agents + " WHERE id = @agentid;",
                command => AdoDatabaseDriver.Add(command, "agentid", agent.Id),
                reader => AdoConverters.NullableStr(reader, "latestpublishedrevisionid") ?? String.Empty, token).ConfigureAwait(false);
            string latestId = latest.Count == 0 ? String.Empty : latest[0];
            if (String.IsNullOrEmpty(latestId)) return content;
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "id", latestId);
            content.AssetPins = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT assetid, version FROM " + _Assets + " WHERE revisionid = @id ORDER BY position ASC;", bind,
                reader => new AgentRevisionAssetPin { AssetId = AdoConverters.Str(reader, "assetid"), Version = AdoConverters.NullableInt(reader, "version") }, token).ConfigureAwait(false);
            content.Capabilities = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT capability FROM " + _Capabilities + " WHERE revisionid = @id ORDER BY position ASC;", bind,
                reader => AdoConverters.Str(reader, "capability"), token).ConfigureAwait(false);
            List<AgentRevisionPromptPin> pins = await AdoDatabaseDriver.QueryAsync(connection, transaction, "SELECT role, templateid, pinnedversion FROM " + _Pins + " WHERE revisionid = @id ORDER BY position ASC;", bind,
                reader => new AgentRevisionPromptPin { Role = AdoConverters.Str(reader, "role"), TemplateId = AdoConverters.Str(reader, "templateid"), PinnedVersion = AdoConverters.NullableInt(reader, "pinnedversion") }, token).ConfigureAwait(false);
            foreach (AgentRevisionPromptPin pin in content.PromptPins)
            {
                AgentRevisionPromptPin? same = pins.FirstOrDefault(p => p.Role == pin.Role && p.TemplateId == pin.TemplateId);
                if (same != null) pin.PinnedVersion = same.PinnedVersion;
            }
            content.ContentHash = AgentRevisionContent.ComputeHash(content);
            return content;
        }

        /// <summary>
        /// Content hash of the agent's latest published revision, read inside a transaction.
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Transaction.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Hash, or null when the agent has no published revision.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<string?> LatestPublishedHashAsync(DbConnection connection, DbTransaction transaction, string agentId, CancellationToken token)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            List<string> hashes = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                "SELECT r.contenthash FROM " + _Table + " r INNER JOIN " + _Agents + " a ON a.latestpublishedrevisionid = r.id WHERE a.id = @agentid;",
                command => AdoDatabaseDriver.Add(command, "agentid", agentId),
                reader => AdoConverters.Str(reader, "contenthash"), token).ConfigureAwait(false);
            return hashes.Count == 0 ? null : hashes[0];
        }

        /// <summary>
        /// Delete every revision of an agent with its child rows (used when the agent is deleted).
        /// </summary>
        /// <param name="connection">Open connection.</param>
        /// <param name="transaction">Transaction.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task DeleteForAgentAsync(DbConnection connection, DbTransaction transaction, string agentId, CancellationToken token)
        {
            if (connection == null) throw new ArgumentNullException(nameof(connection));
            if (transaction == null) throw new ArgumentNullException(nameof(transaction));
            if (String.IsNullOrEmpty(agentId)) throw new ArgumentNullException(nameof(agentId));
            string children = " WHERE revisionid IN (SELECT id FROM " + _Table + " WHERE agentid = @agentid);";
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "agentid", agentId);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Pins + children, bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Assets + children, bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Allow + children, bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Capabilities + children, bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + children, bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE agentid = @agentid;", bind, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a revision row (child lists not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Revision.</returns>
        public static AgentRevision Map(DbDataReader reader)
        {
            AgentRevision obj = new AgentRevision();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AgentId = AdoConverters.Str(reader, "agentid");
            obj.Number = AdoConverters.Int(reader, "number");
            obj.State = AdoConverters.Enum(reader, "state", AgentRevisionStateEnum.Draft);
            obj.ContentHash = AdoConverters.Str(reader, "contenthash");
            obj.DisplayName = AdoConverters.NullableStr(reader, "displayname");
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.InputMode = AdoConverters.Enum(reader, "inputmode", AgentInputModeEnum.Text);
            obj.InputSchemaJson = AdoConverters.NullableStr(reader, "inputschemajson");
            obj.OutputSchemaJson = AdoConverters.NullableStr(reader, "outputschemajson");
            obj.DelegationMode = AdoConverters.Enum(reader, "delegationmode", DelegationModeEnum.None);
            obj.DelegationMaxDepth = AdoConverters.Int(reader, "delegationmaxdepth");
            obj.DelegationAllowRecursion = AdoConverters.Bool(reader, "delegationallowrecursion");
            obj.AuthorUserId = AdoConverters.NullableStr(reader, "authoruserid");
            obj.AuthorName = AdoConverters.NullableStr(reader, "authorname");
            obj.ChangeNote = AdoConverters.NullableStr(reader, "changenote");
            obj.PublishedByUserId = AdoConverters.NullableStr(reader, "publishedbyuserid");
            obj.PublishedByName = AdoConverters.NullableStr(reader, "publishedbyname");
            obj.PublishedUtc = AdoConverters.NullableDate(reader, "publishedutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, AgentRevision obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "agentid", obj.AgentId);
            AdoDatabaseDriver.Add(command, "number", obj.Number);
            AdoDatabaseDriver.Add(command, "state", obj.State.ToString());
            AdoDatabaseDriver.Add(command, "contenthash", obj.ContentHash);
            AdoDatabaseDriver.Add(command, "displayname", obj.DisplayName);
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "inputmode", obj.InputMode.ToString());
            AdoDatabaseDriver.Add(command, "inputschemajson", obj.InputSchemaJson);
            AdoDatabaseDriver.Add(command, "outputschemajson", obj.OutputSchemaJson);
            AdoDatabaseDriver.Add(command, "delegationmode", obj.DelegationMode.ToString());
            AdoDatabaseDriver.Add(command, "delegationmaxdepth", obj.DelegationMaxDepth);
            AdoDatabaseDriver.Add(command, "delegationallowrecursion", obj.DelegationAllowRecursion);
            AdoDatabaseDriver.Add(command, "authoruserid", obj.AuthorUserId);
            AdoDatabaseDriver.Add(command, "authorname", obj.AuthorName);
            AdoDatabaseDriver.Add(command, "changenote", obj.ChangeNote);
            AdoDatabaseDriver.Add(command, "publishedbyuserid", obj.PublishedByUserId);
            AdoDatabaseDriver.Add(command, "publishedbyname", obj.PublishedByName);
            AdoDatabaseDriver.Add(command, "publishedutc", obj.PublishedUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private async Task InsertAsync(DbConnection connection, DbTransaction transaction, AgentRevision obj, CancellationToken token)
        {
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), token).ConfigureAwait(false);
            await InsertChildrenAsync(connection, transaction, obj, token).ConfigureAwait(false);
        }

        private async Task<int> NextNumberAsync(DbConnection connection, DbTransaction transaction, string agentId, CancellationToken token)
        {
            List<int> max = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                "SELECT COALESCE(MAX(number), 0) AS maxnumber FROM " + _Table + " WHERE agentid = @agentid;",
                command => AdoDatabaseDriver.Add(command, "agentid", agentId),
                reader => AdoConverters.Int(reader, "maxnumber"), token).ConfigureAwait(false);
            return (max.Count == 0 ? 0 : max[0]) + 1;
        }

        private async Task WriteAgentRowAsync(DbConnection connection, DbTransaction transaction, AgentRevision revision, DateTime now, CancellationToken token)
        {
            string? toolTemplate = revision.PromptPins.FirstOrDefault(p => p.Role == AgentRevisionContent.ToolDescriptionRole)?.TemplateId;
            string? skillTemplate = revision.PromptPins.FirstOrDefault(p => p.Role == AgentRevisionContent.SkillDescriptionRole)?.TemplateId;
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                "UPDATE " + _Agents + " SET displayname = @displayname, description = @description, inputmode = @inputmode, inputschemajson = @inputschemajson, outputschemajson = @outputschemajson, delegationmode = @delegationmode, delegationmaxdepth = @delegationmaxdepth, delegationallowrecursion = @delegationallowrecursion, tooldescriptiontemplateid = @tooltemplate, skilldescriptiontemplateid = @skilltemplate, latestpublishedrevisionid = @revisionid, draftrevisionid = NULL, lastupdateutc = @now WHERE id = @agentid AND tenantid = @tenantid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "displayname", revision.DisplayName);
                    AdoDatabaseDriver.Add(command, "description", revision.Description);
                    AdoDatabaseDriver.Add(command, "inputmode", revision.InputMode.ToString());
                    AdoDatabaseDriver.Add(command, "inputschemajson", revision.InputSchemaJson);
                    AdoDatabaseDriver.Add(command, "outputschemajson", revision.OutputSchemaJson);
                    AdoDatabaseDriver.Add(command, "delegationmode", revision.DelegationMode.ToString());
                    AdoDatabaseDriver.Add(command, "delegationmaxdepth", revision.DelegationMaxDepth);
                    AdoDatabaseDriver.Add(command, "delegationallowrecursion", revision.DelegationAllowRecursion);
                    AdoDatabaseDriver.Add(command, "tooltemplate", toolTemplate);
                    AdoDatabaseDriver.Add(command, "skilltemplate", skillTemplate);
                    AdoDatabaseDriver.Add(command, "revisionid", revision.Id);
                    AdoDatabaseDriver.Add(command, "now", now);
                    AdoDatabaseDriver.Add(command, "agentid", revision.AgentId);
                    AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                }, token).ConfigureAwait(false);

            Action<DbCommand> bindAgent = command => AdoDatabaseDriver.Add(command, "agentid", revision.AgentId);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _AgentTags + " WHERE agentid = @agentid;", bindAgent, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _AgentAllow + " WHERE agentid = @agentid;", bindAgent, token).ConfigureAwait(false);
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < revision.Tags.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _AgentTags + " (id, agentid, tenantid, tag) VALUES (@id, @agentid, @tenantid, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "t" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "agentid", revision.AgentId);
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "value", revision.Tags[position]);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < revision.DelegationAllowList.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _AgentAllow + " (id, agentid, tenantid, agentname) VALUES (@id, @agentid, @tenantid, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "a" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "agentid", revision.AgentId);
                        AdoDatabaseDriver.Add(command, "tenantid", revision.TenantId);
                        AdoDatabaseDriver.Add(command, "value", revision.DelegationAllowList[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task InsertChildrenAsync(DbConnection connection, DbTransaction transaction, AgentRevision obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.PromptPins.Count; i++)
            {
                int position = i;
                AgentRevisionPromptPin pin = obj.PromptPins[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Pins + " (id, revisionid, tenantid, position, role, templateid, pinnedversion) VALUES (@id, @revisionid, @tenantid, @position, @role, @templateid, @pinnedversion);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "p" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "revisionid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "role", pin.Role);
                        AdoDatabaseDriver.Add(command, "templateid", pin.TemplateId);
                        AdoDatabaseDriver.Add(command, "pinnedversion", pin.PinnedVersion);
                    }, token).ConfigureAwait(false);
            }
            for (int i = 0; i < obj.AssetPins.Count; i++)
            {
                int position = i;
                AgentRevisionAssetPin asset = obj.AssetPins[i];
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Assets + " (id, revisionid, tenantid, position, assetid, version) VALUES (@id, @revisionid, @tenantid, @position, @assetid, @version);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "s" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "revisionid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "assetid", asset.AssetId);
                        AdoDatabaseDriver.Add(command, "version", asset.Version);
                    }, token).ConfigureAwait(false);
            }
            await InsertListAsync(connection, transaction, _Allow, "agentname", "a", obj, obj.DelegationAllowList, batch, token).ConfigureAwait(false);
            await InsertListAsync(connection, transaction, _Capabilities, "capability", "c", obj, obj.Capabilities, batch, token).ConfigureAwait(false);
            await InsertListAsync(connection, transaction, _Tags, "tag", "t", obj, obj.Tags, batch, token).ConfigureAwait(false);
        }

        private static async Task InsertListAsync(DbConnection connection, DbTransaction transaction, string table, string column, string marker, AgentRevision obj, List<string> values, string batch, CancellationToken token)
        {
            for (int i = 0; i < values.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + table + " (id, revisionid, tenantid, position, " + column + ") VALUES (@id, @revisionid, @tenantid, @position, @value);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + marker + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "revisionid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "value", values[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task DeleteChildrenAsync(DbConnection connection, DbTransaction transaction, string revisionId, CancellationToken token)
        {
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "id", revisionId);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Pins + " WHERE revisionid = @id;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Assets + " WHERE revisionid = @id;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Allow + " WHERE revisionid = @id;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Capabilities + " WHERE revisionid = @id;", bind, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE revisionid = @id;", bind, token).ConfigureAwait(false);
        }

        private async Task LoadChildrenAsync(List<AgentRevision> revisions, CancellationToken token)
        {
            for (int offset = 0; offset < revisions.Count; offset += 200)
            {
                List<AgentRevision> page = revisions.Skip(offset).Take(200).ToList();
                List<string> names = new List<string>();
                for (int i = 0; i < page.Count; i++) names.Add("@r" + i);
                string inList = " WHERE revisionid IN (" + String.Join(", ", names) + ") ORDER BY revisionid, position ASC;";
                Action<DbCommand> bind = command =>
                {
                    for (int i = 0; i < page.Count; i++) AdoDatabaseDriver.Add(command, "r" + i, page[i].Id);
                };
                List<KeyValuePair<string, AgentRevisionPromptPin>> pins = await _Driver.QueryAsync("SELECT * FROM " + _Pins + inList, bind, reader =>
                {
                    AgentRevisionPromptPin pin = new AgentRevisionPromptPin();
                    pin.Role = AdoConverters.Str(reader, "role");
                    pin.TemplateId = AdoConverters.Str(reader, "templateid");
                    pin.PinnedVersion = AdoConverters.NullableInt(reader, "pinnedversion");
                    return new KeyValuePair<string, AgentRevisionPromptPin>(AdoConverters.Str(reader, "revisionid"), pin);
                }, token).ConfigureAwait(false);
                List<KeyValuePair<string, AgentRevisionAssetPin>> assets = await _Driver.QueryAsync("SELECT * FROM " + _Assets + inList, bind, reader =>
                {
                    AgentRevisionAssetPin pin = new AgentRevisionAssetPin();
                    pin.AssetId = AdoConverters.Str(reader, "assetid");
                    pin.Version = AdoConverters.NullableInt(reader, "version");
                    return new KeyValuePair<string, AgentRevisionAssetPin>(AdoConverters.Str(reader, "revisionid"), pin);
                }, token).ConfigureAwait(false);
                List<KeyValuePair<string, string>> allow = await LoadListAsync(_Allow, "agentname", inList, bind, token).ConfigureAwait(false);
                List<KeyValuePair<string, string>> capabilities = await LoadListAsync(_Capabilities, "capability", inList, bind, token).ConfigureAwait(false);
                List<KeyValuePair<string, string>> tags = await LoadListAsync(_Tags, "tag", inList, bind, token).ConfigureAwait(false);
                foreach (AgentRevision revision in page)
                {
                    revision.PromptPins = pins.Where(p => p.Key == revision.Id).Select(p => p.Value).ToList();
                    revision.AssetPins = assets.Where(p => p.Key == revision.Id).Select(p => p.Value).ToList();
                    revision.DelegationAllowList = allow.Where(p => p.Key == revision.Id).Select(p => p.Value).ToList();
                    revision.Capabilities = capabilities.Where(p => p.Key == revision.Id).Select(p => p.Value).ToList();
                    revision.Tags = tags.Where(p => p.Key == revision.Id).Select(p => p.Value).ToList();
                }
            }
        }

        private Task<List<KeyValuePair<string, string>>> LoadListAsync(string table, string column, string inList, Action<DbCommand> bind, CancellationToken token)
        {
            return _Driver.QueryAsync("SELECT revisionid, " + column + " FROM " + table + inList, bind,
                reader => new KeyValuePair<string, string>(AdoConverters.Str(reader, "revisionid"), AdoConverters.Str(reader, column)), token);
        }

        #endregion
    }
}
