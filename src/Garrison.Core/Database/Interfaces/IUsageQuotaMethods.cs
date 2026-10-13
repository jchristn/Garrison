namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// UsageQuota data access methods.
    /// </summary>
    public interface IUsageQuotaMethods
    {
        /// <summary>
        /// Create a UsageQuota.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<UsageQuota> CreateAsync(UsageQuota obj, CancellationToken token = default);

        /// <summary>
        /// Read a UsageQuota by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<UsageQuota?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a UsageQuota by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<UsageQuota?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a UsageQuota by name within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<UsageQuota?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Update a UsageQuota.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<UsageQuota> UpdateAsync(UsageQuota obj, CancellationToken token = default);

        /// <summary>
        /// Delete a UsageQuota.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a UsageQuota exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate UsageQuota records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<UsageQuota>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>Read a quota for an exact tenant, scope, and resource, including inactive entries.</summary>
        /// <param name="tenantId">Tenant.</param>
        /// <param name="scope">Scope.</param>
        /// <param name="resourceId">Target ID.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Quota or null.</returns>
        Task<UsageQuota?> ReadByResourceAsync(string tenantId, UsageQuotaScopeEnum scope, string resourceId, CancellationToken token = default);

        /// <summary>List active quotas with enforcement enabled covering a run, scoped to its tenant.</summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Matching quotas.</returns>
        Task<List<UsageQuota>> ListForRunAsync(Run run, CancellationToken token = default);

        /// <summary>Read daily usage and active concurrency, retaining deleted runs. Cost incompleteness never counts as zero.</summary>
        /// <param name="quota">Tenant-scoped quota.</param>
        /// <param name="utc">UTC day to inspect.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Usage.</returns>
        Task<UsageQuotaUsage> ReadUsageAsync(UsageQuota quota, System.DateTime utc, CancellationToken token = default);
    }
}
