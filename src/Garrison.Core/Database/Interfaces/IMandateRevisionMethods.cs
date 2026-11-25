namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Mandate revisions with their signals (AA1). Published revisions are immutable: only drafts can be updated.
    /// </summary>
    public interface IMandateRevisionMethods
    {
        /// <summary>
        /// Insert a revision and its signals. The number must be unique within the mandate.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<MandateRevision> CreateAsync(MandateRevision obj, CancellationToken token = default);

        /// <summary>
        /// Read a revision with its signals in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<MandateRevision?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Replace a draft revision's fields and signals. Does nothing when the revision is no longer a draft.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when updated.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> UpdateDraftAsync(MandateRevision obj, CancellationToken token = default);

        /// <summary>
        /// Publish a draft revision: Draft becomes Published with the given time. Exactly one caller wins.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="publishedUtc">Publish time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when published by this call.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> PublishAsync(string tenantId, string id, DateTime publishedUtc, CancellationToken token = default);

        /// <summary>
        /// Next free revision number of a mandate (the highest number plus one, or 1).
        /// </summary>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number.</returns>
        /// <exception cref="ArgumentNullException">Thrown when mandateId is null or empty.</exception>
        Task<int> NextNumberAsync(string mandateId, CancellationToken token = default);

        /// <summary>
        /// Enumerate a mandate's revisions with their signals, highest number first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="query">Query (paging and ordering).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<MandateRevision>> EnumerateAsync(string tenantId, string mandateId, EnumerationQuery query, CancellationToken token = default);
    }
}
