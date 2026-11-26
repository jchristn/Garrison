namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Change rule data access (AA8.4). Classes and limits live in child tables. Every read filters by tenant.
    /// Implementations are thread-safe.
    /// </summary>
    public interface IChangeRuleMethods
    {
        /// <summary>
        /// Insert a rule with its classes and limits.
        /// </summary>
        /// <param name="obj">Rule.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<ChangeRule> CreateAsync(ChangeRule obj, CancellationToken token = default);

        /// <summary>
        /// Replace a rule's fields, classes, and limits.
        /// </summary>
        /// <param name="obj">Rule.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored rule.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<ChangeRule> UpdateAsync(ChangeRule obj, CancellationToken token = default);

        /// <summary>
        /// Read a rule in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Rule identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The rule, or null.</returns>
        Task<ChangeRule?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate rules, newest first, optionally for one organization and unit.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization filter, or null.</param>
        /// <param name="unitId">Unit filter, or null.</param>
        /// <param name="query">Paging; ActiveOnly limits to active rules.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<ChangeRule>> EnumerateAsync(string tenantId, string? organizationId, string? unitId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Every active rule of an organization that has not expired at a time, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="utc">Time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rules.</returns>
        Task<List<ChangeRule>> ListInForceAsync(string tenantId, string organizationId, DateTime utc, CancellationToken token = default);

        /// <summary>
        /// Delete a rule and its classes and limits.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Rule identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Delete every rule of an organization (the organization is being deleted).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="organizationId">Organization identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rules deleted.</returns>
        Task<int> DeleteForOrganizationAsync(string tenantId, string organizationId, CancellationToken token = default);
    }
}
