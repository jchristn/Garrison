namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Scoped memory metadata access (AA4). Every read filters by tenant. Implementations are thread-safe.
    /// </summary>
    public interface IMemoryEntryMethods
    {
        /// <summary>
        /// Insert an entry and its tags in one transaction. Fails when the scope already holds the key or the key hash.
        /// </summary>
        /// <param name="obj">Entry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored entry.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<MemoryEntry> CreateAsync(MemoryEntry obj, CancellationToken token = default);

        /// <summary>
        /// Read an entry with its tags.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Entry identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The entry, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<MemoryEntry?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the entry of a scope with a key.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="key">Key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The entry, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, scopeId, or key is null or empty.</exception>
        Task<MemoryEntry?> ReadByKeyAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string key, CancellationToken token = default);

        /// <summary>
        /// Read the entry of a scope with a key hash. Finds an imported entry whose key is not known yet.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="keyHash">Uppercase hexadecimal SHA-256 of the key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The entry, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, scopeId, or keyHash is null or empty.</exception>
        Task<MemoryEntry?> ReadByKeyHashAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, string keyHash, CancellationToken token = default);

        /// <summary>
        /// Enumerate entries with their tags, ordered by scope kind, scope, then key.
        /// </summary>
        /// <param name="filter">Filter with the tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its tenant is null.</exception>
        Task<EnumerationResult<MemoryEntry>> EnumerateAsync(MemoryEntryFilter filter, CancellationToken token = default);

        /// <summary>
        /// Entries in one scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or scopeId is null or empty.</exception>
        Task<long> CountInScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token = default);

        /// <summary>
        /// Replace an entry and its tags when its stored version is still expectedVersion (compare-and-set).
        /// </summary>
        /// <param name="obj">Entry with the new values and the new version.</param>
        /// <param name="expectedVersion">Version the stored entry must have.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call replaced it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryUpdateAsync(MemoryEntry obj, long expectedVersion, CancellationToken token = default);

        /// <summary>
        /// Delete an entry and its tags, optionally only while it is at a version.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Entry identifier.</param>
        /// <param name="expectedVersion">Version the stored entry must have, or null for any.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call deleted it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, long? expectedVersion, CancellationToken token = default);

        /// <summary>
        /// Delete every entry of a scope and their tags.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entries deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or scopeId is null or empty.</exception>
        Task<int> DeleteScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token = default);

        /// <summary>
        /// Scopes of a tenant that hold entries, with counts, bytes, and the latest write, ordered by scope kind and scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Scopes. ScopeName is not set.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<MemoryScopeSummary>> ListScopesAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// Content handles every entry of a tenant points at. The orphan sweep keeps exactly these.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Content handles.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<HashSet<string>> ListContentIdsAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// Entries of any tenant that expired at or before a time, oldest first.
        /// </summary>
        /// <param name="nowUtc">Time (UTC).</param>
        /// <param name="limit">Most entries. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Expired entries, without tags.</returns>
        Task<List<MemoryEntry>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Record a read time on several entries of a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="ids">Entry identifiers.</param>
        /// <param name="readUtc">Read time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows updated.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or ids is null.</exception>
        Task<int> TouchReadAsync(string tenantId, IReadOnlyCollection<string> ids, DateTime readUtc, CancellationToken token = default);
    }
}
