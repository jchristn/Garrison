namespace Garrison.Core.Database.Interfaces
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// NodePool data access methods.
    /// </summary>
    public interface INodePoolMethods
    {
        /// <summary>
        /// Create a NodePool, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<NodePool> CreateAsync(NodePool obj, CancellationToken token = default);

        /// <summary>
        /// Read a NodePool by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<NodePool?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a NodePool by name.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<NodePool?> ReadByNameAsync(string name, CancellationToken token = default);

        /// <summary>
        /// Update a NodePool, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<NodePool> UpdateAsync(NodePool obj, CancellationToken token = default);

        /// <summary>
        /// Delete a NodePool and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a NodePool exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate NodePool records.
        /// </summary>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<NodePool>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default);
    }
}
