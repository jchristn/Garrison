namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Promotion records (AD1.4). Applying a promotion or a rollback repins deployments and writes the record in one
    /// transaction. Every read that takes a tenant filters by it.
    /// </summary>
    public interface IPromotionRecordMethods
    {
        /// <summary>
        /// Repin the record's deployments to each item's NewRevisionId and insert the record with its items, in one
        /// transaction. For a rollback (RollbackOfId set), the reverted promotion is marked RolledBack in the same
        /// transaction.
        /// </summary>
        /// <param name="record">Record with items.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when record is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when a deployment no longer exists in the tenant, or the
        /// reverted promotion was already rolled back; nothing is changed.</exception>
        Task<PromotionRecord> ApplyAsync(PromotionRecord record, CancellationToken token = default);

        /// <summary>
        /// Read a record in a tenant with its items.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<PromotionRecord?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's records, newest first, with items. Optional filters on agent and app.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent filter, or null.</param>
        /// <param name="appId">App filter, or null.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or query is null.</exception>
        Task<EnumerationResult<PromotionRecord>> EnumerateAsync(string tenantId, string? agentId, string? appId, EnumerationQuery query, CancellationToken token = default);
    }
}
