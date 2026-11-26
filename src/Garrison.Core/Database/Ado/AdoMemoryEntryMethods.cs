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
    /// Provider-neutral scoped memory metadata access (AA4). Thread-safe.
    /// </summary>
    public class AdoMemoryEntryMethods : IMemoryEntryMethods
    {
        #region Private-Members

        private static readonly string _Columns = "id, tenantid, scopekind, scopeid, memorykey, keyhash, legacy, category, bytes, sha256, contentid, version, writeragentid, writerrunid, writerprincipaltype, writerprincipalid, writername, lastreadutc, expiresutc, createdutc, lastupdateutc";

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Tags;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoMemoryEntryMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("memory_entries");
            _Tags = driver.Table("memory_entry_tags");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<MemoryEntry> CreateAsync(MemoryEntry obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            string values = "@" + String.Join(", @", _Columns.Split(", "));
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Table + " (" + _Columns + ") VALUES (" + values + ");", command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<MemoryEntry?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            MemoryEntry? entry = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (entry != null) await LoadTagsAsync(new List<MemoryEntry> { entry }, token).ConfigureAwait(false);
            return entry;
        }

        /// <inheritdoc />
        public async Task<MemoryEntry?> ReadByKeyAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string key, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(key)) throw new ArgumentNullException(nameof(key));
            return await ReadInScopeAsync(tenantId, scopeKind, scopeId, "memorykey", key, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<MemoryEntry?> ReadByKeyHashAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string keyHash, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(keyHash)) throw new ArgumentNullException(nameof(keyHash));
            return await ReadInScopeAsync(tenantId, scopeKind, scopeId, "keyhash", keyHash, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<MemoryEntry>> EnumerateAsync(MemoryEntryFilter filter, CancellationToken token = default)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            if (String.IsNullOrEmpty(filter.TenantId)) throw new ArgumentNullException(nameof(filter.TenantId));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (filter.ScopeKind.HasValue) clauses.Add("scopekind = @scopekind");
            if (!String.IsNullOrEmpty(filter.ScopeId)) clauses.Add("scopeid = @scopeid");
            if (!String.IsNullOrEmpty(filter.Category)) clauses.Add("category = @category");
            if (!String.IsNullOrEmpty(filter.WriterAgentId)) clauses.Add("writeragentid = @writeragentid");
            if (!String.IsNullOrEmpty(filter.KeyPrefix)) clauses.Add("SUBSTR(memorykey, 1, @prefixlength) = @keyprefix");
            if (!String.IsNullOrEmpty(filter.Tag)) clauses.Add("id IN (SELECT entryid FROM " + _Tags + " WHERE tenantid = @tenantid AND tag = @tag)");
            if (!String.IsNullOrEmpty(filter.Search))
            {
                clauses.Add("(" + _Driver.Dialect.CaseInsensitiveLike("memorykey", "search")
                    + " OR " + _Driver.Dialect.CaseInsensitiveLike("category", "search")
                    + " OR id IN (SELECT entryid FROM " + _Tags + " WHERE tenantid = @tenantid AND " + _Driver.Dialect.CaseInsensitiveLike("tag", "search") + "))");
            }
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", filter.TenantId);
                if (filter.ScopeKind.HasValue) AdoDatabaseDriver.Add(command, "scopekind", filter.ScopeKind.Value.ToString());
                if (!String.IsNullOrEmpty(filter.ScopeId)) AdoDatabaseDriver.Add(command, "scopeid", filter.ScopeId);
                if (!String.IsNullOrEmpty(filter.Category)) AdoDatabaseDriver.Add(command, "category", filter.Category);
                if (!String.IsNullOrEmpty(filter.WriterAgentId)) AdoDatabaseDriver.Add(command, "writeragentid", filter.WriterAgentId);
                if (!String.IsNullOrEmpty(filter.KeyPrefix))
                {
                    AdoDatabaseDriver.Add(command, "prefixlength", filter.KeyPrefix.Length);
                    AdoDatabaseDriver.Add(command, "keyprefix", filter.KeyPrefix);
                }
                if (!String.IsNullOrEmpty(filter.Tag)) AdoDatabaseDriver.Add(command, "tag", filter.Tag.Trim().ToLowerInvariant());
                if (!String.IsNullOrEmpty(filter.Search)) AdoDatabaseDriver.Add(command, "search", "%" + filter.Search + "%");
            };
            EnumerationQuery query = new EnumerationQuery { MaxResults = filter.MaxResults, Skip = Math.Max(0, filter.Skip) };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue);
            List<MemoryEntry> objects = await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + where + " ORDER BY scopekind, scopeid, memorykey" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            await LoadTagsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<MemoryEntry>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<long> CountInScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(scopeId)) throw new ArgumentNullException(nameof(scopeId));
            object? value = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + " WHERE tenantid = @tenantid AND scopekind = @scopekind AND scopeid = @scopeid;",
                command => BindScope(command, tenantId, scopeKind, scopeId), token).ConfigureAwait(false);
            return value == null ? 0 : Convert.ToInt64(value);
        }

        /// <inheritdoc />
        public async Task<bool> TryUpdateAsync(MemoryEntry obj, long expectedVersion, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            bool updated = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET memorykey = @memorykey, keyhash = @keyhash, legacy = @legacy, category = @category, bytes = @bytes, sha256 = @sha256, contentid = @contentid, version = @version, "
                    + "writeragentid = @writeragentid, writerrunid = @writerrunid, writerprincipaltype = @writerprincipaltype, writerprincipalid = @writerprincipalid, writername = @writername, "
                    + "lastreadutc = @lastreadutc, expiresutc = @expiresutc, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid AND version = @expectedversion;",
                    command =>
                    {
                        Bind(command, obj);
                        AdoDatabaseDriver.Add(command, "expectedversion", expectedVersion);
                    }, ct).ConfigureAwait(false);
                updated = affected > 0;
                if (!updated) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE entryid = @entryid AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "entryid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                }, ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return updated;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, long? expectedVersion, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            bool deleted = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                int affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid" + (expectedVersion.HasValue ? " AND version = @expectedversion" : String.Empty) + ";",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        if (expectedVersion.HasValue) AdoDatabaseDriver.Add(command, "expectedversion", expectedVersion.Value);
                    }, ct).ConfigureAwait(false);
                deleted = affected > 0;
                if (!deleted) return;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE entryid = @entryid AND tenantid = @tenantid;", command =>
                {
                    AdoDatabaseDriver.Add(command, "entryid", id);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return deleted;
        }

        /// <inheritdoc />
        public async Task<int> DeleteScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(scopeId)) throw new ArgumentNullException(nameof(scopeId));
            int deleted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "DELETE FROM " + _Tags + " WHERE tenantid = @tenantid AND entryid IN (SELECT id FROM " + _Table + " WHERE tenantid = @tenantid AND scopekind = @scopekind AND scopeid = @scopeid);",
                    command => BindScope(command, tenantId, scopeKind, scopeId), ct).ConfigureAwait(false);
                deleted = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "DELETE FROM " + _Table + " WHERE tenantid = @tenantid AND scopekind = @scopekind AND scopeid = @scopeid;",
                    command => BindScope(command, tenantId, scopeKind, scopeId), ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return deleted;
        }

        /// <inheritdoc />
        public async Task<List<MemoryScopeSummary>> ListScopesAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            return await _Driver.QueryAsync(
                "SELECT scopekind, scopeid, COUNT(*) AS entrycount, SUM(bytes) AS totalbytes, MAX(lastupdateutc) AS latest FROM " + _Table
                + " WHERE tenantid = @tenantid GROUP BY scopekind, scopeid ORDER BY scopekind, scopeid;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId),
                reader => new MemoryScopeSummary
                {
                    ScopeKind = AdoConverters.Enum<MemoryScopeKindEnum>(reader, "scopekind", MemoryScopeKindEnum.Agent),
                    ScopeId = AdoConverters.Str(reader, "scopeid"),
                    EntryCount = AdoConverters.Long(reader, "entrycount"),
                    Bytes = AdoConverters.NullableLong(reader, "totalbytes") ?? 0,
                    LastUpdateUtc = AdoConverters.Date(reader, "latest")
                }, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<HashSet<string>> ListContentIdsAsync(string tenantId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            List<string> ids = await _Driver.QueryAsync("SELECT contentid FROM " + _Table + " WHERE tenantid = @tenantid;",
                command => AdoDatabaseDriver.Add(command, "tenantid", tenantId),
                reader => AdoConverters.Str(reader, "contentid"), token).ConfigureAwait(false);
            return new HashSet<string>(ids, StringComparer.Ordinal);
        }

        /// <inheritdoc />
        public async Task<List<MemoryEntry>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default)
        {
            return await _Driver.QueryAsync(
                "SELECT * FROM " + _Table + " WHERE expiresutc IS NOT NULL AND expiresutc <= @now ORDER BY expiresutc ASC, id ASC" + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "now", nowUtc);
                    AdoDatabaseDriver.Add(command, "max", Math.Max(1, limit));
                    AdoDatabaseDriver.Add(command, "skip", 0);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<int> TouchReadAsync(string tenantId, IReadOnlyCollection<string> ids, DateTime readUtc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (ids == null) throw new ArgumentNullException(nameof(ids));
            if (ids.Count == 0) return 0;
            List<string> list = ids.ToList();
            List<string> names = new List<string>();
            for (int i = 0; i < list.Count; i++) names.Add("@e" + i);
            return await _Driver.NonQueryAsync(
                "UPDATE " + _Table + " SET lastreadutc = @readutc WHERE tenantid = @tenantid AND id IN (" + String.Join(", ", names) + ");",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "readutc", readUtc);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    for (int i = 0; i < list.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, list[i]);
                }, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Map a memory_entries row. Tags are loaded separately.
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Entry.</returns>
        public static MemoryEntry Map(DbDataReader reader)
        {
            MemoryEntry obj = new MemoryEntry();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.ScopeKind = AdoConverters.Enum<MemoryScopeKindEnum>(reader, "scopekind", MemoryScopeKindEnum.Agent);
            obj.ScopeId = AdoConverters.Str(reader, "scopeid");
            obj.Key = AdoConverters.Str(reader, "memorykey");
            obj.KeyHash = AdoConverters.Str(reader, "keyhash");
            obj.Legacy = AdoConverters.Bool(reader, "legacy");
            obj.Category = AdoConverters.NullableStr(reader, "category");
            obj.Bytes = AdoConverters.Long(reader, "bytes");
            obj.Sha256 = AdoConverters.Str(reader, "sha256");
            obj.ContentId = AdoConverters.Str(reader, "contentid");
            obj.Version = AdoConverters.Long(reader, "version");
            obj.WriterAgentId = AdoConverters.NullableStr(reader, "writeragentid");
            obj.WriterRunId = AdoConverters.NullableStr(reader, "writerrunid");
            obj.WriterPrincipalType = AdoConverters.NullableEnum<PrincipalTypeEnum>(reader, "writerprincipaltype");
            obj.WriterPrincipalId = AdoConverters.NullableStr(reader, "writerprincipalid");
            obj.WriterName = AdoConverters.NullableStr(reader, "writername");
            obj.LastReadUtc = AdoConverters.NullableDate(reader, "lastreadutc");
            obj.ExpiresUtc = AdoConverters.NullableDate(reader, "expiresutc");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private async Task<MemoryEntry?> ReadInScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string column, string value, CancellationToken token)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(scopeId)) throw new ArgumentNullException(nameof(scopeId));
            MemoryEntry? entry = await _Driver.QuerySingleAsync(
                "SELECT * FROM " + _Table + " WHERE tenantid = @tenantid AND scopekind = @scopekind AND scopeid = @scopeid AND " + column + " = @value;",
                command =>
                {
                    BindScope(command, tenantId, scopeKind, scopeId);
                    AdoDatabaseDriver.Add(command, "value", value);
                }, Map, token).ConfigureAwait(false);
            if (entry != null) await LoadTagsAsync(new List<MemoryEntry> { entry }, token).ConfigureAwait(false);
            return entry;
        }

        private async Task InsertTagsAsync(DbConnection connection, DbTransaction transaction, MemoryEntry obj, CancellationToken token)
        {
            foreach (string tag in obj.Tags.Distinct(StringComparer.Ordinal))
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "INSERT INTO " + _Tags + " (entryid, tenantid, tag) VALUES (@entryid, @tenantid, @tag);", command =>
                {
                    AdoDatabaseDriver.Add(command, "entryid", obj.Id);
                    AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                    AdoDatabaseDriver.Add(command, "tag", tag);
                }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadTagsAsync(List<MemoryEntry> entries, CancellationToken token)
        {
            if (entries.Count == 0) return;
            Dictionary<string, MemoryEntry> byId = entries.ToDictionary(e => e.Id, StringComparer.Ordinal);
            List<string> names = new List<string>();
            for (int i = 0; i < entries.Count; i++) names.Add("@e" + i);
            List<MemoryEntryTag> rows = await _Driver.QueryAsync(
                "SELECT entryid, tenantid, tag FROM " + _Tags + " WHERE tenantid = @tenantid AND entryid IN (" + String.Join(", ", names) + ") ORDER BY entryid, tag;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", entries[0].TenantId);
                    for (int i = 0; i < entries.Count; i++) AdoDatabaseDriver.Add(command, "e" + i, entries[i].Id);
                },
                reader => new MemoryEntryTag
                {
                    EntryId = AdoConverters.Str(reader, "entryid"),
                    TenantId = AdoConverters.Str(reader, "tenantid"),
                    Tag = AdoConverters.Str(reader, "tag")
                },
                token).ConfigureAwait(false);
            foreach (MemoryEntryTag row in rows)
            {
                if (byId.TryGetValue(row.EntryId, out MemoryEntry? entry)) entry.Tags.Add(row.Tag);
            }
        }

        private static void BindScope(DbCommand command, string tenantId, MemoryScopeKindEnum scopeKind, string scopeId)
        {
            AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            AdoDatabaseDriver.Add(command, "scopekind", scopeKind.ToString());
            AdoDatabaseDriver.Add(command, "scopeid", scopeId);
        }

        private static void Bind(DbCommand command, MemoryEntry obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "scopekind", obj.ScopeKind.ToString());
            AdoDatabaseDriver.Add(command, "scopeid", obj.ScopeId);
            AdoDatabaseDriver.Add(command, "memorykey", obj.Key);
            AdoDatabaseDriver.Add(command, "keyhash", obj.KeyHash);
            AdoDatabaseDriver.Add(command, "legacy", obj.Legacy);
            AdoDatabaseDriver.Add(command, "category", obj.Category);
            AdoDatabaseDriver.Add(command, "bytes", obj.Bytes);
            AdoDatabaseDriver.Add(command, "sha256", obj.Sha256);
            AdoDatabaseDriver.Add(command, "contentid", obj.ContentId);
            AdoDatabaseDriver.Add(command, "version", obj.Version);
            AdoDatabaseDriver.Add(command, "writeragentid", obj.WriterAgentId);
            AdoDatabaseDriver.Add(command, "writerrunid", obj.WriterRunId);
            AdoDatabaseDriver.Add(command, "writerprincipaltype", obj.WriterPrincipalType?.ToString());
            AdoDatabaseDriver.Add(command, "writerprincipalid", obj.WriterPrincipalId);
            AdoDatabaseDriver.Add(command, "writername", obj.WriterName);
            AdoDatabaseDriver.Add(command, "lastreadutc", obj.LastReadUtc);
            AdoDatabaseDriver.Add(command, "expiresutc", obj.ExpiresUtc);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        #endregion
    }
}
