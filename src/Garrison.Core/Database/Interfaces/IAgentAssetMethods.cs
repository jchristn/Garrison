namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Agent assets, their versions and files, and database-held asset content (AD2). Every read that takes a tenant
    /// filters by it.
    /// </summary>
    public interface IAgentAssetMethods
    {
        /// <summary>
        /// Insert an asset with its tags.
        /// </summary>
        /// <param name="obj">Asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<AgentAsset> CreateAsync(AgentAsset obj, CancellationToken token = default);

        /// <summary>
        /// Read an asset in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Asset or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<AgentAsset?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read an asset by name in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Asset or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<AgentAsset?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Replace an asset's description, prompt template, store, and tags. The current version is not changed here.
        /// </summary>
        /// <param name="obj">Asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<AgentAsset> UpdateAsync(AgentAsset obj, CancellationToken token = default);

        /// <summary>
        /// Delete an asset with its tags, versions, files, and database-held content. External store objects are removed
        /// by the caller.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's assets. Search matches the name; an optional kind filter narrows the list.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="kind">Kind filter, or null.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or query is null.</exception>
        Task<EnumerationResult<AgentAsset>> EnumerateAsync(string tenantId, AgentAssetKindEnum? kind, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Insert the next version of an asset with its files, store database-held content (content-addressed, so the
        /// same bytes are stored once), and advance the asset's current version, in one transaction. The version number
        /// is assigned here.
        /// </summary>
        /// <param name="version">Version with files (StorageKey set).</param>
        /// <param name="databaseContent">Content to keep in the database, by storage key, or null when the files live in
        /// an artifact store.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when version is null.</exception>
        Task<AgentAssetVersion> CreateVersionAsync(AgentAssetVersion version, Dictionary<string, byte[]>? databaseContent, CancellationToken token = default);

        /// <summary>
        /// Read one version of an asset with its files.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="assetId">Asset identifier.</param>
        /// <param name="number">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Version or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<AgentAssetVersion?> ReadVersionAsync(string tenantId, string assetId, int number, CancellationToken token = default);

        /// <summary>
        /// Every version of an asset, newest first, with files.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="assetId">Asset identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<AgentAssetVersion>> ListVersionsAsync(string tenantId, string assetId, CancellationToken token = default);

        /// <summary>
        /// Read database-held content by storage key.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="storageKey">Storage key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Bytes or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<byte[]?> ReadContentAsync(string tenantId, string storageKey, CancellationToken token = default);

        /// <summary>
        /// Names of agents whose revisions pin an asset, for the delete guard.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="assetId">Asset identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent names, distinct and ordered.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<string>> AgentsPinningAsync(string tenantId, string assetId, CancellationToken token = default);
    }
}
