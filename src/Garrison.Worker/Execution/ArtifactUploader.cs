namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.AppServer;
    using Garrison.Sdk;
    using Garrison.Sdk.Http;
    using Voltaic.Core;
    using Voltaic.Mcp;

    /// <summary>Collect and upload selected workspace files before executor cleanup. Uploads never expose local paths or provider credentials.</summary>
    public static class ArtifactUploader
    {
        /// <summary>Upload explicit files within a bounded timeout. Individual failures warn without failing the harness run.</summary>
        /// <param name="assignment">Current run assignment.</param>
        /// <param name="workspace">Prepared workspace.</param>
        /// <param name="warning">Safe warning callback.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Successful transfer count.</returns>
        public static async Task<int> CollectAsync(RunAssignment assignment, string workspace, Action<string> warning, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (warning == null) throw new ArgumentNullException(nameof(warning));
            ExecutionArtifacts? settings = assignment.Spec?.Artifacts;
            if (settings == null || settings.Globs.Count == 0 || token.IsCancellationRequested) return 0;
            if (String.IsNullOrEmpty(settings.ApiBaseUrl) || String.IsNullOrEmpty(settings.BearerToken)) { warning("Artifact collection has no upload endpoint or run credential."); return 0; }
            if (!Uri.TryCreate(settings.ApiBaseUrl, UriKind.Absolute, out Uri? uploadUri) || (uploadUri.Scheme != "http" && uploadUri.Scheme != "https"))
            {
                warning("Artifact collection has an invalid upload endpoint.");
                return 0;
            }
            int uploaded = 0;
            using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromSeconds(settings.TimeoutSeconds)))
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token))
            using (HttpClient http = new HttpClient { Timeout = Timeout.InfiniteTimeSpan })
            using (GarrisonTransport transport = new GarrisonTransport(settings.ApiBaseUrl, http))
            using (McpHttpClient? mcp = String.IsNullOrEmpty(settings.McpUrl) ? null : new McpHttpClient())
            {
                transport.AuthMode = AuthModeEnum.Token;
                transport.Token = settings.BearerToken;
                try
                {
                    if (mcp != null)
                    {
                        Uri endpoint = new Uri(settings.McpUrl!);
                        mcp.SetRequestHeader("Authorization", "Bearer " + settings.BearerToken);
                        if (!await mcp.ConnectStreamableAsync(endpoint.GetLeftPart(UriPartial.Authority), endpoint.AbsolutePath, linked.Token).ConfigureAwait(false))
                        { warning("Artifact MCP upload endpoint could not be initialized."); return 0; }
                    }
                    List<ArtifactFile> files = await ArtifactSelection.SelectAsync(workspace, settings, warning, linked.Token).ConfigureAwait(false);
                    long transferred = 0;
                    foreach (ArtifactFile file in files)
                    {
                        linked.Token.ThrowIfCancellationRequested();
                        try
                        {
                            byte[] bytes = await ReadAsync(workspace, file.FullPath, Math.Min(settings.MaxFileBytes, settings.MaxTotalBytes - transferred), linked.Token).ConfigureAwait(false);
                            Dictionary<string, string?> query = new Dictionary<string, string?>
                            {
                                ["storeId"] = settings.StoreId, ["name"] = file.Name, ["mediaType"] = ArtifactMediaTypes.Of(file.Name),
                                ["epoch"] = assignment.Epoch.ToString(CultureInfo.InvariantCulture), ["repairAttempt"] = assignment.Spec!.RepairAttempt.ToString(CultureInfo.InvariantCulture)
                            };
                            string path = "/v1.0/api/tenants/" + Uri.EscapeDataString(assignment.Spec!.TenantId) + "/runs/" + Uri.EscapeDataString(assignment.RunId) + "/artifacts";
                            Artifact? artifact;
                            if (mcp == null) artifact = await transport.SendBinaryAsync<Artifact>(HttpMethod.Post, path, bytes, query, token: linked.Token).ConfigureAwait(false);
                            else
                            {
                                ArtifactUploadRequest request = new ArtifactUploadRequest
                                {
                                    RunId = assignment.RunId, StoreId = settings.StoreId, Name = file.Name, MediaType = ArtifactMediaTypes.Of(file.Name),
                                    Epoch = assignment.Epoch, RepairAttempt = assignment.Spec!.RepairAttempt, ContentBase64 = Convert.ToBase64String(bytes)
                                };
                                McpToolCallReply reply = await mcp.CallAsync<McpToolCallReply>("tools/call", new { name = "garrison_upload_artifact", arguments = request }, settings.TimeoutSeconds * 1000, linked.Token).ConfigureAwait(false);
                                if (reply.IsError) throw new IOException("Artifact upload was rejected.");
                                string? text = reply.Content?.FirstOrDefault(c => c.Type == "text")?.Text;
                                artifact = String.IsNullOrEmpty(text) ? null : Serializer.Deserialize<Artifact>(text);
                            }
                            if (artifact == null) { warning("Artifact upload returned no metadata."); continue; }
                            transferred += bytes.Length;
                            uploaded++;
                        }
                        catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException || ex is HttpRequestException || ex is GarrisonException || ex is JsonRpcException || ex is System.Text.Json.JsonException)
                        {
                            // Transport messages may contain a URL; emit only a safe diagnostic type.
                            warning("Artifact upload failed for a selected file: " + ex.GetType().Name + ".");
                        }
                    }
                }
                catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException || ex is HttpRequestException || ex is JsonRpcException || ex is System.Text.Json.JsonException || ex is ArgumentException || ex is InvalidOperationException)
                {
                    warning("Artifact collection could not finish: " + ex.GetType().Name + ".");
                }
                catch (OperationCanceledException) when (timeout.IsCancellationRequested && !token.IsCancellationRequested)
                {
                    warning("Artifact collection reached its configured timeout; remaining files were skipped.");
                }
            }
            return uploaded;
        }

        /// <summary>
        /// Read a selected artifact file, refusing it unless the file actually opened is the regular file at that path
        /// inside the workspace (SR-24): a link swapped in after selection, at the file or any directory above it, is
        /// detected after the open, so the harness cannot redirect an upload to a file outside its workspace.
        /// </summary>
        /// <param name="workspace">Workspace root the file was selected under.</param>
        /// <param name="path">Absolute file path.</param>
        /// <param name="maximum">Most bytes to read.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File content.</returns>
        /// <exception cref="IOException">Thrown when the file is a link, resolves outside the workspace, or exceeds the limit.</exception>
        public static async Task<byte[]> ReadAsync(string workspace, string path, long maximum, CancellationToken token)
        {
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (path == null) throw new ArgumentNullException(nameof(path));
            if (SafePaths.IsLink(path)) throw new IOException("Artifact became a filesystem link.");
            using (FileStream input = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 16384, FileOptions.Asynchronous))
            using (MemoryStream output = new MemoryStream())
            {
                if (!SafePaths.OpenedInside(input.SafeFileHandle, workspace, path)) throw new IOException("Artifact resolved outside the workspace through a filesystem link.");
                byte[] buffer = new byte[16384];
                while (true)
                {
                    int count = await input.ReadAsync(buffer, token).ConfigureAwait(false);
                    if (count == 0) break;
                    if (output.Length + count > maximum) throw new IOException("Artifact exceeds transfer limits.");
                    await output.WriteAsync(buffer.AsMemory(0, count), token).ConfigureAwait(false);
                }
                return output.ToArray();
            }
        }
    }
}
