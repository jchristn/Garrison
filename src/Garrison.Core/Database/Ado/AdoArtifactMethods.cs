namespace Garrison.Core.Database.Ado
{
    using System;
    using System.Collections.Generic;
    using System.Data.Common;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database.Interfaces;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>Structured, tenant-scoped artifact persistence. Metadata queries never select content. Thread-safe.</summary>
    public class AdoArtifactMethods : IArtifactMethods
    {
        private readonly AdoDatabaseDriver _Driver;
        private readonly string _Table;
        private readonly string _Metadata = "id, tenantid, runid, artifactstoreid, name, mediatype, sizebytes, sha256, location, leaseepoch, repairattempt, createdutc, lastupdateutc";

        /// <summary>Construct artifact persistence.</summary>
        /// <param name="driver">Owning database.</param>
        /// <exception cref="ArgumentNullException">Thrown when driver is null.</exception>
        public AdoArtifactMethods(AdoDatabaseDriver driver)
        {
            _Driver = driver ?? throw new ArgumentNullException(nameof(driver));
            _Table = driver.Table("artifacts");
        }

        /// <inheritdoc />
        public async Task<Artifact> CreateAsync(Artifact artifact, byte[]? content, CancellationToken token = default)
        {
            return await InsertAsync(artifact, content, false, token).ConfigureAwait(false) ?? throw new InvalidOperationException("Artifact insert did not create a row.");
        }

        /// <inheritdoc />
        public Task<Artifact?> CreateForExecutionAsync(Artifact artifact, byte[]? content, CancellationToken token = default, string? nodeId = null)
        {
            return InsertAsync(artifact, content, true, token, nodeId);
        }

        /// <inheritdoc />
        public async Task<Artifact?> ReadAsync(string tenantId, string id, CancellationToken token = default)
        {
            RequireTenant(tenantId);
            return await _Driver.QuerySingleAsync("SELECT " + _Metadata + " FROM " + _Table + " WHERE tenantid = @tenant AND id = @id;",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id); }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<Artifact?> ReadUploadAsync(string tenantId, string runId, long epoch, int repairAttempt, string name, CancellationToken token = default)
        {
            RequireTenant(tenantId);
            return await _Driver.QuerySingleAsync("SELECT " + _Metadata + " FROM " + _Table + " WHERE tenantid = @tenant AND runid = @run AND leaseepoch = @epoch AND repairattempt = @repair AND name = @name;",
                command =>
                {
                    AdoDatabaseDriver.Add(command, "tenant", tenantId);
                    AdoDatabaseDriver.Add(command, "run", runId);
                    AdoDatabaseDriver.Add(command, "epoch", epoch);
                    AdoDatabaseDriver.Add(command, "repair", repairAttempt);
                    AdoDatabaseDriver.Add(command, "name", name);
                }, Map, token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<byte[]?> ReadContentAsync(string tenantId, string id, CancellationToken token = default)
        {
            RequireTenant(tenantId);
            return await _Driver.QuerySingleAsync("SELECT content FROM " + _Table + " WHERE tenantid = @tenant AND id = @id AND content IS NOT NULL;",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id); },
                reader => reader.GetFieldValue<byte[]>(0), token).ConfigureAwait(false);
        }

        /// <inheritdoc />
        public async Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default)
        {
            RequireTenant(tenantId);
            int count = await _Driver.NonQueryAsync("DELETE FROM " + _Table + " WHERE tenantid = @tenant AND id = @id;",
                command => { AdoDatabaseDriver.Add(command, "tenant", tenantId); AdoDatabaseDriver.Add(command, "id", id); }, token).ConfigureAwait(false);
            return count > 0;
        }

        /// <inheritdoc />
        public async Task<EnumerationResult<Artifact>> EnumerateAsync(string tenantId, EnumerationQuery query, string? runId = null, string? storeId = null, CancellationToken token = default, bool includeInternal = false)
        {
            RequireTenant(tenantId);
            if (query == null) throw new ArgumentNullException(nameof(query));
            List<string> clauses = new List<string> { "tenantid = @tenant" };
            if (!includeInternal) clauses.Add("LOWER(name) NOT LIKE '.garrison/%'");
            if (!String.IsNullOrEmpty(runId)) clauses.Add("runid = @run");
            if (!String.IsNullOrEmpty(storeId)) clauses.Add("artifactstoreid = @store");
            if (!String.IsNullOrEmpty(query.Search)) clauses.Add(_Driver.Dialect.CaseInsensitiveLike("name", "search"));
            string where = " WHERE " + String.Join(" AND ", clauses);
            Action<DbCommand> bind = command =>
            {
                AdoDatabaseDriver.Add(command, "tenant", tenantId);
                if (!String.IsNullOrEmpty(runId)) AdoDatabaseDriver.Add(command, "run", runId);
                if (!String.IsNullOrEmpty(storeId)) AdoDatabaseDriver.Add(command, "store", storeId);
                if (!String.IsNullOrEmpty(query.Search)) AdoDatabaseDriver.Add(command, "search", "%" + query.Search + "%");
            };
            object? count = await _Driver.ScalarAsync("SELECT COUNT(*) FROM " + _Table + where + ";", bind, token).ConfigureAwait(false);
            List<Artifact> rows = await _Driver.QueryAsync("SELECT " + _Metadata + " FROM " + _Table + where + AdoEnumerationSql.OrderBy(query.Ordering, true) + _Driver.Dialect.LimitOffsetClause() + ";",
                command =>
                {
                    bind(command);
                    AdoDatabaseDriver.Add(command, "max", query.MaxResults);
                    AdoDatabaseDriver.Add(command, "skip", query.Skip);
                }, Map, token).ConfigureAwait(false);
            return EnumerationResult<Artifact>.Build(query, count == null ? 0 : Convert.ToInt64(count), rows);
        }

        private async Task<Artifact?> InsertAsync(Artifact artifact, byte[]? content, bool fenced, CancellationToken token, string? nodeId = null)
        {
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            RequireTenant(artifact.TenantId);
            artifact.CreatedUtc = DateTime.UtcNow;
            artifact.LastUpdateUtc = artifact.CreatedUtc;
            int inserted = 0;
            await _Driver.ExecuteInTransactionAsync(async (connection, transaction, ct) =>
            {
                if (nodeId != null)
                {
                    int held = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, "UPDATE " + _Driver.Table("runs") + " SET lastupdateutc=lastupdateutc WHERE id=@run AND tenantid=@tenant AND leaseepoch=@epoch AND repairattempts=@repair AND leasenodeid=@node AND leaseexpiresutc>@now AND status IN ('Leased','Running') AND cancelrequested=" + _Driver.Dialect.BooleanLiteral(false), command =>
                    {
                        AdoDatabaseDriver.Add(command, "run", artifact.RunId); AdoDatabaseDriver.Add(command, "tenant", artifact.TenantId);
                        AdoDatabaseDriver.Add(command, "epoch", artifact.LeaseEpoch); AdoDatabaseDriver.Add(command, "repair", artifact.RepairAttempt);
                        AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow);
                    }, ct).ConfigureAwait(false);
                    if (held != 1) return;
                }
                string sql = "INSERT INTO " + _Table + " (" + _Metadata + ", content) VALUES (@id, @tenantid, @runid, @artifactstoreid, @name, @mediatype, @sizebytes, @sha256, @location, @leaseepoch, @repairattempt, @createdutc, @lastupdateutc, @content)";
                if (fenced)
                {
                    sql = sql.Replace("VALUES (", "SELECT ", StringComparison.Ordinal).TrimEnd(')');
                    sql += " WHERE EXISTS (SELECT 1 FROM " + _Driver.Table("runs") + " WHERE id = @runid AND tenantid = @tenantid AND leaseepoch = @leaseepoch AND repairattempts = @repairattempt AND status IN ('Leased', 'Running') AND cancelrequested = " + _Driver.Dialect.BooleanLiteral(false) + (nodeId == null ? String.Empty : " AND leasenodeid=@node AND leaseexpiresutc>@now") + ")";
                }
                inserted = await AdoDatabaseDriver.ExecuteAsync(connection, transaction, sql + ";",
                    command =>
                    {
                        AdoDatabaseDriver.Add(command, "id", artifact.Id);
                        AdoDatabaseDriver.Add(command, "tenantid", artifact.TenantId);
                        AdoDatabaseDriver.Add(command, "runid", artifact.RunId);
                        AdoDatabaseDriver.Add(command, "artifactstoreid", artifact.ArtifactStoreId);
                        AdoDatabaseDriver.Add(command, "name", artifact.Name);
                        AdoDatabaseDriver.Add(command, "mediatype", artifact.MediaType);
                        AdoDatabaseDriver.Add(command, "sizebytes", artifact.SizeBytes);
                        AdoDatabaseDriver.Add(command, "sha256", artifact.Sha256);
                        AdoDatabaseDriver.Add(command, "location", artifact.Location);
                        AdoDatabaseDriver.Add(command, "leaseepoch", artifact.LeaseEpoch);
                        if (nodeId != null) { AdoDatabaseDriver.Add(command, "node", nodeId); AdoDatabaseDriver.Add(command, "now", DateTime.UtcNow); }
                        AdoDatabaseDriver.Add(command, "repairattempt", artifact.RepairAttempt);
                        AdoDatabaseDriver.Add(command, "createdutc", artifact.CreatedUtc);
                        AdoDatabaseDriver.Add(command, "lastupdateutc", artifact.LastUpdateUtc);
                        AdoDatabaseDriver.Add(command, "content", content);
                    }, ct).ConfigureAwait(false);
            }, token).ConfigureAwait(false);
            return inserted == 1 ? artifact : null;
        }

        private static Artifact Map(DbDataReader reader)
        {
            return new Artifact
            {
                Id = AdoConverters.Str(reader, "id"),
                TenantId = AdoConverters.Str(reader, "tenantid"),
                RunId = AdoConverters.Str(reader, "runid"),
                ArtifactStoreId = AdoConverters.Str(reader, "artifactstoreid"),
                Name = AdoConverters.Str(reader, "name"),
                MediaType = AdoConverters.Str(reader, "mediatype"),
                SizeBytes = AdoConverters.Long(reader, "sizebytes"),
                Sha256 = AdoConverters.Str(reader, "sha256"),
                Location = AdoConverters.Str(reader, "location"),
                LeaseEpoch = AdoConverters.Long(reader, "leaseepoch"),
                RepairAttempt = AdoConverters.Int(reader, "repairattempt"),
                CreatedUtc = AdoConverters.Date(reader, "createdutc"),
                LastUpdateUtc = AdoConverters.Date(reader, "lastupdateutc"),
            };
        }

        private static void RequireTenant(string tenantId)
        {
            if (String.IsNullOrWhiteSpace(tenantId)) throw new ArgumentNullException(nameof(tenantId));
        }
    }
}
