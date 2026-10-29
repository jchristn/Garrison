namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Storage;

    /// <summary>
    /// Conversation file spaces (AD3.2, AD-014, AD-015): resolve the space of a conversation or run, write files with
    /// optimistic base versions (a stale write is kept under a conflict name, never lost), read verified content, soft
    /// delete, enforce FileSpaces limits, add download tickets to leased specs, and remove orphaned spaces. Content lives
    /// under the reserved .garrison-files/ prefix of the space's artifact store, or in the Garrison database. Callers
    /// authorize before entering. Thread-safe.
    /// </summary>
    public class FileSpaceService
    {
        #region Public-Members

        /// <summary>
        /// Called after files of a space change, with the space and the changed paths; the WebSocket hub uses it to send
        /// files.changed. Null does nothing.
        /// </summary>
        public Action<ConversationFileSpace, List<string>>? Changed { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ArtifactStorage _Storage;
        private readonly TokenService _Tickets;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public FileSpaceService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Storage = new ArtifactStorage(server);
            _Tickets = new TokenService(server.Settings.Auth.SigningKey, server.Settings.Auth.Issuer, server.Settings.Auth.TokenLifetimeMinutes, "file-download:" + server.Settings.Security.MasterKey);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// The space a conversation uses, created on first use with the conversation's deployment store.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="conversation">Conversation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Space.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task<ConversationFileSpace> ForConversationAsync(string tenantId, Conversation conversation, CancellationToken token = default)
        {
            if (conversation == null) throw new ArgumentNullException(nameof(conversation));
            ConversationFileSpace? existing = await _Server.Database.FileSpaces.ReadByOwnerAsync(tenantId, "cnv:" + conversation.Id, token).ConfigureAwait(false);
            if (existing != null) return existing;
            Deployment? deployment = String.IsNullOrEmpty(conversation.DeploymentId) ? null : await _Server.Database.Deployments.ReadAsync(tenantId, conversation.DeploymentId, token).ConfigureAwait(false);
            ConversationFileSpace template = new ConversationFileSpace { TenantId = tenantId, OwnerKey = "cnv:" + conversation.Id, ConversationId = conversation.Id, ArtifactStoreId = deployment?.ArtifactStoreId };
            return await _Server.Database.FileSpaces.GetOrCreateAsync(template, token).ConfigureAwait(false);
        }

        /// <summary>
        /// The space a run uses: its recorded space, or the one its owner resolves to.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Space.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<ConversationFileSpace> ForRunAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (!String.IsNullOrEmpty(run.FileSpaceId))
            {
                ConversationFileSpace? recorded = await _Server.Database.FileSpaces.ReadAsync(run.TenantId, run.FileSpaceId, token).ConfigureAwait(false);
                if (recorded != null) return recorded;
            }
            Deployment? deployment = String.IsNullOrEmpty(run.DeploymentId) ? null : await _Server.Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            return await FileSpaceResolver.ResolveAsync(_Server.Database, run, deployment?.ArtifactStoreId, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Write a file. With a base version, a write whose base is stale is committed under a conflict name
        /// (name.{tag}.ext) instead, and the result says so; nothing is overwritten. Limits FileSpaces.MaxFileBytes,
        /// FileSpaces.MaxTotalBytes, and FileSpaces.MaxFiles answer 413 naming the setting.
        /// </summary>
        /// <param name="space">Space.</param>
        /// <param name="path">Path inside the space.</param>
        /// <param name="content">Bytes.</param>
        /// <param name="mediaType">Media type, or null to guess from the extension.</param>
        /// <param name="baseVersion">Version the writer read (0 for a new file), or null to overwrite unconditionally.</param>
        /// <param name="runId">Writing run, or null.</param>
        /// <param name="leaseEpoch">Lease epoch of the writing run, or null.</param>
        /// <param name="writtenBy">Display name of the writer.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ValidationException">Thrown with InvalidFilePath.</exception>
        /// <exception cref="PayloadTooLargeException">Thrown when a limit is exceeded.</exception>
        public async Task<FileSpaceUploadResult> WriteAsync(ConversationFileSpace space, string path, byte[] content, string? mediaType, int? baseVersion, string? runId, long? leaseEpoch, string? writtenBy, CancellationToken token = default)
        {
            if (space == null) throw new ArgumentNullException(nameof(space));
            if (content == null) throw new ArgumentNullException(nameof(content));
            ValidatePath(path);
            Settings.FileSpaceSettings limits = _Server.Settings.FileSpaces;
            if (content.LongLength > limits.MaxFileBytes) throw new PayloadTooLargeException("FileTooLarge", "FileSpaces.MaxFileBytes", "File " + path + " is " + content.LongLength + " bytes; the limit is " + limits.MaxFileBytes + " bytes (FileSpaces.MaxFileBytes).");
            ConversationFile? existing = await _Server.Database.FileSpaces.ReadFileAsync(space.TenantId, space.Id, path, token).ConfigureAwait(false);
            ConversationFileSpace current = await _Server.Database.FileSpaces.ReadAsync(space.TenantId, space.Id, token).ConfigureAwait(false) ?? space;
            bool isNew = existing == null || existing.Deleted;
            long replaced = isNew ? 0 : existing!.SizeBytes;
            if (current.TotalBytes - replaced + content.LongLength > limits.MaxTotalBytes) throw new PayloadTooLargeException("FileSpaceFull", "FileSpaces.MaxTotalBytes", "The file space would hold more than " + limits.MaxTotalBytes + " bytes (FileSpaces.MaxTotalBytes).");

            string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
            ConversationFileVersion version = new ConversationFileVersion();
            version.SizeBytes = content.LongLength;
            version.Sha256 = sha;
            version.MediaType = String.IsNullOrWhiteSpace(mediaType) ? MediaTypes.ForPath(path) : mediaType;
            version.RunId = runId;
            version.LeaseEpoch = leaseEpoch;
            version.WrittenBy = writtenBy;
            version.StorageKey = StorageKey(space, sha);
            byte[]? databaseContent = await StoreAsync(space, version.StorageKey, content, version.MediaType, token).ConfigureAwait(false);

            FileSpaceUploadResult result = new FileSpaceUploadResult { RequestedPath = path, Sha256 = sha };
            if (isNew && current.FileCount >= limits.MaxFiles) throw new PayloadTooLargeException("TooManyFiles", "FileSpaces.MaxFiles", "The file space already holds " + current.FileCount + " files (FileSpaces.MaxFiles).");
            ConversationFileVersion? committed = await _Server.Database.FileSpaces.CommitAsync(space.TenantId, space.Id, path, baseVersion, version, databaseContent, token).ConfigureAwait(false);
            if (committed != null)
            {
                result.Path = path;
                result.Version = committed.Number;
                Changed?.Invoke(space, new List<string> { path });
                return result;
            }

            // AD-014: the base was stale, so keep this write next to the winner under a conflict name.
            string tag = !String.IsNullOrEmpty(runId) ? runId : "user-" + IdGenerator.NewChildRowId().Substring(0, 8);
            string conflictPath = ConflictPath(path, tag);
            for (int attempt = 1; await _Server.Database.FileSpaces.ReadFileAsync(space.TenantId, space.Id, conflictPath, token).ConfigureAwait(false) is ConversationFile taken && !taken.Deleted; attempt++)
            {
                conflictPath = ConflictPath(path, tag + "-" + attempt.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            if (current.FileCount >= limits.MaxFiles) throw new PayloadTooLargeException("TooManyFiles", "FileSpaces.MaxFiles", "The file space already holds " + current.FileCount + " files (FileSpaces.MaxFiles).");
            ConversationFileVersion conflict = new ConversationFileVersion
            {
                SizeBytes = version.SizeBytes, Sha256 = sha, MediaType = version.MediaType, RunId = runId, LeaseEpoch = leaseEpoch, WrittenBy = writtenBy, StorageKey = version.StorageKey
            };
            ConversationFileVersion stored = await _Server.Database.FileSpaces.CommitAsync(space.TenantId, space.Id, conflictPath, null, conflict, databaseContent, token).ConfigureAwait(false)
                ?? throw new InvalidOperationException("Conflict file " + conflictPath + " could not be written.");
            result.Path = conflictPath;
            result.Version = stored.Number;
            result.Conflict = true;
            Changed?.Invoke(space, new List<string> { conflictPath });
            return result;
        }

        /// <summary>
        /// Write a file a worker uploads for a run at the end of its execution (AD3.3), fenced by the run's lease: the
        /// node must hold the lease at the given epoch and repair attempt.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="nodeId">Authenticated node identifier.</param>
        /// <param name="epoch">Lease epoch the worker holds.</param>
        /// <param name="repairAttempt">Repair attempt.</param>
        /// <param name="path">Path inside the space.</param>
        /// <param name="baseVersion">Version the run started from, 0 for a new file.</param>
        /// <param name="content">Bytes.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        /// <exception cref="NotFoundException">Thrown when the run does not exist.</exception>
        /// <exception cref="ConflictException">Thrown with StaleFileUpload when the node no longer holds the lease.</exception>
        public async Task<FileSpaceUploadResult> WriteFromNodeAsync(string tenantId, string runId, string nodeId, long epoch, int repairAttempt, string path, int baseVersion, byte[] content, CancellationToken token = default)
        {
            Run run = await _Server.Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false) ?? throw new NotFoundException("Run not found.");
            bool active = run.Status == RunStatusEnum.Leased || run.Status == RunStatusEnum.Running || run.Status == RunStatusEnum.Cancelling;
            if (!active || run.LeaseEpoch != epoch || run.RepairAttempts != repairAttempt || run.LeaseNodeId != nodeId)
            {
                throw new ConflictException("StaleFileUpload", "File space upload no longer belongs to the current execution of run " + runId + ".");
            }
            ConversationFileSpace space = await ForRunAsync(run, token).ConfigureAwait(false);
            return await WriteAsync(space, path, content, null, baseVersion, run.Id, epoch, run.AgentName, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Read a file's content, current or a given version, checked against its hash.
        /// </summary>
        /// <param name="space">Space.</param>
        /// <param name="file">File.</param>
        /// <param name="number">Version number, or null for the current version.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Version metadata and bytes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the version or its content is missing.</exception>
        /// <exception cref="IOException">Thrown when content does not match its hash.</exception>
        public async Task<FileSpaceContent> ReadAsync(ConversationFileSpace space, ConversationFile file, int? number, CancellationToken token = default)
        {
            if (space == null) throw new ArgumentNullException(nameof(space));
            if (file == null) throw new ArgumentNullException(nameof(file));
            ConversationFileVersion version = await _Server.Database.FileSpaces.ReadVersionAsync(space.TenantId, file.Id, number ?? file.CurrentVersion, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Version " + (number ?? file.CurrentVersion) + " of " + file.Path + " not found.");
            ArtifactStore? store = await StoreForAsync(space, token).ConfigureAwait(false);
            byte[] content;
            if (store == null || store.Kind == ArtifactStoreKindEnum.Database)
            {
                content = await _Server.Database.FileSpaces.ReadContentAsync(space.TenantId, version.StorageKey, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("Content of " + file.Path + " not found.");
            }
            else
            {
                content = await _Storage.ReadAsync(store, Locator(space, store, version.StorageKey, version.SizeBytes, version.MediaType), token).ConfigureAwait(false);
            }
            if (!String.Equals(Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant(), version.Sha256, StringComparison.Ordinal))
            {
                throw new IOException("Content of " + file.Path + " version " + version.Number + " does not match its recorded SHA-256.");
            }
            return new FileSpaceContent { Path = file.Path, Version = version, Content = content };
        }

        /// <summary>
        /// Delete a file (soft: its versions are kept).
        /// </summary>
        /// <param name="space">Space.</param>
        /// <param name="path">Path.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when space is null.</exception>
        public async Task<bool> DeleteAsync(ConversationFileSpace space, string path, CancellationToken token = default)
        {
            if (space == null) throw new ArgumentNullException(nameof(space));
            ValidatePath(path);
            bool deleted = await _Server.Database.FileSpaces.DeleteFileAsync(space.TenantId, space.Id, path, token).ConfigureAwait(false);
            if (deleted) Changed?.Invoke(space, new List<string> { path });
            return deleted;
        }

        /// <summary>
        /// Add the file space of a leased run to its spec: the mount path and every current file with a download-only
        /// URL, so the worker can sync them in before launch (AD3.3).
        /// </summary>
        /// <param name="run">Run being leased.</param>
        /// <param name="spec">Compiled spec; changed in place.</param>
        /// <param name="apiBaseUrl">Base URL workers reach the control plane on.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public async Task ApplyAsync(Run run, ExecutionSpec spec, string apiBaseUrl, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (spec.FileSpace == null || String.IsNullOrEmpty(run.FileSpaceId)) return;
            spec.FileSpace.FileSpaceId = run.FileSpaceId;
            spec.FileSpace.Files.Clear();
            foreach (ConversationFile file in await _Server.Database.FileSpaces.ListFilesAsync(run.TenantId, run.FileSpaceId, false, token).ConfigureAwait(false))
            {
                string ticket = _Tickets.Issue(new TokenPayload
                {
                    Purpose = "FileDownload",
                    TokenId = file.Id + "|" + file.CurrentVersion.ToString(System.Globalization.CultureInfo.InvariantCulture),
                    TenantId = run.TenantId,
                    RunId = run.Id,
                    SessionId = "file-download",
                    ExpiresUtc = DateTime.UtcNow.AddSeconds(_Server.Settings.Artifacts.DownloadLifetimeSeconds)
                });
                spec.FileSpace.Files.Add(new ExecutionFileSpaceFile
                {
                    Path = file.Path,
                    Version = file.CurrentVersion,
                    Sha256 = file.Sha256,
                    SizeBytes = file.SizeBytes,
                    DownloadUrl = apiBaseUrl.TrimEnd('/') + "/v1.0/file-download/" + Uri.EscapeDataString(run.FileSpaceId) + "?ticket=" + Uri.EscapeDataString(ticket)
                });
            }
        }

        /// <summary>
        /// Issue a short-lived, download-only URL for one version of a file, for users and app UIs.
        /// </summary>
        /// <param name="space">Space.</param>
        /// <param name="file">File.</param>
        /// <param name="number">Version, or null for the current one.</param>
        /// <param name="apiBaseUrl">Base URL clients reach the control plane on.</param>
        /// <returns>URL and expiry.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public FileDownloadUrl DownloadUrl(ConversationFileSpace space, ConversationFile file, int? number, string apiBaseUrl)
        {
            if (space == null) throw new ArgumentNullException(nameof(space));
            if (file == null) throw new ArgumentNullException(nameof(file));
            DateTime expires = DateTime.UtcNow.AddSeconds(_Server.Settings.Artifacts.DownloadLifetimeSeconds);
            string ticket = _Tickets.Issue(new TokenPayload
            {
                Purpose = "FileDownload",
                TokenId = file.Id + "|" + (number ?? file.CurrentVersion).ToString(System.Globalization.CultureInfo.InvariantCulture),
                TenantId = space.TenantId,
                SessionId = "file-download",
                ExpiresUtc = expires
            });
            return new FileDownloadUrl { Url = apiBaseUrl.TrimEnd('/') + "/v1.0/file-download/" + Uri.EscapeDataString(space.Id) + "?ticket=" + Uri.EscapeDataString(ticket), ExpiresUtc = expires };
        }

        /// <summary>
        /// Resolve a download ticket to the file version it opens and read it.
        /// </summary>
        /// <param name="spaceId">Space identifier from the route.</param>
        /// <param name="ticket">Ticket.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Content, or null when the ticket is invalid, expired, or for another space.</returns>
        public async Task<FileSpaceContent?> ResolveDownloadAsync(string spaceId, string ticket, CancellationToken token = default)
        {
            TokenPayload? payload = _Tickets.Validate(ticket ?? String.Empty);
            if (payload?.Purpose != "FileDownload" || String.IsNullOrEmpty(payload.TenantId)) return null;
            string[] parts = payload.TokenId.Split('|');
            if (parts.Length != 2 || !Int32.TryParse(parts[1], out int number)) return null;
            ConversationFileSpace? space = await _Server.Database.FileSpaces.ReadAsync(payload.TenantId, spaceId, token).ConfigureAwait(false);
            if (space == null) return null;
            ConversationFile? file = (await _Server.Database.FileSpaces.ListFilesAsync(payload.TenantId, spaceId, true, token).ConfigureAwait(false)).FirstOrDefault(f => f.Id == parts[0]);
            if (file == null) return null;
            return await ReadAsync(space, file, number, token).ConfigureAwait(false);
        }

        /// <summary>
        /// Remove spaces whose conversation, pipeline run, or root run is gone, with their content (retention follows the
        /// owner's retention).
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Spaces removed.</returns>
        public async Task<int> RemoveOrphansAsync(CancellationToken token = default)
        {
            int removed = 0;
            foreach (ConversationFileSpace space in await _Server.Database.FileSpaces.ListOrphansAsync(200, token).ConfigureAwait(false))
            {
                token.ThrowIfCancellationRequested();
                ArtifactStore? store = await StoreForAsync(space, token).ConfigureAwait(false);
                if (store != null && store.Kind != ArtifactStoreKindEnum.Database)
                {
                    foreach (string key in await _Server.Database.FileSpaces.StorageKeysAsync(space.TenantId, space.Id, token).ConfigureAwait(false))
                    {
                        try
                        {
                            await _Storage.DeleteAsync(store, Locator(space, store, key, 0, "application/octet-stream"), token).ConfigureAwait(false);
                        }
                        catch (Exception e) when (e is IOException || e is Amazon.S3.AmazonS3Exception)
                        {
                            _Server.Logging.Warn("[FileSpaceService] could not remove file space content " + key + ": " + e.Message);
                        }
                    }
                }
                if (await _Server.Database.FileSpaces.DeleteSpaceAsync(space.TenantId, space.Id, token).ConfigureAwait(false)) removed++;
            }
            return removed;
        }

        /// <summary>
        /// Conflict name for a stale write: the tag goes before the extension, for example notes.run_abc.md.
        /// </summary>
        /// <param name="path">Original path.</param>
        /// <param name="tag">Writer tag, such as a run identifier.</param>
        /// <returns>Conflict path.</returns>
        public static string ConflictPath(string path, string tag)
        {
            int slash = path.LastIndexOf('/');
            string directory = slash >= 0 ? path.Substring(0, slash + 1) : String.Empty;
            string name = slash >= 0 ? path.Substring(slash + 1) : path;
            int dot = name.LastIndexOf('.');
            return dot > 0 ? directory + name.Substring(0, dot) + "." + tag + name.Substring(dot) : directory + name + "." + tag;
        }

        #endregion

        #region Private-Methods

        private static void ValidatePath(string path)
        {
            if (RelativePaths.IsValid(path)) return;
            ValidationException error = new ValidationException("File paths are relative with forward slashes, without \".\" or \"..\" segments, at most 512 characters.",
                new Dictionary<string, string> { ["path"] = "Invalid path." }, new Dictionary<string, string> { ["path"] = "InvalidFilePath" });
            error.Code = "InvalidFilePath";
            throw error;
        }

        private async Task<byte[]?> StoreAsync(ConversationFileSpace space, string storageKey, byte[] content, string mediaType, CancellationToken token)
        {
            ArtifactStore? store = await StoreForAsync(space, token).ConfigureAwait(false);
            if (store == null || store.Kind == ArtifactStoreKindEnum.Database) return content;
            try
            {
                await _Storage.PutAsync(store, Locator(space, store, storageKey, content.LongLength, mediaType), content, token).ConfigureAwait(false);
            }
            catch (IOException) when (store.Kind == ArtifactStoreKindEnum.Filesystem)
            {
                // Content-addressed: the object already holds these exact bytes.
            }
            return null;
        }

        private async Task<ArtifactStore?> StoreForAsync(ConversationFileSpace space, CancellationToken token)
        {
            if (String.IsNullOrEmpty(space.ArtifactStoreId)) return null;
            return await _Server.Database.ArtifactStores.ReadAsync(space.TenantId, space.ArtifactStoreId, token).ConfigureAwait(false);
        }

        private static string StorageKey(ConversationFileSpace space, string sha)
        {
            string tenant = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(space.TenantId))).ToLowerInvariant();
            return Constants.FileSpaceKeyPrefix + tenant + "/" + space.Id + "/" + sha;
        }

        private static Artifact Locator(ConversationFileSpace space, ArtifactStore store, string storageKey, long sizeBytes, string mediaType)
        {
            string prefix = String.IsNullOrEmpty(store.PathPrefix) ? store.Id : store.PathPrefix;
            Artifact locator = new Artifact();
            locator.TenantId = space.TenantId;
            locator.ArtifactStoreId = store.Id;
            locator.Location = prefix.TrimEnd('/') + "/" + storageKey;
            locator.SizeBytes = sizeBytes;
            locator.MediaType = mediaType;
            return locator;
        }

        #endregion
    }
}
