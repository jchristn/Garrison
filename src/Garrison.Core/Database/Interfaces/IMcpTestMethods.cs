namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>Transient worker diagnostic queue. Atomic single claim, registration fencing, and structured outcomes.</summary>
    public interface IMcpTestMethods
    {
        /// <summary>Enqueue at most one diagnostic per selected worker. Throws on a conflicting active entry.</summary>
        Task<McpTestQueueEntry> CreateAsync(McpTestQueueEntry entry, CancellationToken token = default);
        /// <summary>Read an entry and its outcome only within the owning tenant.</summary>
        Task<McpTestQueueEntry?> ReadAsync(string tenantId, string id, CancellationToken token = default);
        /// <summary>Claim once for the current worker registration; expired entries cannot be claimed.</summary>
        Task<McpTestQueueEntry?> ClaimAsync(string nodeId, DateTime registeredUtc, CancellationToken token = default);
        /// <summary>Complete only the claimed, unexpired test held by this worker registration.</summary>
        Task<bool> CompleteAsync(string nodeId, DateTime registeredUtc, string id, McpServerTestResponse result, CancellationToken token = default);
        /// <summary>Delete an owning tenant's entry and child outcomes.</summary>
        Task DeleteAsync(string tenantId, string id, CancellationToken token = default);
        /// <summary>Remove expired entries and child outcomes; the queue contains no credentials.</summary>
        Task RemoveExpiredAsync(CancellationToken token = default);
    }
}
