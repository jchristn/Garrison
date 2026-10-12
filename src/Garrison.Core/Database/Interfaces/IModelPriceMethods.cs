namespace Garrison.Core.Database.Interfaces
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// ModelPrice data access methods.
    /// </summary>
    public interface IModelPriceMethods
    {
        /// <summary>
        /// Create a ModelPrice.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<ModelPrice> CreateAsync(ModelPrice obj, CancellationToken token = default);

        /// <summary>
        /// Read a ModelPrice by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<ModelPrice?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a ModelPrice by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<ModelPrice?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a ModelPrice by name within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<ModelPrice?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Update a ModelPrice.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<ModelPrice> UpdateAsync(ModelPrice obj, CancellationToken token = default);

        /// <summary>
        /// Delete a ModelPrice.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a ModelPrice exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate ModelPrice records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<ModelPrice>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>Find a configured rate for an exact tenant, harness, and served-model match.</summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="harnessType">Harness type.</param>
        /// <param name="model">Exact served model.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Price (including disabled entries), or null when no rate is configured.</returns>
        Task<ModelPrice?> ReadByModelAsync(string tenantId, HarnessTypeEnum harnessType, string model, CancellationToken token = default);
    }
}
