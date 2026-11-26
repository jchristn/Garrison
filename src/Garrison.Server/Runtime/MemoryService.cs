namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Memory;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using SyslogLogging;

    /// <summary>
    /// Scoped memory (AA4, AA-018): entry metadata in the database, text in the replaceable IScopedMemoryStore. Every
    /// write stores new content under a new handle first and then points the entry at it with a compare-and-set on the
    /// version, so a crash between the two leaves the previous version intact and only unreferenced content behind,
    /// which the orphan sweep removes. Callers check access with MemoryAccessPolicy first. Thread-safe.
    /// </summary>
    public class MemoryService
    {
        #region Public-Members

        /// <summary>
        /// Options, refreshed from cluster settings.
        /// </summary>
        public MemoryOptions Options
        {
            get
            {
                return _Options;
            }
        }

        /// <summary>
        /// Fault injection for tests: when set, it runs after new content is stored and before the entry points at it.
        /// Throwing from it simulates a crash between the two. Null in production.
        /// </summary>
        public Func<MemoryContentAddress, Task>? AfterContentWritten { get; set; } = null;

        /// <summary>
        /// Seconds between two leader sweeps that do work; passes in between return at once. Minimum 1, maximum 3600,
        /// default 30.
        /// </summary>
        public int SweepIntervalSeconds
        {
            get
            {
                return _SweepIntervalSeconds;
            }
            set
            {
                _SweepIntervalSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        /// <summary>
        /// Seconds between two writes of queued read times on this replica. Minimum 1, maximum 3600, default 30.
        /// </summary>
        public int ReadFlushIntervalSeconds
        {
            get
            {
                return _ReadFlushIntervalSeconds;
            }
            set
            {
                _ReadFlushIntervalSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        #endregion

        #region Private-Members

        private static readonly string _Header = "[MemoryService] ";
        private static readonly int _MaxTags = 20;
        private static readonly int _MaxTtlSeconds = 31536000;

        private readonly DatabaseDriverBase _Database;
        private readonly Func<IScopedMemoryStore?> _Store;
        private readonly AuditService _Audit;
        private readonly MemoryOptions _Options;
        private readonly LoggingModule _Logging;
        private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> _PendingReads = new ConcurrentDictionary<string, ConcurrentDictionary<string, byte>>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, DateTime> _LastOrphanSweep = new ConcurrentDictionary<string, DateTime>(StringComparer.Ordinal);
        private readonly ConcurrentDictionary<string, byte> _ImportedTenants = new ConcurrentDictionary<string, byte>(StringComparer.Ordinal);
        private int _SweepIntervalSeconds = 30;
        private int _ReadFlushIntervalSeconds = 30;
        private long _LastSweepTicks = 0;
        private long _LastFlushTicks = DateTime.UtcNow.Ticks;
        private int _Flushing = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database driver.</param>
        /// <param name="store">Returns the current content store, or null when agent memory is turned off; a module may replace it before the server starts.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="options">Options.</param>
        /// <param name="logging">Logging module.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MemoryService(DatabaseDriverBase database, Func<IScopedMemoryStore?> store, AuditService audit, MemoryOptions options, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Store = store ?? throw new ArgumentNullException(nameof(store));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Uppercase hexadecimal SHA-256 of a key's UTF-8 bytes, as stored in MemoryEntry.KeyHash.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Hash.</returns>
        /// <exception cref="ArgumentNullException">Thrown when key is null.</exception>
        public static string KeyHash(string key)
        {
            if (key == null) throw new ArgumentNullException(nameof(key));
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(key)));
        }

        /// <summary>
        /// Find the entry of a scope with a key. In an Agent scope this also adopts agent memory written before scopes
        /// existed: an imported entry learns its key, and a file nobody imported yet is imported now.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="key">Key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The entry, or null.</returns>
        /// <exception cref="ArgumentException">Thrown when the key is empty or longer than 256 characters.</exception>
        public async Task<MemoryEntry?> FindAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string key, CancellationToken token)
        {
            ValidateKey(key);
            MemoryEntry? entry = await _Database.MemoryEntries.ReadByKeyAsync(tenantId, scopeKind, scopeId, key, token).ConfigureAwait(false);
            if (entry != null || scopeKind != MemoryScopeKindEnum.Agent) return entry;
            string hash = KeyHash(key);
            MemoryEntry? imported = await _Database.MemoryEntries.ReadByKeyHashAsync(tenantId, scopeKind, scopeId, hash, token).ConfigureAwait(false);
            if (imported != null)
            {
                if (!imported.Legacy) return imported;
                imported.Key = key;
                imported.Legacy = false;
                if (await _Database.MemoryEntries.TryUpdateAsync(imported, imported.Version, token).ConfigureAwait(false)) return imported;
                return await _Database.MemoryEntries.ReadByKeyHashAsync(tenantId, scopeKind, scopeId, hash, token).ConfigureAwait(false);
            }
            return await ImportLegacyFileAsync(tenantId, scopeId, hash, key, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read an entry and its text.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="key">Key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result; Found is false when the scope has no such key.</returns>
        /// <exception cref="ArgumentException">Thrown when the key is invalid.</exception>
        public async Task<MemoryReadResult> ReadAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string key, CancellationToken token)
        {
            return await MeasureAsync(scopeKind, "read", async ct =>
            {
                MemoryReadResult result = new MemoryReadResult();
                MemoryEntry? entry = await FindAsync(tenantId, scopeKind, scopeId, key, ct).ConfigureAwait(false);
                if (entry == null) return result;
                string? value = await ReadContentAsync(entry, ct).ConfigureAwait(false);
                if (value == null) return result;
                result.Found = true;
                result.Entry = entry;
                result.Value = value;
                return result;
            }, r => r.Found ? "ok" : "not_found", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read the text of an entry and record the read for staleness.
        /// </summary>
        /// <param name="entry">Entry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Text, or null when its content is missing.</returns>
        /// <exception cref="ArgumentNullException">Thrown when entry is null.</exception>
        public async Task<string?> ReadContentAsync(MemoryEntry entry, CancellationToken token)
        {
            if (entry == null) throw new ArgumentNullException(nameof(entry));
            string? value = await Store().ReadAsync(Address(entry, entry.ContentId), token).ConfigureAwait(false);
            if (value == null)
            {
                _Logging.Warn(_Header + "entry " + entry.Id + " in tenant " + entry.TenantId + " points at content that is missing");
                return null;
            }
            RecordRead(entry);
            return value;
        }

        /// <summary>
        /// Write an entry: create it, or replace its text and bump its version.
        /// </summary>
        /// <param name="request">Write.</param>
        /// <param name="writer">Writer, recorded as provenance.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The entry after the write.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request or writer is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the key, value, category, tags, or time to live is invalid.</exception>
        /// <exception cref="ConflictException">MemoryVersionConflict when expectedVersion does not match, or MemoryScopeFull.</exception>
        public async Task<MemoryEntry> WriteAsync(MemoryWriteRequest request, MemoryWriter writer, CancellationToken token)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (writer == null) throw new ArgumentNullException(nameof(writer));
            ValidateKey(request.Key);
            if (request.Value == null) throw new ArgumentException("A memory value is required.", nameof(request));
            int bytes = Encoding.UTF8.GetByteCount(request.Value);
            if (bytes > _Options.MaxValueBytes) throw new ArgumentException("A memory value within the configured UTF-8 byte limit is required (" + bytes + " bytes; at most " + _Options.MaxValueBytes + ").", nameof(request));
            if (request.Category != null && request.Category.Length > 128) throw new ArgumentException("A memory category holds at most 128 characters.", nameof(request));
            List<string>? tags = request.Tags == null ? null : NormalizeTags(request.Tags);
            if (request.TtlSeconds.HasValue && (request.TtlSeconds.Value < 0 || request.TtlSeconds.Value > _MaxTtlSeconds)) throw new ArgumentException("ttlSeconds must be 0 (no expiry) to " + _MaxTtlSeconds + ".", nameof(request));
            if (request.ExpectedVersion.HasValue && request.ExpectedVersion.Value < 0) throw new ArgumentException("expectedVersion must be 0 or more.", nameof(request));

            return await MeasureAsync(request.ScopeKind, "write", async ct =>
            {
                string sha = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(request.Value))).ToLowerInvariant();
                for (int attempt = 1; ; attempt++)
                {
                    ct.ThrowIfCancellationRequested();
                    MemoryEntry? existing = await FindAsync(request.TenantId, request.ScopeKind, request.ScopeId, request.Key, ct).ConfigureAwait(false);
                    if (request.ExpectedVersion.HasValue)
                    {
                        long current = existing == null ? 0 : existing.Version;
                        if (current != request.ExpectedVersion.Value)
                            throw new ConflictException("MemoryVersionConflict", "The entry " + request.Key + " is at version " + current + ", not " + request.ExpectedVersion.Value + ". Read it again and retry with its version.");
                    }
                    if (existing == null && await _Database.MemoryEntries.CountInScopeAsync(request.TenantId, request.ScopeKind, request.ScopeId, ct).ConfigureAwait(false) >= _Options.MaxEntriesPerScope)
                        throw new ConflictException("MemoryScopeFull", "The " + request.ScopeKind + " scope already holds " + _Options.MaxEntriesPerScope + " entries (Memory.Scoped.MaxEntriesPerScope). Delete entries or replace an existing key.");

                    DateTime now = DateTime.UtcNow;
                    MemoryEntry entry = existing == null ? new MemoryEntry() : Copy(existing);
                    entry.TenantId = request.TenantId;
                    entry.ScopeKind = request.ScopeKind;
                    entry.ScopeId = request.ScopeId;
                    entry.Key = request.Key;
                    entry.KeyHash = KeyHash(request.Key);
                    entry.Legacy = false;
                    if (request.Category != null || existing == null) entry.Category = request.Category;
                    if (tags != null) entry.Tags = tags;
                    if (request.TtlSeconds.HasValue) entry.ExpiresUtc = request.TtlSeconds.Value == 0 ? null : now.AddSeconds(request.TtlSeconds.Value);
                    entry.Bytes = bytes;
                    entry.Sha256 = sha;
                    entry.ContentId = Guid.NewGuid().ToString("N");
                    entry.Version = existing == null ? 1 : existing.Version + 1;
                    entry.WriterAgentId = writer.AgentId;
                    entry.WriterRunId = writer.RunId;
                    entry.WriterPrincipalType = writer.PrincipalType;
                    entry.WriterPrincipalId = writer.PrincipalId;
                    entry.WriterName = writer.Name;
                    entry.LastReadUtc = null;
                    entry.LastUpdateUtc = now;
                    if (existing == null) entry.CreatedUtc = now;

                    // Content first, then metadata: until the metadata points at the new handle, readers keep seeing
                    // the previous version, and a crash leaves only unreferenced content for the orphan sweep.
                    MemoryContentAddress address = Address(entry, entry.ContentId);
                    await Store().WriteAsync(address, request.Value, ct).ConfigureAwait(false);
                    if (AfterContentWritten != null) await AfterContentWritten(address).ConfigureAwait(false);

                    bool committed;
                    if (existing == null)
                    {
                        try
                        {
                            await _Database.MemoryEntries.CreateAsync(entry, ct).ConfigureAwait(false);
                            committed = true;
                        }
                        catch (Exception e) when (e is not OperationCanceledException)
                        {
                            // Most likely another writer created the key first; anything else surfaces after the check.
                            committed = false;
                            if (await _Database.MemoryEntries.ReadByKeyAsync(request.TenantId, request.ScopeKind, request.ScopeId, request.Key, ct).ConfigureAwait(false) == null)
                            {
                                await DeleteContentQuietlyAsync(address).ConfigureAwait(false);
                                throw;
                            }
                        }
                    }
                    else
                    {
                        committed = await _Database.MemoryEntries.TryUpdateAsync(entry, existing.Version, ct).ConfigureAwait(false);
                    }

                    if (!committed)
                    {
                        await DeleteContentQuietlyAsync(address).ConfigureAwait(false);
                        if (request.ExpectedVersion.HasValue || attempt >= _Options.MaxWriteAttempts)
                            throw new ConflictException("MemoryVersionConflict", "The entry " + request.Key + " was written by someone else at the same time. Read it again and retry.");
                        // Another writer won this round; back off a little so the writers do not collide again at once.
                        await Task.Delay(Random.Shared.Next(5, 25 * Math.Min(attempt, 4)), ct).ConfigureAwait(false);
                        continue;
                    }

                    if (existing != null && !String.Equals(existing.ContentId, entry.ContentId, StringComparison.Ordinal))
                        await DeleteContentQuietlyAsync(Address(existing, existing.ContentId)).ConfigureAwait(false);
                    else if (existing == null && request.ScopeKind == MemoryScopeKindEnum.Agent)
                        await DeleteContentQuietlyAsync(Address(entry, FilesystemScopedMemoryStore.LegacyContentId(request.Key))).ConfigureAwait(false);
                    await AuditAsync(writer, entry, "write version " + entry.Version, ct).ConfigureAwait(false);
                    return entry;
                }
            }, r => "ok", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete the entry of a scope with a key. An absent key is a successful no-op.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="key">Key.</param>
        /// <param name="expectedVersion">Version the entry must be at, or null for any.</param>
        /// <param name="writer">Who deletes it.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when an entry was deleted.</returns>
        /// <exception cref="ArgumentException">Thrown when the key is invalid.</exception>
        /// <exception cref="ConflictException">MemoryVersionConflict when expectedVersion does not match.</exception>
        public async Task<bool> DeleteAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string key, long? expectedVersion, MemoryWriter writer, CancellationToken token)
        {
            if (writer == null) throw new ArgumentNullException(nameof(writer));
            return await MeasureAsync(scopeKind, "delete", async ct =>
            {
                MemoryEntry? entry = await FindAsync(tenantId, scopeKind, scopeId, key, ct).ConfigureAwait(false);
                if (entry == null)
                {
                    if (expectedVersion.HasValue && expectedVersion.Value != 0)
                        throw new ConflictException("MemoryVersionConflict", "The entry " + key + " does not exist, so it is not at version " + expectedVersion.Value + ".");
                    return false;
                }
                return await DeleteEntryAsync(entry, expectedVersion, writer, ct).ConfigureAwait(false);
            }, r => r ? "ok" : "not_found", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete an entry and its content.
        /// </summary>
        /// <param name="entry">Entry.</param>
        /// <param name="expectedVersion">Version the entry must be at, or null for any.</param>
        /// <param name="writer">Who deletes it.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call deleted it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when entry or writer is null.</exception>
        /// <exception cref="ConflictException">MemoryVersionConflict when expectedVersion does not match.</exception>
        public async Task<bool> DeleteEntryAsync(MemoryEntry entry, long? expectedVersion, MemoryWriter writer, CancellationToken token)
        {
            if (entry == null) throw new ArgumentNullException(nameof(entry));
            if (writer == null) throw new ArgumentNullException(nameof(writer));
            if (expectedVersion.HasValue && expectedVersion.Value != entry.Version)
                throw new ConflictException("MemoryVersionConflict", "The entry " + entry.Key + " is at version " + entry.Version + ", not " + expectedVersion.Value + ".");
            bool deleted = await _Database.MemoryEntries.DeleteAsync(entry.TenantId, entry.Id, expectedVersion, token).ConfigureAwait(false);
            if (!deleted)
            {
                if (expectedVersion.HasValue) throw new ConflictException("MemoryVersionConflict", "The entry " + entry.Key + " changed while it was being deleted. Read it again and retry.");
                return false;
            }
            await DeleteContentQuietlyAsync(Address(entry, entry.ContentId)).ConfigureAwait(false);
            await AuditAsync(writer, entry, "delete", token).ConfigureAwait(false);
            return true;
        }

        /// <summary>
        /// Enumerate entries.
        /// </summary>
        /// <param name="filter">Filter with the tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        public async Task<EnumerationResult<MemoryEntry>> ListAsync(MemoryEntryFilter filter, CancellationToken token)
        {
            if (filter == null) throw new ArgumentNullException(nameof(filter));
            filter.MaxResults = Math.Clamp(filter.MaxResults, 1, 1000);
            return await MeasureAsync(filter.ScopeKind ?? MemoryScopeKindEnum.Agent, "list", ct => _Database.MemoryEntries.EnumerateAsync(filter, ct), r => "ok", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Search one scope for a keyword in keys, categories, tags, and text. Text is read for at most
        /// Options.ContentSearchLimit entries of the scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="keyword">Keyword, 1 to 256 characters, matched case-insensitively.</param>
        /// <param name="maxResults">Most hits, 1 to 100.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Hits, ordered by key.</returns>
        /// <exception cref="ArgumentException">Thrown when the keyword is empty or too long.</exception>
        public async Task<List<MemorySearchHit>> SearchAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string keyword, int maxResults, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(keyword) || keyword.Length > 256) throw new ArgumentException("A search keyword holds 1 to 256 characters.", nameof(keyword));
            string needle = keyword.Trim();
            int limit = Math.Clamp(maxResults, 1, 100);
            return await MeasureAsync(scopeKind, "search", async ct =>
            {
                Dictionary<string, MemorySearchHit> hits = new Dictionary<string, MemorySearchHit>(StringComparer.Ordinal);
                MemoryEntryFilter metadata = new MemoryEntryFilter { TenantId = tenantId, ScopeKind = scopeKind, ScopeId = scopeId, Search = needle, MaxResults = limit };
                foreach (MemoryEntry entry in (await _Database.MemoryEntries.EnumerateAsync(metadata, ct).ConfigureAwait(false)).Objects)
                {
                    MemorySearchHit hit = new MemorySearchHit { Entry = entry };
                    if (entry.Key.Contains(needle, StringComparison.OrdinalIgnoreCase)) hit.MatchedIn.Add("key");
                    if (entry.Category != null && entry.Category.Contains(needle, StringComparison.OrdinalIgnoreCase)) hit.MatchedIn.Add("category");
                    if (entry.Tags.Any(t => t.Contains(needle, StringComparison.OrdinalIgnoreCase))) hit.MatchedIn.Add("tag");
                    hits[entry.Id] = hit;
                }
                MemoryEntryFilter scan = new MemoryEntryFilter { TenantId = tenantId, ScopeKind = scopeKind, ScopeId = scopeId, MaxResults = Math.Min(1000, _Options.ContentSearchLimit) };
                int scanned = 0;
                while (scanned < _Options.ContentSearchLimit)
                {
                    scan.Skip = scanned;
                    scan.MaxResults = Math.Min(1000, _Options.ContentSearchLimit - scanned);
                    List<MemoryEntry> page = (await _Database.MemoryEntries.EnumerateAsync(scan, ct).ConfigureAwait(false)).Objects;
                    if (page.Count == 0) break;
                    scanned += page.Count;
                    foreach (MemoryEntry entry in page)
                    {
                        ct.ThrowIfCancellationRequested();
                        string? text = await Store().ReadAsync(Address(entry, entry.ContentId), ct).ConfigureAwait(false);
                        if (text == null || !text.Contains(needle, StringComparison.OrdinalIgnoreCase)) continue;
                        if (!hits.TryGetValue(entry.Id, out MemorySearchHit? hit))
                        {
                            hit = new MemorySearchHit { Entry = entry };
                            hits[entry.Id] = hit;
                        }
                        hit.MatchedIn.Add("content");
                    }
                }
                return hits.Values.OrderBy(h => h.Entry.Key, StringComparer.Ordinal).Take(limit).ToList();
            }, r => "ok", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Delete every entry of a scope and its content, for example when its agent or app is deleted. Content is left
        /// alone when agent memory is turned off.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries deleted.</returns>
        public async Task<int> DeleteScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token)
        {
            int deleted = await _Database.MemoryEntries.DeleteScopeAsync(tenantId, scopeKind, scopeId, token).ConfigureAwait(false);
            IScopedMemoryStore? store = _Store();
            if (store != null) await store.DeleteScopeAsync(tenantId, scopeKind, scopeId, token).ConfigureAwait(false);
            if (deleted > 0) GarrisonMetrics.Count(GarrisonMetricCatalog.MemoryOperations, deleted, GarrisonMetrics.Tags("scope_kind", Label(scopeKind), "operation", "delete", "outcome", "ok"));
            return deleted;
        }

        /// <summary>
        /// Delete all memory content of a tenant. The tenant's metadata rows go with the tenant's other rows.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteTenantContentAsync(string tenantId, CancellationToken token)
        {
            IScopedMemoryStore? store = _Store();
            if (store != null) await store.DeleteTenantAsync(tenantId, token).ConfigureAwait(false);
            _ImportedTenants.TryRemove(tenantId, out _);
            _PendingReads.TryRemove(tenantId, out _);
        }

        /// <summary>
        /// Scopes of a tenant that hold entries, with the current name of each agent and app.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Scopes.</returns>
        public async Task<List<MemoryScopeSummary>> ListScopesAsync(string tenantId, CancellationToken token)
        {
            List<MemoryScopeSummary> scopes = await _Database.MemoryEntries.ListScopesAsync(tenantId, token).ConfigureAwait(false);
            foreach (MemoryScopeSummary scope in scopes)
            {
                if (scope.ScopeKind == MemoryScopeKindEnum.Agent) scope.ScopeName = (await _Database.Agents.ReadAsync(tenantId, scope.ScopeId, token).ConfigureAwait(false))?.Name;
                else if (scope.ScopeKind == MemoryScopeKindEnum.App) scope.ScopeName = (await _Database.Apps.ReadAsync(tenantId, scope.ScopeId, token).ConfigureAwait(false))?.Name;
            }
            return scopes;
        }

        /// <summary>
        /// Recall an agent's own entries tagged Options.RecallTag into a prompt (AA4.8), through the memory-recall
        /// template, at most Options.RecallMaxEntries entries and Options.RecallMaxBytes bytes of text, in key order.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rendered text, or null when nothing is tagged for recall or memory is turned off.</returns>
        /// <exception cref="Garrison.Core.Templates.TemplateException">Thrown when the template does not render.</exception>
        public async Task<string?> RenderRecallAsync(string tenantId, string agentId, CancellationToken token)
        {
            if (_Store() == null || _Options.RecallMaxEntries == 0 || _Options.RecallMaxBytes == 0) return null;
            MemoryEntryFilter filter = new MemoryEntryFilter { TenantId = tenantId, ScopeKind = MemoryScopeKindEnum.Agent, ScopeId = agentId, Tag = _Options.RecallTag, MaxResults = _Options.RecallMaxEntries };
            EnumerationResult<MemoryEntry> page = await _Database.MemoryEntries.EnumerateAsync(filter, token).ConfigureAwait(false);
            if (page.Objects.Count == 0) return null;
            List<MemoryReadResult> recalled = new List<MemoryReadResult>();
            long bytes = 0;
            bool truncated = page.TotalRecords > page.Objects.Count;
            foreach (MemoryEntry entry in page.Objects)
            {
                if (bytes + entry.Bytes > _Options.RecallMaxBytes)
                {
                    truncated = true;
                    continue;
                }
                string? value = await ReadContentAsync(entry, token).ConfigureAwait(false);
                if (value == null) continue;
                bytes += entry.Bytes;
                recalled.Add(new MemoryReadResult { Found = true, Entry = entry, Value = value });
            }
            if (recalled.Count == 0) return null;
            Dictionary<string, string> names = new Dictionary<string, string>(StringComparer.Ordinal);
            Agent? agent = await _Database.Agents.ReadAsync(tenantId, agentId, token).ConfigureAwait(false);
            if (agent != null) names[agentId] = agent.Name;
            PromptTemplate template = await new Garrison.Core.Keepers.KeeperTemplateResolver(_Database).ResolveAsync(tenantId, MemoryRecallRenderer.TemplateName, PromptTemplateKindEnum.Fragment, token).ConfigureAwait(false);
            string text = MemoryRecallRenderer.Render(template.Content, template.Name, recalled, names, _Options.RecallTag, truncated);
            GarrisonMetrics.Count(GarrisonMetricCatalog.MemoryOperations, recalled.Count, GarrisonMetrics.Tags("scope_kind", "agent", "operation", "recall", "outcome", "ok"));
            return String.IsNullOrWhiteSpace(text) ? null : text;
        }

        /// <summary>
        /// Record the read times queued since the last flush, one batch per tenant.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries updated.</returns>
        public async Task<int> FlushReadsAsync(CancellationToken token)
        {
            int updated = 0;
            DateTime now = DateTime.UtcNow;
            foreach (string tenantId in _PendingReads.Keys.ToList())
            {
                if (!_PendingReads.TryRemove(tenantId, out ConcurrentDictionary<string, byte>? ids) || ids.IsEmpty) continue;
                List<string> all = ids.Keys.ToList();
                for (int i = 0; i < all.Count; i += 500)
                    updated += await _Database.MemoryEntries.TouchReadAsync(tenantId, all.Skip(i).Take(500).ToList(), now, token).ConfigureAwait(false);
            }
            return updated;
        }

        /// <summary>
        /// Leader sweep: record queued reads, delete expired entries, import agent memory written before scopes existed,
        /// and remove orphaned content once per Options.OrphanSweepIntervalSeconds per tenant.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task SweepAsync(CancellationToken token)
        {
            long now = DateTime.UtcNow.Ticks;
            if (now - Interlocked.Read(ref _LastSweepTicks) < TimeSpan.FromSeconds(_SweepIntervalSeconds).Ticks) return;
            Interlocked.Exchange(ref _LastSweepTicks, now);
            await FlushReadsAsync(token).ConfigureAwait(false);
            await ExpireAsync(token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery { MaxResults = 1000 };
            List<Tenant> tenants = (await _Database.Tenants.EnumerateAsync(query, token).ConfigureAwait(false)).Objects;
            foreach (Tenant tenant in tenants)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    if (!_ImportedTenants.ContainsKey(tenant.Id))
                    {
                        await ImportLegacyAsync(tenant.Id, token).ConfigureAwait(false);
                        _ImportedTenants[tenant.Id] = 0;
                    }
                    DateTime last = _LastOrphanSweep.GetValueOrDefault(tenant.Id, DateTime.MinValue);
                    if ((DateTime.UtcNow - last).TotalSeconds >= _Options.OrphanSweepIntervalSeconds)
                    {
                        _LastOrphanSweep[tenant.Id] = DateTime.UtcNow;
                        await RemoveOrphansAsync(tenant.Id, token).ConfigureAwait(false);
                    }
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    _Logging.Warn(_Header + "sweep of tenant " + tenant.Id + " failed: " + e.Message);
                }
            }
        }

        /// <summary>
        /// Delete expired entries, at most Options.MaxExpiredPerSweep.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries deleted.</returns>
        public async Task<int> ExpireAsync(CancellationToken token)
        {
            int deleted = 0;
            List<MemoryEntry> expired = await _Database.MemoryEntries.ListExpiredAsync(DateTime.UtcNow, _Options.MaxExpiredPerSweep, token).ConfigureAwait(false);
            foreach (MemoryEntry entry in expired)
            {
                if (!await _Database.MemoryEntries.DeleteAsync(entry.TenantId, entry.Id, entry.Version, token).ConfigureAwait(false)) continue;
                await DeleteContentQuietlyAsync(Address(entry, entry.ContentId)).ConfigureAwait(false);
                GarrisonMetrics.Count(GarrisonMetricCatalog.MemoryOperations, "scope_kind", Label(entry.ScopeKind), "operation", "expire", "outcome", "ok");
                deleted++;
            }
            return deleted;
        }

        /// <summary>
        /// Remove content of a tenant that no entry points at and that is older than Options.OrphanGraceSeconds.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pieces of content removed.</returns>
        public async Task<int> RemoveOrphansAsync(string tenantId, CancellationToken token)
        {
            HashSet<string> referenced = await _Database.MemoryEntries.ListContentIdsAsync(tenantId, token).ConfigureAwait(false);
            int removed = await Store().RemoveUnreferencedAsync(tenantId, referenced, DateTime.UtcNow.AddSeconds(-_Options.OrphanGraceSeconds), token).ConfigureAwait(false);
            if (removed > 0) _Logging.Info(_Header + "removed " + removed + " orphaned memory content file(s) in tenant " + tenantId);
            return removed;
        }

        /// <summary>
        /// Import agent memory a tenant wrote before scopes existed (AA4.7): every file under the agent memory root gets an
        /// Agent scope entry so it appears in listings. Files are not moved. Only the key's hash is known, so the entry's
        /// key reads "legacy:" and the hash until a run uses the real key. Idempotent; does nothing unless the content
        /// store is the filesystem store.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries created.</returns>
        public async Task<int> ImportLegacyAsync(string tenantId, CancellationToken token)
        {
            if (_Store() is not FilesystemScopedMemoryStore filesystem) return 0;
            int created = 0;
            int skip = 0;
            while (true)
            {
                EnumerationQuery query = new EnumerationQuery { MaxResults = 1000, Skip = skip };
                EnumerationResult<Agent> page = await _Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                foreach (Agent agent in page.Objects)
                {
                    foreach (LegacyMemoryFile file in await filesystem.ListLegacyAgentMemoryAsync(tenantId, agent.Id, token).ConfigureAwait(false))
                    {
                        if (await _Database.MemoryEntries.ReadByKeyHashAsync(tenantId, MemoryScopeKindEnum.Agent, agent.Id, file.KeyHash, token).ConfigureAwait(false) != null) continue;
                        if (await ImportLegacyFileAsync(tenantId, agent.Id, file.KeyHash, null, token).ConfigureAwait(false) != null) created++;
                    }
                }
                skip += page.Objects.Count;
                if (page.Objects.Count == 0 || page.EndOfResults) break;
            }
            if (created > 0) _Logging.Info(_Header + "imported " + created + " agent memory entr" + (created == 1 ? "y" : "ies") + " written before scopes existed in tenant " + tenantId);
            return created;
        }

        #endregion

        #region Private-Methods

        private async Task<MemoryEntry?> ImportLegacyFileAsync(string tenantId, string agentId, string keyHash, string? key, CancellationToken token)
        {
            MemoryEntry entry = new MemoryEntry();
            entry.TenantId = tenantId;
            entry.ScopeKind = MemoryScopeKindEnum.Agent;
            entry.ScopeId = agentId;
            entry.ContentId = FilesystemScopedMemoryStore.LegacyContentPrefix + keyHash;
            string? value;
            try
            {
                value = await Store().ReadAsync(Address(entry, entry.ContentId), token).ConfigureAwait(false);
            }
            catch (ArgumentException)
            {
                return null;
            }
            if (value == null) return null;
            byte[] data = Encoding.UTF8.GetBytes(value);
            entry.Key = key ?? "legacy:" + keyHash;
            entry.KeyHash = keyHash;
            entry.Legacy = key == null;
            entry.Bytes = data.Length;
            entry.Sha256 = Convert.ToHexString(SHA256.HashData(data)).ToLowerInvariant();
            entry.Version = 1;
            entry.WriterAgentId = agentId;
            entry.WriterName = "agent memory before scopes";
            entry.CreatedUtc = DateTime.UtcNow;
            entry.LastUpdateUtc = entry.CreatedUtc;
            try
            {
                await _Database.MemoryEntries.CreateAsync(entry, token).ConfigureAwait(false);
                return entry;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                // Imported by another replica or by a concurrent read at the same time.
                return await _Database.MemoryEntries.ReadByKeyHashAsync(tenantId, MemoryScopeKindEnum.Agent, agentId, keyHash, token).ConfigureAwait(false);
            }
        }

        private IScopedMemoryStore Store()
        {
            return _Store() ?? throw new InvalidOperationException("Agent memory is turned off on this server, so there is no memory content store.");
        }

        private void RecordRead(MemoryEntry entry)
        {
            ConcurrentDictionary<string, byte> ids = _PendingReads.GetOrAdd(entry.TenantId, _ => new ConcurrentDictionary<string, byte>(StringComparer.Ordinal));
            ids[entry.Id] = 0;
            // Every replica records its own reads; the batch is written once the interval has passed.
            long now = DateTime.UtcNow.Ticks;
            if (now - Interlocked.Read(ref _LastFlushTicks) < TimeSpan.FromSeconds(_ReadFlushIntervalSeconds).Ticks) return;
            if (Interlocked.CompareExchange(ref _Flushing, 1, 0) != 0) return;
            Interlocked.Exchange(ref _LastFlushTicks, now);
            _ = Task.Run(async () =>
            {
                try { await FlushReadsAsync(CancellationToken.None).ConfigureAwait(false); }
                catch (Exception e) { _Logging.Warn(_Header + "recording memory read times failed: " + e.Message); }
                finally { Interlocked.Exchange(ref _Flushing, 0); }
            });
        }

        private async Task DeleteContentQuietlyAsync(MemoryContentAddress address)
        {
            try
            {
                await Store().DeleteAsync(address, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception e)
            {
                // Content left behind is unreferenced; the orphan sweep removes it later.
                _Logging.Warn(_Header + "could not delete memory content " + address.ContentId + " in tenant " + address.TenantId + ": " + e.Message);
            }
        }

        private async Task AuditAsync(MemoryWriter writer, MemoryEntry entry, string action, CancellationToken token)
        {
            AuditRecord record = new AuditRecord();
            record.TenantId = entry.TenantId;
            record.EventType = AuditEventTypeEnum.ConfigurationChanged;
            record.ResourceType = "Memory";
            record.ResourceId = entry.Id;
            record.PrincipalType = writer.PrincipalType;
            record.PrincipalId = writer.PrincipalId;
            record.PrincipalName = writer.Name;
            // Keys and text are never written to the audit log; the entry identifier ties the record to the entry.
            record.Description = entry.ScopeKind + " scope " + entry.ScopeId + ": " + action;
            await _Audit.WriteAsync(record, token).ConfigureAwait(false);
        }

        private async Task<T> MeasureAsync<T>(MemoryScopeKindEnum scopeKind, string operation, Func<CancellationToken, Task<T>> work, Func<T, string> outcome, CancellationToken token)
        {
            using (Activity? span = GarrisonTracing.Start("memory " + operation, ActivityKind.Internal))
            {
                span?.SetTag("garrison.memory.scope_kind", Label(scopeKind));
                try
                {
                    T result = await work(token).ConfigureAwait(false);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.MemoryOperations, "scope_kind", Label(scopeKind), "operation", operation, "outcome", outcome(result));
                    GarrisonTracing.Ok(span);
                    return result;
                }
                catch (Exception e)
                {
                    string result = e is ConflictException conflict && conflict.Code == "MemoryVersionConflict" ? "conflict"
                        : e is ConflictException ? "refused"
                        : e is ArgumentException ? "refused"
                        : "failed";
                    GarrisonMetrics.Count(GarrisonMetricCatalog.MemoryOperations, "scope_kind", Label(scopeKind), "operation", operation, "outcome", result);
                    GarrisonTracing.Fail(span, e);
                    throw;
                }
            }
        }

        private static MemoryContentAddress Address(MemoryEntry entry, string contentId)
        {
            MemoryContentAddress address = new MemoryContentAddress();
            address.TenantId = entry.TenantId;
            address.ScopeKind = entry.ScopeKind;
            address.ScopeId = entry.ScopeId;
            address.Key = entry.Key;
            address.ContentId = contentId;
            return address;
        }

        private static MemoryEntry Copy(MemoryEntry source)
        {
            MemoryEntry copy = new MemoryEntry();
            copy.Id = source.Id;
            copy.TenantId = source.TenantId;
            copy.ScopeKind = source.ScopeKind;
            copy.ScopeId = source.ScopeId;
            copy.Key = source.Key;
            copy.KeyHash = source.KeyHash;
            copy.Legacy = source.Legacy;
            copy.Category = source.Category;
            copy.Tags = new List<string>(source.Tags);
            copy.Bytes = source.Bytes;
            copy.Sha256 = source.Sha256;
            copy.ContentId = source.ContentId;
            copy.Version = source.Version;
            copy.WriterAgentId = source.WriterAgentId;
            copy.WriterRunId = source.WriterRunId;
            copy.WriterPrincipalType = source.WriterPrincipalType;
            copy.WriterPrincipalId = source.WriterPrincipalId;
            copy.WriterName = source.WriterName;
            copy.LastReadUtc = source.LastReadUtc;
            copy.ExpiresUtc = source.ExpiresUtc;
            copy.CreatedUtc = source.CreatedUtc;
            copy.LastUpdateUtc = source.LastUpdateUtc;
            return copy;
        }

        private static List<string> NormalizeTags(List<string> tags)
        {
            List<string> result = new List<string>();
            foreach (string raw in tags)
            {
                string tag = (raw ?? String.Empty).Trim().ToLowerInvariant();
                if (tag.Length < 1 || tag.Length > 64) throw new ArgumentException("A memory tag holds 1 to 64 characters.", nameof(tags));
                if (!result.Contains(tag, StringComparer.Ordinal)) result.Add(tag);
            }
            if (result.Count > _MaxTags) throw new ArgumentException("A memory entry holds at most " + _MaxTags + " tags.", nameof(tags));
            return result;
        }

        private static void ValidateKey(string key)
        {
            if (String.IsNullOrEmpty(key) || key.Length > 256) throw new ArgumentException("Memory key must contain 1 to 256 characters.", nameof(key));
        }

        private static string Label(MemoryScopeKindEnum kind)
        {
            return kind.ToString().ToLowerInvariant();
        }

        #endregion
    }
}
