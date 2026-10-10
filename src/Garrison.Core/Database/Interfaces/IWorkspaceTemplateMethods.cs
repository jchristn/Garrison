namespace Garrison.Core.Database.Interfaces
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// WorkspaceTemplate data access methods.
    /// </summary>
    public interface IWorkspaceTemplateMethods
    {
        /// <summary>
        /// Create a WorkspaceTemplate, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<WorkspaceTemplate> CreateAsync(WorkspaceTemplate obj, CancellationToken token = default);

        /// <summary>
        /// Read a WorkspaceTemplate by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<WorkspaceTemplate?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a WorkspaceTemplate by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<WorkspaceTemplate?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a WorkspaceTemplate by name within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<WorkspaceTemplate?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Update a WorkspaceTemplate, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<WorkspaceTemplate> UpdateAsync(WorkspaceTemplate obj, CancellationToken token = default);

        /// <summary>
        /// Delete a WorkspaceTemplate and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a WorkspaceTemplate exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate WorkspaceTemplate records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<WorkspaceTemplate>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);
    }
}
