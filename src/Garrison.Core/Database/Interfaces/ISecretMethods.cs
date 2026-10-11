namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Secret data access methods.
    /// </summary>
    public interface ISecretMethods
    {
        /// <summary>
        /// Create a Secret, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<Secret> CreateAsync(Secret obj, CancellationToken token = default);

        /// <summary>
        /// Read a Secret by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Secret?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a Secret by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Secret?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a Secret by name within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Secret?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Update a Secret, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<Secret> UpdateAsync(Secret obj, CancellationToken token = default);

        /// <summary>
        /// Write the value and credential state of a Secret only if its stored encrypted value still equals
        /// <paramref name="expectedValueEncrypted"/> (compare-and-swap, G-22). Name, kind, description, expiry, and
        /// flags are not written. Used by the Codex login refresh so that a refresh never overwrites a value an operator
        /// replaced in the meantime.
        /// </summary>
        /// <param name="obj">Record carrying the new value (encrypted), last four characters, fingerprint, key version, and credential state.</param>
        /// <param name="expectedValueEncrypted">Encrypted value the row must still hold, or null to require no value.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the row was updated; false when the value changed or the row is gone.</returns>
        /// <exception cref="System.ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryUpdateCredentialAsync(Secret obj, string? expectedValueEncrypted, CancellationToken token = default);

        /// <summary>
        /// Read every active Secret of a kind across all tenants, ordered by identifier. For the control plane's
        /// background credential refresh; never exposed to callers.
        /// </summary>
        /// <param name="kind">Kind.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Secrets.</returns>
        Task<List<Secret>> ReadActiveByKindAsync(SecretKindEnum kind, CancellationToken token = default);

        /// <summary>
        /// Delete a Secret and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a Secret exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate Secret records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<Secret>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);
    }
}
