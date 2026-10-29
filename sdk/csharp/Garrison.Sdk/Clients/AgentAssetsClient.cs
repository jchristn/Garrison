namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Agent assets: versioned system prompts, skills, reference files, and document templates that agent revisions pin.
    /// Assets are addressed by identifier or name; versions by number. Thread-safe.
    /// </summary>
    public class AgentAssetsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AgentAssetsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List agent assets.
        /// </summary>
        /// <param name="kind">Optional kind filter; null lists every kind.</param>
        /// <param name="query">Optional paging, ordering, and search.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<AgentAsset>> ListAsync(AgentAssetKindEnum? kind = null, EnumerationQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            if (kind != null) parameters["kind"] = kind.Value.ToString();
            return await Transport.SendAsync<EnumerationResult<AgentAsset>>(HttpMethod.Get, Assets(), null, parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<AgentAsset>();
        }

        /// <summary>
        /// Create an agent asset. Upload content with <see cref="UploadVersionAsync"/>.
        /// </summary>
        /// <param name="asset">Asset metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when asset is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentAsset> CreateAsync(AgentAsset asset, CancellationToken token = default)
        {
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            return await Transport.SendAsync<AgentAsset>(HttpMethod.Post, Assets(), asset, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read an agent asset.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The asset.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentAsset> GetAsync(string assetId, CancellationToken token = default)
        {
            return await Transport.SendAsync<AgentAsset>(HttpMethod.Get, Asset(assetId), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Update an agent asset's metadata.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="asset">Asset metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when asset is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentAsset> UpdateAsync(string assetId, AgentAsset asset, CancellationToken token = default)
        {
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            return await Transport.SendAsync<AgentAsset>(HttpMethod.Put, Asset(assetId), asset, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete an agent asset. The server answers 409 with code AssetInUse while an agent revision pins it.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="GarrisonException">Thrown on a non-success status, including 409 AssetInUse.</exception>
        public async Task DeleteAsync(string assetId, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Asset(assetId), token: token).ConfigureAwait(false);
        }

        /// <summary>
        /// List an asset's versions, newest first.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Versions.</returns>
        public async Task<List<AgentAssetVersion>> ListVersionsAsync(string assetId, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<AgentAssetVersion>>(HttpMethod.Get, Versions(assetId), token: token).ConfigureAwait(false) ?? new List<AgentAssetVersion>();
        }

        /// <summary>
        /// Read one asset version.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="number">Version number.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The version.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentAssetVersion> GetVersionAsync(string assetId, int number, CancellationToken token = default)
        {
            return await Transport.SendAsync<AgentAssetVersion>(HttpMethod.Get, Version(assetId, number), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Upload a new asset version. When the files are identical to the current version the server returns the
        /// current version instead of creating one.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="request">Files and change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new or current version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        /// <exception cref="GarrisonException">Thrown on 413 (AssetFileTooLarge, AssetVersionTooLarge, AssetTooManyFiles) or 400 (AssetHasNoFiles).</exception>
        public async Task<AgentAssetVersion> UploadVersionAsync(string assetId, AgentAssetUploadRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<AgentAssetVersion>(HttpMethod.Post, Versions(assetId), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Upload a new asset version from a list of files, base64-encoding each.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="files">Files built with <see cref="AgentAssetUploadFile.FromBytes"/> or <see cref="AgentAssetUploadFile.FromText"/>.</param>
        /// <param name="changeNote">Optional change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new or current version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when files is null.</exception>
        public async Task<AgentAssetVersion> UploadFilesAsync(string assetId, IEnumerable<AgentAssetUploadFile> files, string? changeNote = null, CancellationToken token = default)
        {
            if (files == null) throw new ArgumentNullException(nameof(files));
            AgentAssetUploadRequest request = new AgentAssetUploadRequest { ChangeNote = changeNote, Files = new List<AgentAssetUploadFile>(files) };
            return await UploadVersionAsync(assetId, request, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Upload a new single-file asset version as raw bytes.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="path">Relative path of the file within the asset.</param>
        /// <param name="content">File bytes.</param>
        /// <param name="mediaType">Optional media type.</param>
        /// <param name="changeNote">Optional change note.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new or current version.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path or content is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<AgentAssetVersion> UploadRawAsync(string assetId, string path, byte[] content, string? mediaType = null, string? changeNote = null, CancellationToken token = default)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            if (content == null) throw new ArgumentNullException(nameof(content));
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["path"] = path;
            parameters["mediaType"] = mediaType;
            parameters["changeNote"] = changeNote;
            return await Transport.SendBinaryAsync<AgentAssetVersion>(HttpMethod.Post, Versions(assetId), content, parameters, "application/octet-stream", token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Download one file of an asset version.
        /// </summary>
        /// <param name="assetId">Asset identifier or name.</param>
        /// <param name="number">Version number.</param>
        /// <param name="path">Relative path of the file within the asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File bytes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when path is null.</exception>
        public async Task<byte[]> DownloadFileAsync(string assetId, int number, string path, CancellationToken token = default)
        {
            if (path == null) throw new ArgumentNullException(nameof(path));
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["path"] = path;
            return await Transport.DownloadAsync(Version(assetId, number) + "/files", parameters, token).ConfigureAwait(false);
        }

        #endregion

        #region Private-Methods

        private string Assets()
        {
            return TenantPath("/agent-assets");
        }

        private string Asset(string assetId)
        {
            return Assets() + "/" + Segment(assetId);
        }

        private string Versions(string assetId)
        {
            return Asset(assetId) + "/versions";
        }

        private string Version(string assetId, int number)
        {
            return Versions(assetId) + "/" + number.ToString(CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
