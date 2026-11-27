namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Data access for messages between agents (AA6). Every method that takes a tenant filters by it. Status changes are
    /// compare-and-set on the current status, so several replicas never deliver, acknowledge, or expire a message twice.
    /// </summary>
    public interface IAgentMessageMethods
    {
        /// <summary>
        /// Insert a message with its artifacts in one transaction.
        /// </summary>
        /// <param name="obj">Message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The message.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<AgentMessage> CreateAsync(AgentMessage obj, CancellationToken token = default);

        /// <summary>
        /// Read a message with its artifacts.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Message identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The message, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<AgentMessage?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the message with a send key, so a replayed send returns it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="sendKey">Send key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The message, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or sendKey is null or empty.</exception>
        Task<AgentMessage?> ReadBySendKeyAsync(string tenantId, string sendKey, CancellationToken token = default);

        /// <summary>
        /// List messages, newest first, with their artifacts.
        /// </summary>
        /// <param name="filter">Filter; TenantId is required.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>One page and the total count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its TenantId is null.</exception>
        Task<EnumerationResult<AgentMessage>> EnumerateAsync(AgentMessageFilter filter, CancellationToken token = default);

        /// <summary>
        /// Every message in a thread, oldest first, with their artifacts. At most 1000.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="threadId">Thread identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or threadId is null or empty.</exception>
        Task<List<AgentMessage>> ListThreadAsync(string tenantId, string threadId, CancellationToken token = default);

        /// <summary>
        /// Count messages that were not rejected from a sender to a recipient sent at or after a time: the sliding window of
        /// Messaging.LineRatePerMinute, read from the database so it holds across replicas.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="senderAgentId">Sending agent, or null for a person.</param>
        /// <param name="senderPrincipalId">Sending principal, used when senderAgentId is null.</param>
        /// <param name="recipientAgentId">Recipient agent.</param>
        /// <param name="sinceUtc">Window start (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or recipientAgentId is null or empty.</exception>
        Task<long> CountLineAsync(string tenantId, string? senderAgentId, string? senderPrincipalId, string recipientAgentId, DateTime sinceUtc, CancellationToken token = default);

        /// <summary>
        /// Count messages in a thread that were not rejected (Messaging.ThreadBudget).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="threadId">Thread identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or threadId is null or empty.</exception>
        Task<long> CountThreadAsync(string tenantId, string threadId, CancellationToken token = default);

        /// <summary>
        /// Count urgent messages that woke a recipient at or after a time (Messaging.UrgentWakesPerHour).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="recipientAgentId">Recipient agent.</param>
        /// <param name="sinceUtc">Window start (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or recipientAgentId is null or empty.</exception>
        Task<long> CountWakesAsync(string tenantId, string recipientAgentId, DateTime sinceUtc, CancellationToken token = default);

        /// <summary>
        /// The largest hop count among the messages delivered to a run, or null when none were.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Hop count, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or runId is null or empty.</exception>
        Task<int?> MaxDeliveredHopAsync(string tenantId, string runId, CancellationToken token = default);

        /// <summary>
        /// Claim up to a number of a recipient's queued, unexpired, unclaimed messages, oldest first, for one delivery. The
        /// claim is compare-and-set, so two replicas never claim the same message.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="recipientAgentId">Recipient agent.</param>
        /// <param name="claim">Claim identifier.</param>
        /// <param name="max">Most messages to claim. Minimum 1.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The claimed messages, oldest first, with their artifacts.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId, recipientAgentId, or claim is null or empty.</exception>
        Task<List<AgentMessage>> ClaimQueuedAsync(string tenantId, string recipientAgentId, string claim, int max, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Mark the messages held by a claim Delivered to a run and release the claim.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="claim">Claim identifier.</param>
        /// <param name="runId">Run the messages were delivered to.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages marked.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<int> MarkDeliveredAsync(string tenantId, string claim, string runId, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Release a claim without delivering, leaving its messages queued.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="claim">Claim identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages released.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or claim is null or empty.</exception>
        Task<int> ReleaseClaimAsync(string tenantId, string claim, CancellationToken token = default);

        /// <summary>
        /// Put messages delivered to a run that failed before it reported back in the queue (AA12.7), so the agent's next
        /// tick or inbox read delivers them again. Acknowledged messages stay acknowledged.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">The failed run.</param>
        /// <param name="nowUtc">Now (UTC), recorded as lastUpdateUtc.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages put back in the queue.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or runId is null or empty.</exception>
        Task<int> RequeueDeliveredAsync(string tenantId, string runId, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Release claims held since before a time, left behind by a replica that stopped while starting a run.
        /// </summary>
        /// <param name="olderThanUtc">Claims last updated before this time are released.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages released.</returns>
        Task<int> ReleaseStaleClaimsAsync(DateTime olderThanUtc, CancellationToken token = default);

        /// <summary>
        /// Record that an urgent message woke its recipient.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Message identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task SetWokeAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Acknowledge a delivered message on behalf of its recipient.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Message identifier.</param>
        /// <param name="recipientAgentId">The acknowledging agent; must be the recipient.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the message moved from Delivered to Acknowledged.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> AcknowledgeAsync(string tenantId, string id, string recipientAgentId, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Expire queued, unclaimed messages whose expiry has passed, across tenants.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="limit">Most messages to expire. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The messages this call expired.</returns>
        Task<List<AgentMessage>> ExpireAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Expire every queued message addressed to one recipient, claimed or not, whatever its expiry (AA11.4 cascade
        /// cancel). A claimed message loses its claim, so the delivery that held it delivers nothing.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="recipientAgentId">Recipient agent identifier.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="limit">Most messages to expire. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The messages this call expired.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or recipientAgentId is null or empty.</exception>
        Task<List<AgentMessage>> ExpireQueuedForRecipientAsync(string tenantId, string recipientAgentId, DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Messages to a recipient whose status changed after a cursor, in change order, for the agent-inbox channel.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="recipientAgentId">Recipient agent.</param>
        /// <param name="afterUtc">Cursor time (UTC).</param>
        /// <param name="afterId">Cursor message identifier at that time, or null.</param>
        /// <param name="limit">Most messages to return. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Messages, oldest change first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or recipientAgentId is null or empty.</exception>
        Task<List<AgentMessage>> ListChangedAfterAsync(string tenantId, string recipientAgentId, DateTime afterUtc, string? afterId, int limit, CancellationToken token = default);

        /// <summary>
        /// Messages each of the given agents sent in [fromUtc, toUtc) that the loop guards refused (AA11.1): rejected with
        /// HopLimit, LineRate, or ThreadBudget. NoLine and Frozen refusals are not loop guards and are not counted.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="senderAgentIds">Sending agents; an empty list returns an empty map.</param>
        /// <param name="fromUtc">Inclusive start (UTC).</param>
        /// <param name="toUtc">Exclusive end (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count by sending agent identifier; agents without refusals are absent.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty or senderAgentIds is null.</exception>
        Task<Dictionary<string, long>> CountLoopGuardRejectionsAsync(string tenantId, List<string> senderAgentIds, DateTime fromUtc, DateTime toUtc, CancellationToken token = default);
    }
}
