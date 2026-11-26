namespace Garrison.Core.Memory
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// Replaceable content store for scoped memory (AA4, AA-018). The database keeps each entry's metadata and the handle
    /// of its current content; the provider keeps the text. Every write uses a new content handle, and the server deletes
    /// the previous content only after the metadata points at the new one. Implementations isolate tenants and scopes,
    /// treat text as opaque, and must be thread-safe. Register a replacement in the ServerContext before the server starts.
    /// </summary>
    public interface IScopedMemoryStore
    {
        /// <summary>
        /// Store content under a new handle. Publication is atomic: a reader sees all of it or none of it.
        /// </summary>
        /// <param name="address">Address with a new content handle.</param>
        /// <param name="content">Text.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address or content is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the address is invalid or the content exceeds the provider's byte bound.</exception>
        /// <exception cref="OperationCanceledException">Thrown when cancelled before the content is published.</exception>
        Task WriteAsync(MemoryContentAddress address, string content, CancellationToken token);

        /// <summary>
        /// Read content.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Text, or null when absent.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the address is invalid.</exception>
        Task<string?> ReadAsync(MemoryContentAddress address, CancellationToken token);

        /// <summary>
        /// Delete content. Absent content is a successful no-op.
        /// </summary>
        /// <param name="address">Address.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when address is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the address is invalid.</exception>
        Task DeleteAsync(MemoryContentAddress address, CancellationToken token);

        /// <summary>
        /// Delete all content of a scope, including agent memory written before scopes existed for an Agent scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentException">Thrown when tenantId or scopeId is empty or too long.</exception>
        Task DeleteScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token);

        /// <summary>
        /// Delete all content of a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentException">Thrown when tenantId is empty or too long.</exception>
        Task DeleteTenantAsync(string tenantId, CancellationToken token);

        /// <summary>
        /// Delete content of a tenant that no entry points at and that was written before a time, so a write in progress
        /// is never removed. Content imported from agent memory written before scopes existed is left alone.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="referenced">Content handles entries point at.</param>
        /// <param name="writtenBeforeUtc">Only content written before this time (UTC) is removed.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pieces of content removed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when referenced is null.</exception>
        /// <exception cref="ArgumentException">Thrown when tenantId is empty or too long.</exception>
        Task<int> RemoveUnreferencedAsync(string tenantId, ISet<string> referenced, DateTime writtenBeforeUtc, CancellationToken token);
    }
}
