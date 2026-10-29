namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Globalization;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral studio draft data access (AD7.1). Thread-safe.
    /// </summary>
    public class AdoStudioDraftMethods : IStudioDraftMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Drafts;
        private readonly string _Items;
        private readonly string _Layout;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoStudioDraftMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Drafts = driver.Table("studio_drafts");
            _Items = driver.Table("studio_draft_items");
            _Layout = driver.Table("studio_draft_layout");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<StudioDraft> CreateAsync(StudioDraft draft, CancellationToken token = default)
        {
            if (draft == null) throw new ArgumentNullException(nameof(draft));
            draft.CreatedUtc = DateTime.UtcNow;
            draft.LastUpdateUtc = draft.CreatedUtc;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Drafts + " (id, tenantid, title, owneruserid, ownername, conversationid, targetapp, version, status, approvalid, publishonapply, manifestapplyid, createdutc, lastupdateutc) " +
                    "VALUES (@id, @tenantid, @title, @owneruserid, @ownername, @conversationid, @targetapp, @version, @status, @approvalid, @publishonapply, @manifestapplyid, @createdutc, @lastupdateutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", draft.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", draft.TenantId);
                        AdoDatabaseDriver.Add(command, "title", draft.Title);
                        AdoDatabaseDriver.Add(command, "owneruserid", draft.OwnerUserId);
                        AdoDatabaseDriver.Add(command, "ownername", draft.OwnerName);
                        AdoDatabaseDriver.Add(command, "conversationid", draft.ConversationId);
                        AdoDatabaseDriver.Add(command, "targetapp", draft.TargetApp);
                        AdoDatabaseDriver.Add(command, "version", draft.Version);
                        AdoDatabaseDriver.Add(command, "status", draft.Status.ToString());
                        AdoDatabaseDriver.Add(command, "approvalid", draft.ApprovalId);
                        AdoDatabaseDriver.Add(command, "publishonapply", draft.PublishOnApply);
                        AdoDatabaseDriver.Add(command, "manifestapplyid", draft.ManifestApplyId);
                        AdoDatabaseDriver.Add(command, "createdutc", draft.CreatedUtc);
                        AdoDatabaseDriver.Add(command, "lastupdateutc", draft.LastUpdateUtc);
                    }, ct).ConfigureAwait(false);
                foreach (StudioDraftItem item in draft.Items) await UpsertItemAsync(connection, transaction, draft.TenantId, draft.Id, item, ct).ConfigureAwait(false);
                foreach (StudioDraftNode node in draft.Layout) await InsertNodeAsync(connection, transaction, draft.TenantId, draft.Id, node, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return draft;
        }

        /// <inheritdoc />
        public async Task<StudioDraft?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            StudioDraft? draft = await _Driver.QuerySingleAsync("SELECT * FROM " + _Drafts + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (draft == null) return null;
            Action<DbCommand> bind = command => AdoDatabaseDriver.Add(command, "id", draft.Id);
            draft.Items = await _Driver.QueryAsync("SELECT * FROM " + _Items + " WHERE draftid = @id ORDER BY kind ASC, name ASC;", bind, reader => new StudioDraftItem
            {
                Kind = AdoConverters.Str(reader, "kind"),
                Name = AdoConverters.Str(reader, "name"),
                Operation = AdoConverters.Enum(reader, "operation", StudioDraftOperationEnum.Upsert),
                Document = AdoConverters.Str(reader, "document"),
                BaseHash = AdoConverters.NullableStr(reader, "basehash"),
                LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc")
            }, token).ConfigureAwait(false);
            draft.Layout = await _Driver.QueryAsync("SELECT * FROM " + _Layout + " WHERE draftid = @id ORDER BY nodekey ASC;", bind, reader => new StudioDraftNode
            {
                NodeKey = AdoConverters.Str(reader, "nodekey"),
                X = AdoConverters.Double(reader, "x"),
                Y = AdoConverters.Double(reader, "y")
            }, token).ConfigureAwait(false);
            return draft;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<StudioDraft>> EnumerateAsync(string tenantId, string? ownerUserId, EnumerationQuery query, StudioDraftStatusEnum? status = null, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(ownerUserId)) clauses.Add("owneruserid = @owner");
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("title", "search"));
            if (status.HasValue) clauses.Add("status = @status");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(ownerUserId)) AdoDatabaseDriver.Add(command, "owner", ownerUserId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
                if (status.HasValue) AdoDatabaseDriver.Add(command, "status", status.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Drafts + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<StudioDraft> drafts = await _Driver.QueryAsync("SELECT * FROM " + _Drafts + where + " ORDER BY lastupdateutc DESC, id DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            return EnumerationResult<StudioDraft>.Build(query, total, drafts);
        }

        /// <inheritdoc />
        public async Task<bool> PutItemAsync(string tenantId, string draftId, int expectedVersion, StudioDraftItem item, CancellationToken token = default)
        {
            if (item == null) throw new ArgumentNullException(nameof(item));
            bool moved = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                moved = await BumpAsync(connection, transaction, tenantId, draftId, expectedVersion, ct).ConfigureAwait(false);
                if (!moved) return;
                await UpsertItemAsync(connection, transaction, tenantId, draftId, item, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return moved;
        }

        /// <inheritdoc />
        public async Task<bool> RemoveItemAsync(string tenantId, string draftId, int expectedVersion, string kind, string name, CancellationToken token = default)
        {
            bool moved = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                moved = await BumpAsync(connection, transaction, tenantId, draftId, expectedVersion, ct).ConfigureAwait(false);
                if (!moved) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Items + " WHERE draftid = @draft AND kind = @kind AND name = @name;", command =>
                {
                    AdoDatabaseDriver.Add(command, "draft", draftId);
                    AdoDatabaseDriver.Add(command, "kind", kind);
                    AdoDatabaseDriver.Add(command, "name", name);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return moved;
        }

        /// <inheritdoc />
        public async Task<bool> SetLayoutAsync(string tenantId, string draftId, int expectedVersion, List<StudioDraftNode> nodes, CancellationToken token = default)
        {
            if (nodes == null) throw new ArgumentNullException(nameof(nodes));
            bool moved = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                moved = await BumpAsync(connection, transaction, tenantId, draftId, expectedVersion, ct).ConfigureAwait(false);
                if (!moved) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Layout + " WHERE draftid = @draft;", command => AdoDatabaseDriver.Add(command, "draft", draftId), ct).ConfigureAwait(false);
                foreach (StudioDraftNode node in nodes) await InsertNodeAsync(connection, transaction, tenantId, draftId, node, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return moved;
        }

        /// <inheritdoc />
        public async Task<bool> TransitionAsync(string tenantId, string draftId, int expectedVersion, StudioDraftStatusEnum from, StudioDraftStatusEnum to, string? approvalId, string? manifestApplyId, CancellationToken token = default)
        {
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Drafts + " SET version = version + 1, status = @to, approvalid = @approval, manifestapplyid = COALESCE(@applyid, manifestapplyid), lastupdateutc = @now " +
                "WHERE id = @id AND tenantid = @tenantid AND version = @expected AND status = @from;", command =>
            {
                AdoDatabaseDriver.Add(command, "to", to.ToString());
                AdoDatabaseDriver.Add(command, "from", from.ToString());
                AdoDatabaseDriver.Add(command, "approval", approvalId);
                AdoDatabaseDriver.Add(command, "applyid", manifestApplyId);
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                AdoDatabaseDriver.Add(command, "id", draftId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "expected", expectedVersion);
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<bool> LinkConversationAsync(string tenantId, string draftId, string conversationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(conversationId)) throw new ArgumentNullException(nameof(conversationId));
            int affected = await _Driver.NonQueryAsync("UPDATE " + _Drafts + " SET conversationid = @conversation WHERE id = @id AND tenantid = @tenantid AND conversationid IS NULL;", command =>
            {
                AdoDatabaseDriver.Add(command, "conversation", conversationId);
                AdoDatabaseDriver.Add(command, "id", draftId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        /// <inheritdoc />
        public async Task<StudioDraft?> ReadByConversationAsync(string tenantId, string conversationId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(conversationId)) return null;
            return await _Driver.QuerySingleAsync("SELECT * FROM " + _Drafts + " WHERE tenantid = @tenantid AND conversationid = @conversation ORDER BY lastupdateutc DESC" + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "conversation", conversationId);
                AdoDatabaseDriver.Add(command, "max", 1);
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            int deleted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                deleted = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Drafts + " WHERE id = @id AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "id", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
                if (deleted == 0) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Items + " WHERE draftid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Layout + " WHERE draftid = @id;", command => AdoDatabaseDriver.Add(command, "id", id), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return deleted > 0;
        }

        #endregion

        #region Private-Methods

        private async Task<bool> BumpAsync(DbConnection connection, DbTransaction transaction, string tenantId, string draftId, int expectedVersion, CancellationToken token)
        {
            int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Drafts + " SET version = version + 1, lastupdateutc = @now WHERE id = @id AND tenantid = @tenantid AND version = @expected AND status = @open;", command =>
            {
                AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                AdoDatabaseDriver.Add(command, "id", draftId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "expected", expectedVersion);
                AdoDatabaseDriver.Add(command, "open", StudioDraftStatusEnum.Open.ToString());
            }, token).ConfigureAwait(false);
            return affected == 1;
        }

        private async Task UpsertItemAsync(DbConnection connection, DbTransaction transaction, string tenantId, string draftId, StudioDraftItem item, CancellationToken token)
        {
            item.LastUpdateUtc = DateTime.UtcNow;
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Items + " WHERE draftid = @draft AND kind = @kind AND name = @name;", command =>
            {
                AdoDatabaseDriver.Add(command, "draft", draftId);
                AdoDatabaseDriver.Add(command, "kind", item.Kind);
                AdoDatabaseDriver.Add(command, "name", item.Name);
            }, token).ConfigureAwait(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                "INSERT INTO " + _Items + " (id, tenantid, draftid, kind, name, operation, document, basehash, lastupdateutc) VALUES (@id, @tenantid, @draft, @kind, @name, @operation, @document, @basehash, @now);", command =>
            {
                AdoDatabaseDriver.Add(command, "id", IdGenerator.New("sdi_"));
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "draft", draftId);
                AdoDatabaseDriver.Add(command, "kind", item.Kind);
                AdoDatabaseDriver.Add(command, "name", item.Name);
                AdoDatabaseDriver.Add(command, "operation", item.Operation.ToString());
                AdoDatabaseDriver.Add(command, "document", item.Document);
                AdoDatabaseDriver.Add(command, "basehash", item.BaseHash);
                AdoDatabaseDriver.Add(command, "now", item.LastUpdateUtc);
            }, token).ConfigureAwait(false);
        }

        private async Task InsertNodeAsync(DbConnection connection, DbTransaction transaction, string tenantId, string draftId, StudioDraftNode node, CancellationToken token)
        {
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Layout + " (id, tenantid, draftid, nodekey, x, y) VALUES (@id, @tenantid, @draft, @key, @x, @y);", command =>
            {
                AdoDatabaseDriver.Add(command, "id", IdGenerator.New("sdl_"));
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "draft", draftId);
                AdoDatabaseDriver.Add(command, "key", node.NodeKey);
                AdoDatabaseDriver.Add(command, "x", node.X);
                AdoDatabaseDriver.Add(command, "y", node.Y);
            }, token).ConfigureAwait(false);
        }

        private static StudioDraft Map(DbDataReader reader)
        {
            StudioDraft draft = new StudioDraft();
            draft.Id = AdoConverters.Str(reader, "id");
            draft.TenantId = AdoConverters.Str(reader, "tenantid");
            draft.Title = AdoConverters.Str(reader, "title");
            draft.OwnerUserId = AdoConverters.NullableStr(reader, "owneruserid");
            draft.OwnerName = AdoConverters.NullableStr(reader, "ownername");
            draft.ConversationId = AdoConverters.NullableStr(reader, "conversationid");
            draft.TargetApp = AdoConverters.NullableStr(reader, "targetapp");
            draft.Version = AdoConverters.Int(reader, "version");
            draft.Status = AdoConverters.Enum(reader, "status", StudioDraftStatusEnum.Open);
            draft.ApprovalId = AdoConverters.NullableStr(reader, "approvalid");
            draft.PublishOnApply = AdoConverters.Bool(reader, "publishonapply");
            draft.ManifestApplyId = AdoConverters.NullableStr(reader, "manifestapplyid");
            draft.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            draft.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return draft;
        }

        #endregion
    }
}
