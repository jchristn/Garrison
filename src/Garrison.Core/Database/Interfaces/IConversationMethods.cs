namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Conversation data access methods.
    /// </summary>
    public interface IConversationMethods
    {
        /// <summary>
        /// Create a Conversation.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<Conversation> CreateAsync(Conversation obj, CancellationToken token = default);

        /// <summary>
        /// Read a Conversation by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Conversation?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a Conversation by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Conversation?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the Conversation created for a client-supplied A2A context identifier with an agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="contextId">Client-supplied context identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Conversation?> ReadByContextIdAsync(string tenantId, string agentId, string contextId, CancellationToken token = default);

        /// <summary>
        /// Update every column of a Conversation.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<Conversation> UpdateAsync(Conversation obj, CancellationToken token = default);

        /// <summary>
        /// Delete a Conversation. Its runs are kept and keep their conversation identifier.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a Conversation exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate Conversation records with a typed filter.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<Conversation>> EnumerateAsync(ConversationFilter filter, CancellationToken token = default);

        /// <summary>
        /// Make a run the conversation's active turn, compare-and-set on the current active run: succeeds only when the
        /// conversation's active run is still <paramref name="expectedActiveRunId"/> (null meaning none). This is what
        /// serializes the turns of one conversation across replicas.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="expectedActiveRunId">Active run the caller saw (finished or missing), or null when there was none.</param>
        /// <param name="runId">Run of the new turn.</param>
        /// <param name="nowUtc">Current time, recorded as the last activity.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run became the active turn.</returns>
        Task<bool> TryAcquireTurnAsync(string id, string? expectedActiveRunId, string runId, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Give back a turn that was acquired but never created (the run insert failed or returned an existing run):
        /// restores the previous active run while the conversation's active run is still <paramref name="runId"/>.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="runId">Run that was acquired.</param>
        /// <param name="previousActiveRunId">Active run before the acquire, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the turn was released.</returns>
        Task<bool> ReleaseTurnAsync(string id, string runId, string? previousActiveRunId, CancellationToken token = default);

        /// <summary>
        /// Record the start of a turn that was acquired: the last run, the turn count, the deployment, harness type, and
        /// title (set once).
        /// </summary>
        /// <param name="obj">Conversation with the new values.</param>
        /// <param name="runId">Run of the turn; the update applies only while it is the active run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when recorded.</returns>
        Task<bool> RecordTurnStartedAsync(Conversation obj, string runId, CancellationToken token = default);

        /// <summary>
        /// Record a successful turn: the harness session the next turn resumes, the profile that created it, and the node
        /// that now holds the conversation's directories (null for executors that keep no state).
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="runId">Run of the turn; the update applies only while it is the active run.</param>
        /// <param name="sessionId">Harness session, or null when the harness reported none.</param>
        /// <param name="harnessProfileId">Harness profile that created the session.</param>
        /// <param name="nodeId">Affinity node, or null.</param>
        /// <param name="nodeName">Affinity node name, or null.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when recorded.</returns>
        Task<bool> RecordTurnSucceededAsync(string id, string runId, string? sessionId, string? harnessProfileId, string? nodeId, string? nodeName, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Record that a turn fell back to a fresh session seeded with the transcript: increments the fallback count,
        /// records the reason and time, and drops the node affinity.
        /// </summary>
        /// <param name="id">Conversation identifier.</param>
        /// <param name="reason">Fallback reason.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when recorded.</returns>
        Task<bool> RecordFallbackAsync(string id, ConversationFallbackReasonEnum reason, DateTime nowUtc, CancellationToken token = default);
    }
}
