namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;

    /// <summary>
    /// Downloads a run's agent asset files before launch (AD2.4), checks each against its SHA-256, and turns them into
    /// workspace files of the spec, so both the Process and the KubernetesJob executor write them like any other file.
    /// Download URLs are removed from the spec afterwards, so a run pod receives bytes and never a URL or a credential
    /// (D-033). Thread-safe.
    /// </summary>
    public static class AssetFetcher
    {
        #region Public-Members

        /// <summary>
        /// Most bytes of one asset file the worker accepts. Default 268435456 (256 MiB), the server's upper bound.
        /// </summary>
        public static readonly long MaxFileBytes = 268435456L;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Download and verify every asset file and add it to the spec's workspace files.
        /// </summary>
        /// <param name="spec">Execution spec; changed in place.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Null on success, or a message naming the file that failed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec is null.</exception>
        public static async Task<string?> MaterializeAsync(ExecutionSpec spec, CancellationToken token)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (spec.AssetFiles.Count == 0) return null;
            List<ExecutionFile> files = new List<ExecutionFile>();
            using (HttpClient client = new HttpClient { Timeout = TimeSpan.FromSeconds(Math.Max(30, spec.Artifacts?.TimeoutSeconds ?? 30)) })
            {
                foreach (ExecutionAssetFile asset in spec.AssetFiles)
                {
                    token.ThrowIfCancellationRequested();
                    if (String.IsNullOrEmpty(asset.DownloadUrl)) return "Asset file " + asset.Path + " of " + asset.AssetName + " has no download URL.";
                    byte[] content;
                    try
                    {
                        using (HttpResponseMessage response = await client.GetAsync(asset.DownloadUrl, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                        {
                            if (!response.IsSuccessStatusCode) return "Asset file " + asset.Path + " of " + asset.AssetName + " could not be downloaded (HTTP " + (int)response.StatusCode + ").";
                            using (Stream source = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                            using (MemoryStream buffer = new MemoryStream())
                            {
                                byte[] chunk = new byte[16384];
                                while (true)
                                {
                                    int read = await source.ReadAsync(chunk, token).ConfigureAwait(false);
                                    if (read == 0) break;
                                    if (buffer.Length + read > MaxFileBytes) return "Asset file " + asset.Path + " of " + asset.AssetName + " is larger than the worker accepts.";
                                    await buffer.WriteAsync(chunk.AsMemory(0, read), token).ConfigureAwait(false);
                                }
                                content = buffer.ToArray();
                            }
                        }
                    }
                    catch (HttpRequestException e)
                    {
                        return "Asset file " + asset.Path + " of " + asset.AssetName + " could not be downloaded: " + e.Message;
                    }
                    string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
                    if (!String.Equals(sha, asset.Sha256, StringComparison.Ordinal))
                    {
                        return "Asset file " + asset.Path + " of " + asset.AssetName + " version " + asset.Version + " does not match its recorded SHA-256.";
                    }
                    ExecutionFile file = new ExecutionFile();
                    file.BaseDirectory = FileBaseDirectoryEnum.Workspace;
                    file.Path = asset.Path;
                    file.ContentBase64 = Convert.ToBase64String(content);
                    files.Add(file);
                }
            }
            spec.Files.AddRange(files);
            foreach (ExecutionAssetFile asset in spec.AssetFiles) asset.DownloadUrl = null;
            return null;
        }

        #endregion
    }
}
