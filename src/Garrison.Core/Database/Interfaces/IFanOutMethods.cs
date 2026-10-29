namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Fan-out group data access (AD5). Thread-safe.
    /// </summary>
    public interface IFanOutMethods
    {
        /// <summary>
        /// Insert a group with its members in one transaction.
        /// </summary>
        /// <param name="group">Group.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored group.</returns>
        Task<FanOutGroup> CreateAsync(FanOutGroup group, CancellationToken token = default);

        /// <summary>
        /// Read a group of a tenant with its members.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Group identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Group or null.</returns>
        Task<FanOutGroup?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the group a parent created from an identical request, with its members.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="parentRunId">Parent run.</param>
        /// <param name="requestDigest">Request digest.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Group or null.</returns>
        Task<FanOutGroup?> ReadByDigestAsync(string tenantId, string parentRunId, string requestDigest, CancellationToken token = default);

        /// <summary>
        /// A parent run's groups, oldest first, with members.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="parentRunId">Parent run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Groups.</returns>
        Task<List<FanOutGroup>> ListByParentAsync(string tenantId, string parentRunId, CancellationToken token = default);

        /// <summary>
        /// Running groups across tenants, oldest first, without members, for the leader sweep.
        /// </summary>
        /// <param name="max">Most groups returned, 1 to 10000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Groups.</returns>
        Task<List<FanOutGroup>> ListRunningAsync(int max, CancellationToken token = default);

        /// <summary>
        /// Record the members' usage on a running group.
        /// </summary>
        /// <param name="id">Group identifier.</param>
        /// <param name="costUsd">Cost in US dollars.</param>
        /// <param name="tokens">Input plus output tokens.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task UpdateUsageAsync(string id, double costUsd, long tokens, CancellationToken token = default);

        /// <summary>
        /// End a group: move it from Running to a final status, once. Compare-and-set, so concurrent evaluators agree.
        /// </summary>
        /// <param name="id">Group identifier.</param>
        /// <param name="status">Final status.</param>
        /// <param name="reason">Why.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call ended the group.</returns>
        Task<bool> EndAsync(string id, FanOutGroupStatusEnum status, string reason, CancellationToken token = default);

        /// <summary>
        /// Delete groups whose parent run no longer exists (retention).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Groups deleted.</returns>
        Task<int> RemoveOrphansAsync(CancellationToken token = default);
    }
}
