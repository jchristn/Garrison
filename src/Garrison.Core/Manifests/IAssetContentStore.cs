namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>
    /// Asset content access the manifest service needs (AD2.6): uploading a version from a document and reading text
    /// content for export. The server implements it on top of its asset storage.
    /// </summary>
    public interface IAssetContentStore
    {
        /// <summary>
        /// Upload a new version of an asset. Files carry ContentBase64.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="files">Files with ContentBase64 set.</param>
        /// <param name="changeNote">Optional change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored version.</returns>
        Task<AgentAssetVersion> UploadAsync(string tenantId, AgentAsset asset, List<AgentAssetFile> files, string? changeNote, CancellationToken token);

        /// <summary>
        /// Read one file's verified content.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="file">File metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Bytes.</returns>
        Task<byte[]> ReadAsync(string tenantId, AgentAsset asset, AgentAssetFile file, CancellationToken token);
    }
}
