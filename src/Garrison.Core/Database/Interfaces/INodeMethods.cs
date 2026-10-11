namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>
    /// Node data access methods.
    /// </summary>
    public interface INodeMethods
    {
        /// <summary>
        /// Create a Node, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<Node> CreateAsync(Node obj, CancellationToken token = default);

        /// <summary>
        /// Read a Node by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Node?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a Node by name.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Node?> ReadByNameAsync(string name, CancellationToken token = default);

        /// <summary>
        /// Update a Node, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<Node> UpdateAsync(Node obj, CancellationToken token = default);

        /// <summary>
        /// Delete a Node and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a Node exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate Node records.
        /// </summary>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<Node>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Record a heartbeat.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="activeRuns">Runs currently held.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task TouchHeartbeatAsync(string nodeId, int activeRuns, CancellationToken token = default);

        /// <summary>
        /// Nodes whose last heartbeat is older than a cutoff and that are not already Lost or Offline.
        /// </summary>
        /// <param name="cutoffUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Nodes.</returns>
        Task<List<Node>> ListStaleAsync(DateTime cutoffUtc, CancellationToken token = default);

        /// <summary>
        /// Set a node's status.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="status">Status.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when updated.</returns>
        Task<bool> SetStatusAsync(string nodeId, NodeStatusEnum status, CancellationToken token = default);

        /// <summary>
        /// Count nodes per status, for the nodes gauge (P13.24).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Counts per status; statuses with no nodes are absent.</returns>
        Task<List<StatusCount>> CountByStatusAsync(CancellationToken token = default);
    }
}
