namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Models;

    /// <summary>
    /// Provider-neutral conversation file space data access (AD3). A commit checks the base version, writes the version,
    /// the file row, the space's counts, and database-held content in one transaction. Thread-safe.
    /// </summary>
    public class AdoFileSpaceMethods : IFileSpaceMethods
    {
        #region Private-Members

        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Spaces;
        private readonly string _Files;
        private readonly string _Versions;
        private readonly string _Blobs;
        private readonly string _Conversations;
        private readonly string _Runs;
        private readonly string _PipelineRuns;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="driver">Owning driver.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoFileSpaceMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Spaces = driver.Table("conversation_file_spaces");
            _Files = driver.Table("conversation_files");
            _Versions = driver.Table("conversation_file_versions");
            _Blobs = driver.Table("file_space_blobs");
            _Conversations = driver.Table("conversations");
            _Runs = driver.Table("runs");
            _PipelineRuns = driver.Table("pipeline_runs");
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public async Task<ConversationFileSpace> GetOrCreateAsync(ConversationFileSpace template, CancellationToken token = default)
        {
            if (template == null) throw new ArgumentNullException(nameof(template));
            ConversationFileSpace? existing = await ReadByOwnerAsync(template.TenantId, template.OwnerKey, token).ConfigureAwait(false);
            if (existing != null) return existing;
            template.CreatedUtc = DateTime.UtcNow;
            template.LastUpdateUtc = template.CreatedUtc;
            try
            {
                await _Driver.NonQueryAsync(
                    "INSERT INTO " + _Spaces + " (id, tenantid, ownerkey, conversationid, pipelinerunid, rootrunid, artifactstoreid, filecount, totalbytes, createdutc, lastupdateutc) VALUES (@id, @tenantid, @ownerkey, @conversationid, @pipelinerunid, @rootrunid, @artifactstoreid, 0, 0, @createdutc, @lastupdateutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", template.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", template.TenantId);
                        AdoDatabaseDriver.Add(command, "ownerkey", template.OwnerKey);
                        AdoDatabaseDriver.Add(command, "conversationid", template.ConversationId);
                        AdoDatabaseDriver.Add(command, "pipelinerunid", template.PipelineRunId);
                        AdoDatabaseDriver.Add(command, "rootrunid", template.RootRunId);
                        AdoDatabaseDriver.Add(command, "artifactstoreid", String.IsNullOrEmpty(template.ArtifactStoreId) ? null : template.ArtifactStoreId);
                        AdoDatabaseDriver.Add(command, "createdutc", template.CreatedUtc);
                        AdoDatabaseDriver.Add(command, "lastupdateutc", template.LastUpdateUtc);
                    }, token).ConfigureAwait(false);
                return template;
            }
            catch (Exception e) when (DatabaseFailures.IsUniqueViolation(e))
            {
                return await ReadByOwnerAsync(template.TenantId, template.OwnerKey, token).ConfigureAwait(false)
                    ?? throw new InvalidOperationException("File space " + template.OwnerKey + " could not be created or read.", e);
            }
        }

        /// <inheritdoc />
        public Task<ConversationFileSpace?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(id)) throw new ArgumentNullException(nameof(id));
            return _Driver.QuerySingleAsync("SELECT * FROM " + _Spaces + " WHERE id = @id AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "id", id);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapSpace, token);
        }

        /// <inheritdoc />
        public Task<ConversationFileSpace?> ReadByOwnerAsync(string tenantId, string ownerKey, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(ownerKey)) throw new ArgumentNullException(nameof(ownerKey));
            return _Driver.QuerySingleAsync("SELECT * FROM " + _Spaces + " WHERE ownerkey = @ownerkey AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "ownerkey", ownerKey);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapSpace, token);
        }

        /// <inheritdoc />
        public Task<List<ConversationFile>> ListFilesAsync(string tenantId, string spaceId, bool includeDeleted, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            string deleted = includeDeleted ? String.Empty : " AND deleted = " + _Driver.Dialect.BooleanLiteral(false);
            return _Driver.QueryAsync("SELECT * FROM " + _Files + " WHERE filespaceid = @spaceid AND tenantid = @tenantid" + deleted + " ORDER BY path ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapFile, token);
        }

        /// <inheritdoc />
        public Task<ConversationFile?> ReadFileAsync(string tenantId, string spaceId, string path, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            return _Driver.QuerySingleAsync("SELECT * FROM " + _Files + " WHERE filespaceid = @spaceid AND path = @path AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                AdoDatabaseDriver.Add(command, "path", path);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapFile, token);
        }

        /// <inheritdoc />
        public Task<List<string>> PathsWrittenByRunAsync(string tenantId, string spaceId, string runId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            if (String.IsNullOrEmpty(runId)) throw new ArgumentNullException(nameof(runId));
            return _Driver.QueryAsync("SELECT DISTINCT f.path AS path FROM " + _Versions + " v JOIN " + _Files + " f ON f.id = v.fileid WHERE v.tenantid = @tenantid AND f.filespaceid = @spaceid AND v.runid = @runid ORDER BY f.path ASC;", command =>
            {
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                AdoDatabaseDriver.Add(command, "runid", runId);
            }, reader => AdoConverters.Str(reader, "path"), token);
        }

        /// <inheritdoc />
        public Task<List<ConversationFileVersion>> ListVersionsAsync(string tenantId, string fileId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(fileId)) throw new ArgumentNullException(nameof(fileId));
            return _Driver.QueryAsync("SELECT * FROM " + _Versions + " WHERE fileid = @fileid AND tenantid = @tenantid ORDER BY number DESC;", command =>
            {
                AdoDatabaseDriver.Add(command, "fileid", fileId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapVersion, token);
        }

        /// <inheritdoc />
        public Task<ConversationFileVersion?> ReadVersionAsync(string tenantId, string fileId, int number, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(fileId)) throw new ArgumentNullException(nameof(fileId));
            return _Driver.QuerySingleAsync("SELECT * FROM " + _Versions + " WHERE fileid = @fileid AND number = @number AND tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "fileid", fileId);
                AdoDatabaseDriver.Add(command, "number", number);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, MapVersion, token);
        }

        /// <inheritdoc />
        public async Task<ConversationFileVersion?> CommitAsync(string tenantId, string spaceId, string path, int? baseVersion, ConversationFileVersion version, byte[]? databaseContent, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            if (version == null) throw new ArgumentNullException(nameof(version));
            bool committed = false;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                List<ConversationFile> rows = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT * FROM " + _Files + " WHERE filespaceid = @spaceid AND path = @path AND tenantid = @tenantid;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                        AdoDatabaseDriver.Add(command, "path", path);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    }, MapFile, ct).ConfigureAwait(false);
                ConversationFile? file = rows.Count == 0 ? null : rows[0];
                int current = file == null || file.Deleted ? 0 : file.CurrentVersion;
                if (baseVersion.HasValue && baseVersion.Value != current) return;

                DateTime now = DateTime.UtcNow;
                if (file == null)
                {
                    file = new ConversationFile { TenantId = tenantId, FileSpaceId = spaceId, Path = path, CreatedUtc = now };
                    await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                        "INSERT INTO " + _Files + " (id, tenantid, filespaceid, path, currentversion, sizebytes, sha256, mediatype, deleted, createdutc, lastupdateutc) VALUES (@id, @tenantid, @spaceid, @path, 0, 0, '', @mediatype, @deleted, @now, @now);",
                        command =>
                        {
                            AdoDatabaseDriver.Add(command, "id", file.Id);
                            AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                            AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                            AdoDatabaseDriver.Add(command, "path", path);
                            AdoDatabaseDriver.Add(command, "mediatype", version.MediaType);
                            AdoDatabaseDriver.Add(command, "deleted", false);
                            AdoDatabaseDriver.Add(command, "now", now);
                        }, ct).ConfigureAwait(false);
                }
                List<int> max = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                    "SELECT COALESCE(MAX(number), 0) AS maxnumber FROM " + _Versions + " WHERE fileid = @fileid;",
                    command => AdoDatabaseDriver.Add(command, "fileid", file.Id),
                    reader => AdoConverters.Int(reader, "maxnumber"), ct).ConfigureAwait(false);
                version.Number = (max.Count == 0 ? 0 : max[0]) + 1;
                version.FileId = file.Id;
                version.TenantId = tenantId;
                version.CreatedUtc = now;
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "INSERT INTO " + _Versions + " (id, tenantid, fileid, number, sizebytes, sha256, mediatype, runid, leaseepoch, writtenby, storagekey, createdutc) VALUES (@id, @tenantid, @fileid, @number, @sizebytes, @sha256, @mediatype, @runid, @leaseepoch, @writtenby, @storagekey, @createdutc);",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", version.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                        AdoDatabaseDriver.Add(command, "fileid", file.Id);
                        AdoDatabaseDriver.Add(command, "number", version.Number);
                        AdoDatabaseDriver.Add(command, "sizebytes", version.SizeBytes);
                        AdoDatabaseDriver.Add(command, "sha256", version.Sha256);
                        AdoDatabaseDriver.Add(command, "mediatype", version.MediaType);
                        AdoDatabaseDriver.Add(command, "runid", version.RunId);
                        AdoDatabaseDriver.Add(command, "leaseepoch", version.LeaseEpoch);
                        AdoDatabaseDriver.Add(command, "writtenby", version.WrittenBy);
                        AdoDatabaseDriver.Add(command, "storagekey", version.StorageKey);
                        AdoDatabaseDriver.Add(command, "createdutc", version.CreatedUtc);
                    }, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Files + " SET currentversion = @number, sizebytes = @sizebytes, sha256 = @sha256, mediatype = @mediatype, deleted = @deleted, lastupdateutc = @now WHERE id = @id;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "number", version.Number);
                        AdoDatabaseDriver.Add(command, "sizebytes", version.SizeBytes);
                        AdoDatabaseDriver.Add(command, "sha256", version.Sha256);
                        AdoDatabaseDriver.Add(command, "mediatype", version.MediaType);
                        AdoDatabaseDriver.Add(command, "deleted", false);
                        AdoDatabaseDriver.Add(command, "now", now);
                        AdoDatabaseDriver.Add(command, "id", file.Id);
                    }, ct).ConfigureAwait(false);
                if (databaseContent != null)
                {
                    List<int> present = await AdoDatabaseDriver.QueryAsync(connection, transaction,
                        "SELECT 1 AS present FROM " + _Blobs + " WHERE storagekey = @key;",
                        command => AdoDatabaseDriver.Add(command, "key", version.StorageKey),
                        reader => AdoConverters.Int(reader, "present"), ct).ConfigureAwait(false);
                    if (present.Count == 0)
                    {
                        await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                            "INSERT INTO " + _Blobs + " (storagekey, tenantid, sizebytes, content, createdutc) VALUES (@key, @tenantid, @sizebytes, @content, @now);",
                            command =>
                            {
                                AdoDatabaseDriver.Add(command, "key", version.StorageKey);
                                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                                AdoDatabaseDriver.Add(command, "sizebytes", (long)databaseContent.Length);
                                AdoDatabaseDriver.Add(command, "content", databaseContent);
                                AdoDatabaseDriver.Add(command, "now", now);
                            }, ct).ConfigureAwait(false);
                    }
                }
                await RecountAsync(connection, transaction, spaceId, now, ct).ConfigureAwait(false);
                committed = true;
            }, token).ConfigureAwait(false);
            return committed ? version : null;
        }

        /// <inheritdoc />
        public async Task<bool> DeleteFileAsync(string tenantId, string spaceId, string path, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            if (String.IsNullOrEmpty(path)) throw new ArgumentNullException(nameof(path));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                DateTime now = DateTime.UtcNow;
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                    "UPDATE " + _Files + " SET deleted = @deleted, lastupdateutc = @now WHERE filespaceid = @spaceid AND path = @path AND tenantid = @tenantid AND deleted = @notdeleted;",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "deleted", true);
                        AdoDatabaseDriver.Add(command, "notdeleted", false);
                        AdoDatabaseDriver.Add(command, "now", now);
                        AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                        AdoDatabaseDriver.Add(command, "path", path);
                        AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                    }, ct).ConfigureAwait(false);
                if (affected > 0) await RecountAsync(connection, transaction, spaceId, now, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
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
        public Task<List<string>> StorageKeysAsync(string tenantId, string spaceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            return _Driver.QueryAsync("SELECT DISTINCT v.storagekey AS storagekey FROM " + _Versions + " v INNER JOIN " + _Files + " f ON f.id = v.fileid WHERE f.filespaceid = @spaceid AND f.tenantid = @tenantid;", command =>
            {
                AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                AdoDatabaseDriver.Add(command, "tenantid", tenantId);
            }, reader => AdoConverters.Str(reader, "storagekey"), token);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteSpaceAsync(string tenantId, string spaceId, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(spaceId)) throw new ArgumentNullException(nameof(spaceId));
            int affected = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                Action<DbCommand> bind = command =>
                {
                    AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                    AdoDatabaseDriver.Add(command, "tenantid", tenantId);
                };
                string files = "SELECT id FROM " + _Files + " WHERE filespaceid = @spaceid AND tenantid = @tenantid";
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Blobs + " WHERE tenantid = @tenantid AND storagekey IN (SELECT storagekey FROM " + _Versions + " WHERE fileid IN (" + files + "));", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Versions + " WHERE fileid IN (" + files + ");", bind, ct).ConfigureAwait(false);
                await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Files + " WHERE filespaceid = @spaceid AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
                affected = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "DELETE FROM " + _Spaces + " WHERE id = @spaceid AND tenantid = @tenantid;", bind, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return affected > 0;
        }

        /// <inheritdoc />
        public Task<List<ConversationFileSpace>> ListOrphansAsync(int max, CancellationToken token = default)
        {
            string sql = "SELECT * FROM " + _Spaces + " s WHERE "
                + "(s.conversationid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM " + _Conversations + " c WHERE c.id = s.conversationid)) OR "
                + "(s.pipelinerunid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM " + _PipelineRuns + " p WHERE p.id = s.pipelinerunid)) OR "
                + "(s.rootrunid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM " + _Runs + " r WHERE r.id = s.rootrunid)) "
                + "ORDER BY s.createdutc ASC" + _Driver.Dialect.LimitOffsetClause() + ";";
            return _Driver.QueryAsync(sql, command =>
            {
                AdoDatabaseDriver.Add(command, "max", Math.Clamp(max, 1, 1000));
                AdoDatabaseDriver.Add(command, "skip", 0);
            }, MapSpace, token);
        }

        #endregion

        #region Private-Methods

        private async Task RecountAsync(DbConnection connection, DbTransaction transaction, string spaceId, DateTime now, CancellationToken token)
        {
            string live = " WHERE filespaceid = @spaceid AND deleted = " + _Driver.Dialect.BooleanLiteral(false);
            await AdoDatabaseDriver.ExecuteAsync(connection, transaction,
                "UPDATE " + _Spaces + " SET filecount = (SELECT COUNT(*) FROM " + _Files + live + "), totalbytes = (SELECT COALESCE(SUM(sizebytes), 0) FROM " + _Files + live + "), lastupdateutc = @now WHERE id = @spaceid;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "spaceid", spaceId);
                    AdoDatabaseDriver.Add(command, "now", now);
                }, token).ConfigureAwait(false);
        }

        private static ConversationFileSpace MapSpace(DbDataReader reader)
        {
            ConversationFileSpace obj = new ConversationFileSpace();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.OwnerKey = AdoConverters.Str(reader, "ownerkey");
            obj.ConversationId = AdoConverters.NullableStr(reader, "conversationid");
            obj.PipelineRunId = AdoConverters.NullableStr(reader, "pipelinerunid");
            obj.RootRunId = AdoConverters.NullableStr(reader, "rootrunid");
            obj.ArtifactStoreId = AdoConverters.NullableStr(reader, "artifactstoreid");
            obj.FileCount = AdoConverters.Int(reader, "filecount");
            obj.TotalBytes = AdoConverters.Long(reader, "totalbytes");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static ConversationFile MapFile(DbDataReader reader)
        {
            ConversationFile obj = new ConversationFile();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.FileSpaceId = AdoConverters.Str(reader, "filespaceid");
            obj.Path = AdoConverters.Str(reader, "path");
            obj.CurrentVersion = AdoConverters.Int(reader, "currentversion");
            obj.SizeBytes = AdoConverters.Long(reader, "sizebytes");
            obj.Sha256 = AdoConverters.Str(reader, "sha256");
            obj.MediaType = AdoConverters.Str(reader, "mediatype");
            obj.Deleted = AdoConverters.Bool(reader, "deleted");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            obj.LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc");
            return obj;
        }

        private static ConversationFileVersion MapVersion(DbDataReader reader)
        {
            ConversationFileVersion obj = new ConversationFileVersion();
            obj.Id = AdoConverters.Str(reader, "id");
            obj.TenantId = AdoConverters.Str(reader, "tenantid");
            obj.FileId = AdoConverters.Str(reader, "fileid");
            obj.Number = AdoConverters.Int(reader, "number");
            obj.SizeBytes = AdoConverters.Long(reader, "sizebytes");
            obj.Sha256 = AdoConverters.Str(reader, "sha256");
            obj.MediaType = AdoConverters.Str(reader, "mediatype");
            obj.RunId = AdoConverters.NullableStr(reader, "runid");
            obj.LeaseEpoch = AdoConverters.NullableLong(reader, "leaseepoch");
            obj.WrittenBy = AdoConverters.NullableStr(reader, "writtenby");
            obj.StorageKey = AdoConverters.Str(reader, "storagekey");
            obj.CreatedUtc = AdoConverters.Date(reader, "createdutc");
            return obj;
        }

        #endregion
    }
}
