namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// Agent revisions (AD1) with their prompt pins, allow list, capabilities, and tags. A published revision is never
    /// changed by any method here. Every read that takes a tenant filters by it.
    /// </summary>
    public interface IAgentRevisionMethods
    {
        /// <summary>
        /// Read a revision in a tenant, with its child lists.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<AgentRevision?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a revision of an agent by number.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="number">Revision number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<AgentRevision?> ReadByNumberAsync(string tenantId, string agentId, int number, CancellationToken token = default);

        /// <summary>
        /// Enumerate an agent's revisions, newest number first, with child lists.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="query">Query (paging; ordering is always by number, descending).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<AgentRevision>> EnumerateAsync(string tenantId, string agentId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Every revision of an agent, oldest first, with child lists.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revisions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<AgentRevision>> ListAsync(string tenantId, string agentId, CancellationToken token = default);

        /// <summary>
        /// Create the agent's draft, or replace the content of its open draft. The draft gets the next free number when it
        /// is created; the agent's draft pointer is set in the same transaction.
        /// </summary>
        /// <param name="draft">Draft content (TenantId and AgentId set; Id and Number are assigned).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored draft.</returns>
        /// <exception cref="ArgumentNullException">Thrown when draft is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the agent does not exist in the tenant.</exception>
        Task<AgentRevision> SaveDraftAsync(AgentRevision draft, CancellationToken token = default);

        /// <summary>
        /// Publish a draft: freeze it, write its content onto the agent row (so the agent shows its latest published
        /// definition), set the agent's latest published pointer, and clear its draft pointer, in one transaction.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="revisionId">Draft revision identifier.</param>
        /// <param name="publishedByUserId">Publisher user identifier, or null.</param>
        /// <param name="publishedByName">Publisher display name, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The published revision, or null when no draft with that identifier exists in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null or empty.</exception>
        Task<AgentRevision?> PublishAsync(string tenantId, string revisionId, string? publishedByUserId, string? publishedByName, CancellationToken token = default);

        /// <summary>
        /// Delete an open draft and clear the agent's draft pointer. Published revisions cannot be deleted.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="revisionId">Draft revision identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a draft was deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DiscardDraftAsync(string tenantId, string revisionId, CancellationToken token = default);

        /// <summary>
        /// Write revision 1 (Published) for every agent that has no published revision yet. Idempotent; run by the
        /// driver after migrations while it holds the startup lock.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of agents backfilled.</returns>
        Task<int> BackfillAsync(CancellationToken token = default);
    }
}
