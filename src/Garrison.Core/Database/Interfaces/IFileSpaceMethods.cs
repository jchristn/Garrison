namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Conversation file spaces, their files and versions, and database-held content (AD3). Every read that takes a
    /// tenant filters by it.
    /// </summary>
    public interface IFileSpaceMethods
    {
        /// <summary>
        /// Return the tenant's space for an owner key, creating it from the template when it does not exist yet. Safe
        /// under concurrency: a racing creator reads the winner.
        /// </summary>
        /// <param name="template">Space to create (TenantId and OwnerKey set).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The space.</returns>
        /// <exception cref="ArgumentNullException">Thrown when template is null.</exception>
        Task<ConversationFileSpace> GetOrCreateAsync(ConversationFileSpace template, CancellationToken token = default);

        /// <summary>
        /// Read a space in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Space identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Space or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<ConversationFileSpace?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a space by owner key.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="ownerKey">Owner key, for example cnv:cnv_....</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Space or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<ConversationFileSpace?> ReadByOwnerAsync(string tenantId, string ownerKey, CancellationToken token = default);

        /// <summary>
        /// List a space's files, ordered by path.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="includeDeleted">Whether to include deleted files.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Files.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<ConversationFile>> ListFilesAsync(string tenantId, string spaceId, bool includeDeleted, CancellationToken token = default);

        /// <summary>
        /// Read one file by path.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="path">Path.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<ConversationFile?> ReadFileAsync(string tenantId, string spaceId, string path, CancellationToken token = default);

        /// <summary>
        /// A file's versions, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="fileId">File identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<ConversationFileVersion>> ListVersionsAsync(string tenantId, string fileId, CancellationToken token = default);

        /// <summary>
        /// Read one version of a file.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="fileId">File identifier.</param>
        /// <param name="number">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Version or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<ConversationFileVersion?> ReadVersionAsync(string tenantId, string fileId, int number, CancellationToken token = default);

        /// <summary>
        /// Commit a new version of a file in one transaction: check the base version, insert the version, update the
        /// file row and the space's counts, and store database-held content. The base check compares the version the
        /// writer read (0 when the file did not exist or was deleted) with the current one.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="path">Path.</param>
        /// <param name="baseVersion">Version the writer read, or null to skip the check.</param>
        /// <param name="version">Version metadata (Number and FileId are assigned).</param>
        /// <param name="databaseContent">Content to keep in the database, or null when it lives in an artifact store.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The committed version, or null when the base version is stale and nothing was written.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        Task<ConversationFileVersion?> CommitAsync(string tenantId, string spaceId, string path, int? baseVersion, ConversationFileVersion version, byte[]? databaseContent, CancellationToken token = default);

        /// <summary>
        /// Mark a file deleted and update the space's counts. Versions are kept.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="path">Path.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a file was deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteFileAsync(string tenantId, string spaceId, string path, CancellationToken token = default);

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
        /// Every storage key a space's versions use, for removing external content.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Distinct storage keys.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<string>> StorageKeysAsync(string tenantId, string spaceId, CancellationToken token = default);

        /// <summary>
        /// Delete a space with its files, versions, and database-held content.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">Space identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteSpaceAsync(string tenantId, string spaceId, CancellationToken token = default);

        /// <summary>
        /// Spaces whose owner (conversation, pipeline run, or root run) no longer exists, for retention.
        /// </summary>
        /// <param name="max">Most spaces to return.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Orphaned spaces.</returns>
        Task<List<ConversationFileSpace>> ListOrphansAsync(int max, CancellationToken token = default);

        /// <summary>
        /// Paths of the files one run wrote in a space (any version), sorted, for fan-out gather results (AD5.3).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="spaceId">File space identifier.</param>
        /// <param name="runId">Writing run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Paths.</returns>
        Task<List<string>> PathsWrittenByRunAsync(string tenantId, string spaceId, string runId, CancellationToken token = default);
    }
}
