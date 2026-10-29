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

    /// <summary>
    /// Provider-neutral agent asset data access (AD2). Versions and their files are written in one transaction with the
    /// asset's current version. Database-held content is content-addressed by storage key. Thread-safe.
    /// </summary>
    public class AdoAgentAssetMethods : IAgentAssetMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Tags;
        private readonly string _Versions;
        private readonly string _Files;
        private readonly string _Blobs;
        private readonly string _Pins;
        private readonly string _Revisions;
        private readonly string _Agents;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoAgentAssetMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("agent_assets");
            _Tags = driver.Table("agent_asset_tags");
            _Versions = driver.Table("agent_asset_versions");
            _Files = driver.Table("agent_asset_version_files");
            _Blobs = driver.Table("agent_asset_blobs");
            _Pins = driver.Table("agent_revision_asset_pins");
            _Revisions = driver.Table("agent_revisions");
            _Agents = driver.Table("agents");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<AgentAsset> CreateAsync(AgentAsset obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.CreatedUtc = DateTime.UtcNow;
            obj.LastUpdateUtc = obj.CreatedUtc;
            obj.CurrentVersion = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Table + " (id, tenantid, name, kind, description, prompttemplateid, artifactstoreid, currentversion, createdutc, lastupdateutc) VALUES (@id, @tenantid, @name, @kind, @description, @prompttemplateid, @artifactstoreid, @currentversion, @createdutc, @lastupdateutc);",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentAsset?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            AgentAsset? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadTagsAsync(new List<AgentAsset> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentAsset?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(nameof(name));
            AgentAsset? obj = await _Driver.QuerySingleAsync("SELECT * FROM " + _Table + " WHERE name = @name AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "name", name);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, Map, token).ConfigureAwait(false);
            if (obj != null) await LoadTagsAsync(new List<AgentAsset> { obj }, token).ConfigureAwait(false);
            return obj;
        }

        /// <inheritdoc />
        public async Task<AgentAsset> UpdateAsync(AgentAsset obj, CancellationToken token = default)
        {
            if (obj == null) throw new ArgumentNullException(nameof(obj));
            obj.LastUpdateUtc = DateTime.UtcNow;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET name = @name, description = @description, prompttemplateid = @prompttemplateid, artifactstoreid = @artifactstoreid, lastupdateutc = @lastupdateutc WHERE id = @id AND tenantid = @tenantid;",
                    command => Bind(command, obj), ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE assetid = @id;", command => AdoDatabaseDriver.Add(command, "id", obj.Id), ct).ConfigureAwait(false);
                await InsertTagsAsync(connection, transaction, obj, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
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
                string versions = "SELECT id FROM " + _Versions + " WHERE assetid = @id AND tenantid = @tenantid";
                // Content-addressed blobs of this asset carry its identifier in their key.
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Blobs + " WHERE tenantid = @tenantid AND storagekey IN (SELECT storagekey FROM " + _Files + " WHERE versionid IN (" + versions + "));", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Files + " WHERE versionid IN (" + versions + ");", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Versions + " WHERE assetid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Tags + " WHERE assetid = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Table + " WHERE id = @id AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<AgentAsset>> EnumerateAsync(string tenantId, AgentAssetKindEnum? kind, EnumerationQuery query, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenantid" };
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            if (kind.HasValue) clauses.Add("kind = @kind");
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
                if (kind.HasValue) AdoDatabaseDriver.Add(command, "kind", kind.Value.ToString());
            };
            object? countValue = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            long total = countValue == null ? 0 : Convert.ToInt64(countValue, CultureInfo.InvariantCulture);
            List<AgentAsset> objects = await _Driver.QueryAsync("SELECT * FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";", command =>
            {
                bind(command);
                AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                AdoDatabaseDriver.Add(command, "skip", query.Skip);
            }, Map, token).ConfigureAwait(false);
            await LoadTagsAsync(objects, token).ConfigureAwait(false);
            return EnumerationResult<AgentAsset>.Build(query, total, objects);
        }

        /// <inheritdoc />
        public async Task<AgentAssetVersion> CreateVersionAsync(AgentAssetVersion version, Dictionary<string, byte[]>? databaseContent, CancellationToken token = default)
        {
            if (version == null) throw new ArgumentNullException(nameof(version));
            version.CreatedUtc = DateTime.UtcNow;
            version.TotalBytes = version.Files.Sum(f => f.SizeBytes);
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<int> max = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT COALESCE(MAX(number), 0) AS maxnumber FROM " + _Versions + " WHERE assetid = @assetid;",
                    command => AdoDatabaseDriver.Add(command, "assetid", version.AssetId),
                    reader => AdoConverters.Int(reader, "maxnumber"), ct).ConfigureAwait(false);
                version.Number = (max.Count == 0 ? 0 : max[0]) + 1;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Versions + " (id, tenantid, assetid, number, totalbytes, authorname, changenote, createdutc) VALUES (@id, @tenantid, @assetid, @number, @totalbytes, @authorname, @changenote, @createdutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", version.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", version.TenantId);
                        AdoDatabaseDriver.Add(command, "assetid", version.AssetId);
                        AdoDatabaseDriver.Add(command, "number", version.Number);
                        AdoDatabaseDriver.Add(command, "totalbytes", version.TotalBytes);
                        AdoDatabaseDriver.Add(command, "authorname", version.AuthorName);
                        AdoDatabaseDriver.Add(command, "changenote", version.ChangeNote);
                        AdoDatabaseDriver.Add(command, "createdutc", version.CreatedUtc);
                    }, ct).ConfigureAwait(false);
                string batch = IdGenerator.NewChildRowId() + "_";
                for (int i = 0; i < version.Files.Count; i++)
                {
                    int position = i;
                    AgentAssetFile file = version.Files[i];
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Files + " (id, versionid, tenantid, path, mediatype, sizebytes, sha256, storagekey) VALUES (@id, @versionid, @tenantid, @path, @mediatype, @sizebytes, @sha256, @storagekey);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", batch + "f" + position.ToString("D4", CultureInfo.InvariantCulture));
                            AdoDatabaseDriver.Add(command, "versionid", version.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", version.TenantId);
                            AdoDatabaseDriver.Add(command, "path", file.Path);
                            AdoDatabaseDriver.Add(command, "mediatype", file.MediaType);
                            AdoDatabaseDriver.Add(command, "sizebytes", file.SizeBytes);
                            AdoDatabaseDriver.Add(command, "sha256", file.Sha256);
                            AdoDatabaseDriver.Add(command, "storagekey", file.StorageKey);
                        }, ct).ConfigureAwait(false);
                }
                if (databaseContent != null)
                {
                    foreach (KeyValuePair<string, byte[]> blob in databaseContent)
                    {
                        List<int> exists = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                            "SELECT 1 AS present FROM " + _Blobs + " WHERE storagekey = @key;",
                            command => AdoDatabaseDriver.Add(command, "key", blob.Key),
                            reader => AdoConverters.Int(reader, "present"), ct).ConfigureAwait(false);
                        if (exists.Count > 0) continue;
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                            "INSERT INTO " + _Blobs + " (storagekey, tenantid, sizebytes, content, createdutc) VALUES (@key, @tenantid, @sizebytes, @content, @createdutc);",
                            command =>
                            {
                                AdoDatabaseDriver.Add(command, "key", blob.Key);
                                AdoDatabaseDriver.Add(command, "tenantid", version.TenantId);
                                AdoDatabaseDriver.Add(command, "sizebytes", (long)blob.Value.Length);
                                AdoDatabaseDriver.Add(command, "content", blob.Value);
                                AdoDatabaseDriver.Add(command, "createdutc", version.CreatedUtc);
                            }, ct).ConfigureAwait(false);
                    }
                }
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Table + " SET currentversion = @number, lastupdateutc = @now WHERE id = @assetid AND tenantid = @tenantid;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "number", version.Number);
                        AdoDatabaseDriver.Add(command, "now", version.CreatedUtc);
                        AdoDatabaseDriver.Add(command, "assetid", version.AssetId);
                        AdoDatabaseDriver.Add(command, "tenantid", version.TenantId);
                    }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return version;
        }

        /// <inheritdoc />
        public async Task<AgentAssetVersion?> ReadVersionAsync(string tenantId, string assetId, int number, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(assetId)) throw new ArgumentNullException(nameof(assetId));
            AgentAssetVersion? version = await _Driver.QuerySingleAsync("SELECT * FROM " + _Versions + " WHERE assetid = @assetid AND number = @number AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "assetid", assetId);
                AdoDatabaseDriver.Add(command, "number", number);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapVersion, token).ConfigureAwait(false);
            if (version != null) await LoadFilesAsync(new List<AgentAssetVersion> { version }, token).ConfigureAwait(false);
            return version;
        }

        /// <inheritdoc />
        public async Task<List<AgentAssetVersion>> ListVersionsAsync(string tenantId, string assetId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(assetId)) throw new ArgumentNullException(nameof(assetId));
            List<AgentAssetVersion> versions = await _Driver.QueryAsync("SELECT * FROM " + _Versions + " WHERE assetid = @assetid AND tenantid = @tenantid ORDER BY number DESC;", command =>
            {
                AdoDatabaseDriver.Add(command, "assetid", assetId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapVersion, token).ConfigureAwait(false);
            await LoadFilesAsync(versions, token).ConfigureAwait(false);
            return versions;
        }

        /// <inheritdoc />
        public async Task<byte[]?> ReadContentAsync(string tenantId, string storageKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(storageKey)) throw new ArgumentNullException(nameof(storageKey));
            List<byte[]> rows = await _Driver.QueryAsync("SELECT content FROM " + _Blobs + " WHERE storagekey = @key AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "key", storageKey);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, reader => (byte[])reader["content"], token).ConfigureAwait(false);
            return rows.Count == 0 ? null : rows[0];
        }

        /// <inheritdoc />
        public Task<List<string>> AgentsPinningAsync(string tenantId, string assetId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(assetId)) throw new ArgumentNullException(nameof(assetId));
            return _Driver.QueryAsync(
                "SELECT DISTINCT a.name AS name FROM " + _Pins + " p INNER JOIN " + _Revisions + " r ON r.id = p.revisionid INNER JOIN " + _Agents + " a ON a.id = r.agentid WHERE p.tenantid = @tenantid AND p.assetid = @assetid ORDER BY a.name;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    AdoDatabaseDriver.Add(command, "assetid", assetId);
                },
                reader => AdoConverters.Str(reader, "name"), token);
        }

        /// <summary>
        /// Map an asset row (tags not loaded).
        /// </summary>
        /// <param name="reader">Reader positioned on a row.</param>
        /// <returns>Asset.</returns>
        public static AgentAsset Map(DbDataReader reader)
        {
            AgentAsset obj = new AgentAsset();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.Name = AdoConverters.Str(reader, "name");
            obj.Kind = AdoConverters.Enum(reader, "kind", AgentAssetKindEnum.ReferenceFile);
            obj.Description = AdoConverters.NullableStr(reader, "description");
            obj.PromptTemplateId = AdoConverters.NullableStr(reader, "prompttemplateid");
            obj.ArtifactStoreId = AdoConverters.NullableStr(reader, "artifactstoreid");
            obj.CurrentVersion = AdoConverters.Int(reader, "currentversion");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        #endregion

        #region Private-Methods

        private static void Bind(DbCommand command, AgentAsset obj)
        {
            AdoDatabaseDriver.Add(command, "id", obj.Id);
            AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
            AdoDatabaseDriver.Add(command, "name", obj.Name);
            AdoDatabaseDriver.Add(command, "kind", obj.Kind.ToString());
            AdoDatabaseDriver.Add(command, "description", obj.Description);
            AdoDatabaseDriver.Add(command, "prompttemplateid", String.IsNullOrEmpty(obj.PromptTemplateId) ? null : obj.PromptTemplateId);
            AdoDatabaseDriver.Add(command, "artifactstoreid", String.IsNullOrEmpty(obj.ArtifactStoreId) ? null : obj.ArtifactStoreId);
            AdoDatabaseDriver.Add(command, "currentversion", obj.CurrentVersion);
            AdoDatabaseDriver.Add(command, "createdutc", obj.CreatedUtc);
            AdoDatabaseDriver.Add(command, "lastupdateutc", obj.LastUpdateUtc);
        }

        private static AgentAssetVersion MapVersion(DbDataReader reader)
        {
            AgentAssetVersion obj = new AgentAssetVersion();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.AssetId = AdoConverters.Str(reader, "assetid");
            obj.Number = AdoConverters.Int(reader, "number");
            obj.TotalBytes = AdoConverters.Long(reader, "totalbytes");
            obj.AuthorName = AdoConverters.NullableStr(reader, "authorname");
            obj.ChangeNote = AdoConverters.NullableStr(reader, "changenote");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        private async Task InsertTagsAsync(DbConnection connection, DbTransaction transaction, AgentAsset obj, CancellationToken token)
        {
            string batch = IdGenerator.NewChildRowId() + "_";
            for (int i = 0; i < obj.Tags.Count; i++)
            {
                int position = i;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Tags + " (id, assetid, tenantid, position, tag) VALUES (@id, @assetid, @tenantid, @position, @tag);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", batch + "t" + position.ToString("D4", CultureInfo.InvariantCulture));
                        AdoDatabaseDriver.Add(command, "assetid", obj.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", obj.TenantId);
                        AdoDatabaseDriver.Add(command, "position", position);
                        AdoDatabaseDriver.Add(command, "tag", obj.Tags[position]);
                    }, token).ConfigureAwait(false);
            }
        }

        private async Task LoadTagsAsync(List<AgentAsset> assets, CancellationToken token)
        {
            foreach (AgentAsset asset in assets)
            {
                asset.Tags = await _Driver.QueryAsync("SELECT tag FROM " + _Tags + " WHERE assetid = @id ORDER BY position ASC;",
                    command => AdoDatabaseDriver.Add(command, "id", asset.Id),
                    reader => AdoConverters.Str(reader, "tag"), token).ConfigureAwait(false);
            }
        }

        private async Task LoadFilesAsync(List<AgentAssetVersion> versions, CancellationToken token)
        {
            foreach (AgentAssetVersion version in versions)
            {
                version.Files = await _Driver.QueryAsync("SELECT * FROM " + _Files + " WHERE versionid = @id ORDER BY path ASC;",
                    command => AdoDatabaseDriver.Add(command, "id", version.Id),
                    reader => new AgentAssetFile
                    {
                        Path = AdoConverters.Str(reader, "path"),
                        MediaType = AdoConverters.Str(reader, "mediatype"),
                        SizeBytes = AdoConverters.Long(reader, "sizebytes"),
                        Sha256 = AdoConverters.Str(reader, "sha256"),
                        StorageKey = AdoConverters.Str(reader, "storagekey")
                    }, token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
