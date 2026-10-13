namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Responses;

    /// <summary>Artifact metadata, bounded run uploads, raw downloads, and short-lived links.</summary>
    public class ArtifactsClient : ClientBase
    {
        /// <summary>Construct an artifact client.</summary>
        /// <param name="transport">Shared transport.</param>
        public ArtifactsClient(GarrisonTransport transport) : base(transport) { }

        /// <summary>List metadata without file bytes.</summary>
        /// <param name="query">Paging and search.</param>
        /// <param name="runId">Optional producing run.</param>
        /// <param name="storeId">Optional store.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Metadata page.</returns>
        public async Task<EnumerationResult<Artifact>> ListAsync(EnumerationQuery? query = null, string? runId = null, string? storeId = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = QueryBuilder.From(query);
            if (runId != null) parameters["runId"] = runId;
            if (storeId != null) parameters["storeId"] = storeId;
            return await Transport.SendAsync<EnumerationResult<Artifact>>(HttpMethod.Get, TenantPath("/artifacts"), query: parameters, token: token).ConfigureAwait(false) ?? new EnumerationResult<Artifact>();
        }

        /// <summary>Read artifact metadata.</summary>
        /// <param name="id">Artifact identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Metadata.</returns>
        public async Task<Artifact> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Artifact>(HttpMethod.Get, Item(id), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty artifact response.");
        }

        /// <summary>Download authenticated file bytes.</summary>
        /// <param name="id">Artifact identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File bytes.</returns>
        public Task<byte[]> DownloadAsync(string id, CancellationToken token = default)
        {
            return Transport.DownloadAsync(Item(id) + "/content", token: token);
        }

        /// <summary>Create a short-lived download-only URL.</summary>
        /// <param name="id">Artifact identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Link and expiry.</returns>
        public async Task<ArtifactDownloadResponse> DownloadUrlAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<ArtifactDownloadResponse>(HttpMethod.Post, Item(id) + "/download-url", token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty download link response.");
        }

        /// <summary>Upload a glob-selected file for a currently active run epoch/repair phase.</summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="storeId">Compiled store binding.</param>
        /// <param name="name">Workspace-relative file name.</param>
        /// <param name="content">File bytes.</param>
        /// <param name="epoch">Current lease epoch.</param>
        /// <param name="repairAttempt">Current repair attempt.</param>
        /// <param name="mediaType">File media type.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Metadata.</returns>
        public async Task<Artifact> UploadAsync(string runId, string storeId, string name, byte[] content, long epoch, int repairAttempt = 0, string mediaType = "application/octet-stream", CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?> { ["name"] = name, ["storeId"] = storeId, ["mediaType"] = mediaType, ["epoch"] = epoch.ToString(CultureInfo.InvariantCulture), ["repairAttempt"] = repairAttempt.ToString(CultureInfo.InvariantCulture) };
            return await Transport.SendBinaryAsync<Artifact>(HttpMethod.Post, TenantPath("/runs/" + Segment(runId) + "/artifacts"), content, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty artifact response.");
        }

        /// <summary>Delete content and metadata.</summary>
        /// <param name="id">Artifact identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, Item(id), token: token).ConfigureAwait(false);
        }

        private string Item(string id) { return TenantPath("/artifacts/" + Segment(id)); }
    }
}
