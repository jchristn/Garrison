namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Capability descriptor data access (AD4). Reads for a tenant include the descriptors every tenant shares (a null
    /// tenant). Writes replace a descriptor with its tags and requirements in one transaction.
    /// </summary>
    public interface ICapabilityMethods
    {
        /// <summary>
        /// Insert a descriptor with its tags and requirements.
        /// </summary>
        /// <param name="obj">Descriptor.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored descriptor.</returns>
        Task<CapabilityDescriptor> CreateAsync(CapabilityDescriptor obj, CancellationToken token = default);

        /// <summary>
        /// Replace a descriptor's content, tags, and requirements. Hints are kept unless the caller changed them.
        /// </summary>
        /// <param name="obj">Descriptor.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored descriptor.</returns>
        Task<CapabilityDescriptor> UpdateAsync(CapabilityDescriptor obj, CancellationToken token = default);

        /// <summary>
        /// Read a descriptor visible to a tenant: its own or a shared one.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptor or null.</returns>
        Task<CapabilityDescriptor?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the descriptor of one source in one scope.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for shared descriptors.</param>
        /// <param name="sourceKey">Source key, for example agent:agt_... .</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptor or null.</returns>
        Task<CapabilityDescriptor?> ReadBySourceAsync(string? tenantId, string sourceKey, CancellationToken token = default);

        /// <summary>
        /// Every descriptor visible to a tenant (its own and shared ones), optionally of one kind, ordered by kind and
        /// name. At most 5000.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="kind">Kind filter, or null for all.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors.</returns>
        Task<List<CapabilityDescriptor>> ListAsync(string tenantId, CapabilityKindEnum? kind, CancellationToken token = default);

        /// <summary>
        /// The descriptors stored in exactly one scope (a tenant, or the shared scope for null), of one kind and origin,
        /// without children. Used by refresh to find descriptors whose source is gone.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for the shared scope.</param>
        /// <param name="kind">Kind.</param>
        /// <param name="origin">Origin.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptors.</returns>
        Task<List<CapabilityDescriptor>> ListInScopeAsync(string? tenantId, CapabilityKindEnum kind, CapabilityOriginEnum origin, CancellationToken token = default);

        /// <summary>
        /// Delete a descriptor in one scope with its children.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for the shared scope.</param>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a descriptor was deleted.</returns>
        Task<bool> DeleteAsync(string? tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Store new hints on a descriptor.
        /// </summary>
        /// <param name="id">Descriptor identifier.</param>
        /// <param name="hints">Hints.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task UpdateHintsAsync(string id, CapabilityHints hints, CancellationToken token = default);

        /// <summary>
        /// Record (or clear, with null) the refresh warning on every descriptor of one MCP server, keeping their content.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mcpServerId">MCP server identifier.</param>
        /// <param name="warning">Warning, or null to clear.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of descriptors marked.</returns>
        Task<int> SetServerWarningAsync(string tenantId, string mcpServerId, string? warning, CancellationToken token = default);

        /// <summary>
        /// The most recent finished runs (Succeeded or Failed, with start and completion times) of one agent since a
        /// time, newest first, for cost and latency hints (AD4.5).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="sinceUtc">Earliest completion time (UTC).</param>
        /// <param name="max">Most samples returned, 1 to 100000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Samples.</returns>
        Task<List<CapabilityRunSample>> RunSamplesAsync(string tenantId, string agentId, System.DateTime sinceUtc, int max, CancellationToken token = default);
    }
}
