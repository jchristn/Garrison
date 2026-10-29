namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Storage;

    /// <summary>
    /// Agent assets (AD2.2, AD-011): create, update, and delete assets, upload versions with SHA-256 checks and limits,
    /// and read file content. Content lives in the asset's artifact store under the reserved .garrison-assets/ prefix,
    /// or in the Garrison database when the asset names no store. Asset content never appears in artifact listings and
    /// artifact retention does not touch it. Callers authorize before entering. Thread-safe.
    /// </summary>
    public class AgentAssetService
    {
        #region Private-Members

        private static readonly Regex _Name = new Regex("^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$", RegexOptions.CultureInvariant);
        private static readonly Regex _MediaType = new Regex("\\A[a-zA-Z0-9!#$&^_.+-]+/[a-zA-Z0-9!#$&^_.+-]+\\z", RegexOptions.CultureInvariant);
        private static readonly string[] _MacroExtensions = { ".dotm", ".docm", ".xlsm", ".pptm", ".xltm", ".potm" };

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
        public AgentAssetService(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Storage = new ArtifactStorage(server);
            _Tickets = new TokenService(server.Settings.Auth.SigningKey, server.Settings.Auth.Issuer, server.Settings.Auth.TokenLifetimeMinutes, "asset-download:" + server.Settings.Security.MasterKey);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Create an asset. SystemPrompt assets need a prompt template the tenant can read (AssetTemplateRequired); other
        /// kinds cannot name one. The store, when given, must exist in the tenant and be active.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the asset is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with NameConflict when the name is taken.</exception>
        public async Task<AgentAsset> CreateAsync(RequestContext ctx, string tenantId, AgentAsset asset, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            asset.Id = String.Empty;
            asset.TenantId = tenantId;
            await ValidateAsync(tenantId, asset, token).ConfigureAwait(false);
            if (await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, asset.Name, token).ConfigureAwait(false) != null)
            {
                throw new ConflictException("NameConflict", "An asset named " + asset.Name + " already exists.");
            }
            AgentAsset created = await _Server.Database.AgentAssets.CreateAsync(asset, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, created.Id, "Created asset " + created.Name + " (" + created.Kind + ").", token).ConfigureAwait(false);
            return created;
        }

        /// <summary>
        /// Replace an asset's name, description, tags, prompt template (SystemPrompt only), and store. The kind cannot
        /// change, and the store cannot change once the asset has versions.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="existing">Existing asset.</param>
        /// <param name="update">Replacement.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The asset.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the update is invalid.</exception>
        /// <exception cref="ConflictException">Thrown with AssetKindImmutable, AssetStoreImmutable, or NameConflict.</exception>
        public async Task<AgentAsset> UpdateAsync(RequestContext ctx, string tenantId, AgentAsset existing, AgentAsset update, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (existing == null) throw new ArgumentNullException(nameof(existing));
            if (update == null) throw new ArgumentNullException(nameof(update));
            if (update.Kind != existing.Kind) throw new ConflictException("AssetKindImmutable", "The kind of asset " + existing.Name + " cannot change; create a new asset.");
            if (existing.CurrentVersion > 0 && !String.Equals(existing.ArtifactStoreId ?? String.Empty, update.ArtifactStoreId ?? String.Empty, StringComparison.Ordinal))
            {
                throw new ConflictException("AssetStoreImmutable", "Asset " + existing.Name + " already has versions; its store cannot change.");
            }
            update.Id = existing.Id;
            update.TenantId = tenantId;
            update.CurrentVersion = existing.CurrentVersion;
            update.CreatedUtc = existing.CreatedUtc;
            await ValidateAsync(tenantId, update, token).ConfigureAwait(false);
            AgentAsset? named = await _Server.Database.AgentAssets.ReadByNameAsync(tenantId, update.Name, token).ConfigureAwait(false);
            if (named != null && named.Id != existing.Id) throw new ConflictException("NameConflict", "An asset named " + update.Name + " already exists.");
            AgentAsset saved = await _Server.Database.AgentAssets.UpdateAsync(update, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, saved.Id, "Updated asset " + saved.Name + ".", token).ConfigureAwait(false);
            return saved;
        }

        /// <summary>
        /// Delete an asset and its content. Refused with AssetInUse while any agent revision pins it.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with AssetInUse.</exception>
        public async Task DeleteAsync(RequestContext ctx, string tenantId, AgentAsset asset, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            List<string> agents = await _Server.Database.AgentAssets.AgentsPinningAsync(tenantId, asset.Id, token).ConfigureAwait(false);
            if (agents.Count > 0) throw new ConflictException("AssetInUse", "Asset " + asset.Name + " is pinned by revisions of " + String.Join(", ", agents) + ". Remove it from those revisions first.");
            List<AgentAssetVersion> versions = await _Server.Database.AgentAssets.ListVersionsAsync(tenantId, asset.Id, token).ConfigureAwait(false);
            await _Server.Database.AgentAssets.DeleteAsync(tenantId, asset.Id, token).ConfigureAwait(false);
            ArtifactStore? store = await StoreAsync(tenantId, asset, token).ConfigureAwait(false);
            if (store != null && store.Kind != ArtifactStoreKindEnum.Database)
            {
                foreach (string key in versions.SelectMany(v => v.Files).Select(f => f.StorageKey).Distinct(StringComparer.Ordinal))
                {
                    try
                    {
                        await _Storage.DeleteAsync(store, Locator(tenantId, store, key, 0, "application/octet-stream"), token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is IOException || e is Amazon.S3.AmazonS3Exception)
                    {
                        // The metadata is gone; an orphaned object under .garrison-assets/ is harmless and logged.
                        _Server.Logging.Warn("[AgentAssetService] could not remove asset content " + key + ": " + e.Message);
                    }
                }
            }
            await AuditAsync(ctx, tenantId, asset.Id, "Deleted asset " + asset.Name + " and " + versions.Count + " version(s).", token).ConfigureAwait(false);
        }

        /// <summary>
        /// Upload a new version. Paths are relative with forward slashes, unique, and stay inside the asset. Limits:
        /// Assets.MaxFilesPerVersion, Assets.MaxFileBytes, and Assets.MaxVersionBytes (413 naming the setting).
        /// Uploading exactly the files of the current version (same paths and hashes) returns that version instead of a
        /// new one.
        /// </summary>
        /// <param name="ctx">Authorized caller.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="files">Files with ContentBase64 set, or with content passed in <paramref name="contents"/>.</param>
        /// <param name="contents">Raw content by path, used instead of ContentBase64 when present.</param>
        /// <param name="changeNote">Optional change note, at most 2000 characters.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The version, and whether it was newly created.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the upload is invalid (AssetHasNoFiles for SystemPrompt).</exception>
        /// <exception cref="PayloadTooLargeException">Thrown when a limit is exceeded.</exception>
        public async Task<AgentAssetUploadResult> UploadVersionAsync(RequestContext ctx, string tenantId, AgentAsset asset, List<AgentAssetFile> files, Dictionary<string, byte[]>? contents, string? changeNote, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            if (files == null) throw new ArgumentNullException(nameof(files));
            if (asset.Kind == AgentAssetKindEnum.SystemPrompt)
            {
                ValidationException none = new ValidationException("SystemPrompt assets have no files; edit their prompt template instead.", new Dictionary<string, string> { ["files"] = "Not allowed for SystemPrompt assets." }, new Dictionary<string, string> { ["files"] = "AssetHasNoFiles" });
                none.Code = "AssetHasNoFiles";
                throw none;
            }
            if (changeNote != null && changeNote.Length > 2000) throw new ValidationException("The change note is too long.", new Dictionary<string, string> { ["changeNote"] = "At most 2000 characters." });
            if (files.Count == 0) throw new ValidationException("A version needs at least one file.", new Dictionary<string, string> { ["files"] = "Required." });
            Settings.AssetSettings limits = _Server.Settings.Assets;
            if (files.Count > limits.MaxFilesPerVersion) throw new PayloadTooLargeException("AssetTooManyFiles", "Assets.MaxFilesPerVersion", "A version holds at most " + limits.MaxFilesPerVersion + " files (Assets.MaxFilesPerVersion); this upload has " + files.Count + ".");

            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            HashSet<string> seen = new HashSet<string>(StringComparer.Ordinal);
            Dictionary<string, byte[]> bytesByPath = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            long total = 0;
            for (int i = 0; i < files.Count; i++)
            {
                AgentAssetFile file = files[i];
                string key = "files[" + i + "]";
                if (!ValidPath(file.Path))
                {
                    errors[key + ".path"] = "Use a relative path with forward slashes, without \".\" or \"..\" segments, at most 512 characters.";
                    codes[key + ".path"] = "InvalidAssetPath";
                    continue;
                }
                if (!seen.Add(file.Path)) errors[key + ".path"] = "Path " + file.Path + " is listed twice.";
                if (!limits.AllowMacroFormats && _MacroExtensions.Any(e => file.Path.EndsWith(e, StringComparison.OrdinalIgnoreCase)))
                {
                    errors[key + ".path"] = "Macro-enabled Office files are refused (Assets.AllowMacroFormats). Save the template as .dotx or .docx.";
                    codes[key + ".path"] = "MacroFormatRefused";
                }
                if (String.IsNullOrWhiteSpace(file.MediaType)) file.MediaType = MediaTypeFor(file.Path);
                if (!_MediaType.IsMatch(file.MediaType)) errors[key + ".mediaType"] = "Not a valid media type.";
                byte[]? content = null;
                if (contents != null && contents.TryGetValue(file.Path, out byte[]? raw)) content = raw;
                else if (file.ContentBase64 != null)
                {
                    try
                    {
                        content = Convert.FromBase64String(file.ContentBase64);
                    }
                    catch (FormatException)
                    {
                        errors[key + ".contentBase64"] = "Not valid base64.";
                        continue;
                    }
                }
                if (content == null)
                {
                    errors[key + ".contentBase64"] = "Required.";
                    continue;
                }
                if (content.LongLength > limits.MaxFileBytes) throw new PayloadTooLargeException("AssetFileTooLarge", "Assets.MaxFileBytes", "File " + file.Path + " is " + content.LongLength + " bytes; the limit is " + limits.MaxFileBytes + " bytes (Assets.MaxFileBytes).");
                total += content.LongLength;
                if (total > limits.MaxVersionBytes) throw new PayloadTooLargeException("AssetVersionTooLarge", "Assets.MaxVersionBytes", "This version is more than " + limits.MaxVersionBytes + " bytes (Assets.MaxVersionBytes).");
                bytesByPath[file.Path] = content;
            }
            if (errors.Count > 0) throw new ValidationException("The asset files are invalid.", errors, codes);

            ArtifactStore? store = await StoreAsync(tenantId, asset, token).ConfigureAwait(false);
            if (store != null && !store.Active) throw new ValidationException("The asset's artifact store is inactive.", new Dictionary<string, string> { ["artifactStoreId"] = "Inactive store." });
            AgentAssetVersion version = new AgentAssetVersion();
            version.TenantId = tenantId;
            version.AssetId = asset.Id;
            version.AuthorName = ctx.PrincipalName;
            version.ChangeNote = changeNote;
            foreach (AgentAssetFile file in files.OrderBy(f => f.Path, StringComparer.Ordinal))
            {
                byte[] content = bytesByPath[file.Path];
                string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
                version.Files.Add(new AgentAssetFile
                {
                    Path = file.Path,
                    MediaType = file.MediaType,
                    SizeBytes = content.LongLength,
                    Sha256 = sha,
                    StorageKey = StorageKey(tenantId, asset.Id, sha)
                });
            }

            // Idempotent re-upload: the same files as the current version return that version.
            if (asset.CurrentVersion > 0)
            {
                AgentAssetVersion? current = await _Server.Database.AgentAssets.ReadVersionAsync(tenantId, asset.Id, asset.CurrentVersion, token).ConfigureAwait(false);
                if (current != null && Fingerprint(current) == Fingerprint(version)) return new AgentAssetUploadResult { Version = current, Created = false };
            }

            Dictionary<string, byte[]>? databaseContent = null;
            if (store == null || store.Kind == ArtifactStoreKindEnum.Database)
            {
                databaseContent = new Dictionary<string, byte[]>(StringComparer.Ordinal);
                foreach (AgentAssetFile file in version.Files) databaseContent[file.StorageKey] = bytesByPath[file.Path];
            }
            else
            {
                foreach (AgentAssetFile file in version.Files)
                {
                    try
                    {
                        await _Storage.PutAsync(store, Locator(tenantId, store, file.StorageKey, file.SizeBytes, file.MediaType), bytesByPath[file.Path], token).ConfigureAwait(false);
                    }
                    catch (IOException) when (store.Kind == ArtifactStoreKindEnum.Filesystem)
                    {
                        // Content-addressed: the object already holds these exact bytes.
                    }
                }
            }
            AgentAssetVersion saved = await _Server.Database.AgentAssets.CreateVersionAsync(version, databaseContent, token).ConfigureAwait(false);
            await AuditAsync(ctx, tenantId, asset.Id, "Uploaded version " + saved.Number + " of asset " + asset.Name + " (" + saved.Files.Count + " file(s), " + saved.TotalBytes + " bytes).", token).ConfigureAwait(false);
            return new AgentAssetUploadResult { Version = saved, Created = true };
        }

        /// <summary>
        /// Read one file's content and check it against its recorded hash.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="asset">Asset.</param>
        /// <param name="file">File metadata from a version of the asset.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Bytes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        /// <exception cref="NotFoundException">Thrown when the content is missing.</exception>
        /// <exception cref="IOException">Thrown when the content does not match its hash.</exception>
        public async Task<byte[]> ReadFileAsync(string tenantId, AgentAsset asset, AgentAssetFile file, CancellationToken token = default)
        {
            if (asset == null) throw new ArgumentNullException(nameof(asset));
            if (file == null) throw new ArgumentNullException(nameof(file));
            ArtifactStore? store = await StoreAsync(tenantId, asset, token).ConfigureAwait(false);
            byte[] content;
            if (store == null || store.Kind == ArtifactStoreKindEnum.Database)
            {
                content = await _Server.Database.AgentAssets.ReadContentAsync(tenantId, file.StorageKey, token).ConfigureAwait(false)
                    ?? throw new NotFoundException("Asset content " + file.Path + " not found.");
            }
            else
            {
                content = await _Storage.ReadAsync(store, Locator(tenantId, store, file.StorageKey, file.SizeBytes, file.MediaType), token).ConfigureAwait(false);
            }
            string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
            if (!String.Equals(sha, file.Sha256, StringComparison.Ordinal)) throw new IOException("Asset content " + file.Path + " does not match its recorded SHA-256.");
            return content;
        }

        /// <summary>
        /// Give every asset file of a leased run's spec a short-lived, download-only URL (AD2.4). The ticket names the
        /// tenant, asset, version, and content hash, so it opens exactly one file.
        /// </summary>
        /// <param name="run">Run being leased.</param>
        /// <param name="spec">Compiled spec; changed in place.</param>
        /// <param name="apiBaseUrl">Base URL workers reach the control plane on.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public void ApplyDownloadUrls(Run run, Garrison.Core.Compilation.ExecutionSpec spec, string apiBaseUrl)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (String.IsNullOrEmpty(apiBaseUrl)) throw new ArgumentNullException(nameof(apiBaseUrl));
            foreach (Garrison.Core.Compilation.ExecutionAssetFile file in spec.AssetFiles)
            {
                string ticket = _Tickets.Issue(new TokenPayload
                {
                    Purpose = "AssetDownload",
                    TokenId = file.AssetId + "|" + file.Version.ToString(System.Globalization.CultureInfo.InvariantCulture) + "|" + file.Sha256,
                    TenantId = run.TenantId,
                    RunId = run.Id,
                    SessionId = "asset-download",
                    ExpiresUtc = DateTime.UtcNow.AddSeconds(_Server.Settings.Artifacts.DownloadLifetimeSeconds)
                });
                file.DownloadUrl = apiBaseUrl.TrimEnd('/') + "/v1.0/asset-download/" + Uri.EscapeDataString(file.AssetId) + "?ticket=" + Uri.EscapeDataString(ticket);
            }
        }

        /// <summary>
        /// Resolve a download ticket to the asset file it opens and read its verified content.
        /// </summary>
        /// <param name="assetId">Asset identifier from the route.</param>
        /// <param name="ticket">Ticket.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File metadata and bytes, or null when the ticket is invalid, expired, or for another file.</returns>
        public async Task<AgentAssetDownload?> ResolveDownloadAsync(string assetId, string ticket, CancellationToken token = default)
        {
            TokenPayload? payload = _Tickets.Validate(ticket ?? String.Empty);
            if (payload?.Purpose != "AssetDownload" || String.IsNullOrEmpty(payload.TenantId)) return null;
            string[] parts = payload.TokenId.Split('|');
            if (parts.Length != 3 || parts[0] != assetId || !Int32.TryParse(parts[1], out int number)) return null;
            AgentAsset? asset = await _Server.Database.AgentAssets.ReadAsync(payload.TenantId, assetId, token).ConfigureAwait(false);
            if (asset == null) return null;
            AgentAssetVersion? version = await _Server.Database.AgentAssets.ReadVersionAsync(payload.TenantId, assetId, number, token).ConfigureAwait(false);
            AgentAssetFile? file = version?.Files.FirstOrDefault(f => f.Sha256 == parts[2]);
            if (file == null) return null;
            byte[] content = await ReadFileAsync(payload.TenantId, asset, file, token).ConfigureAwait(false);
            return new AgentAssetDownload { File = file, Content = content };
        }

        /// <summary>
        /// Whether a path is a valid asset file path: relative, forward slashes, no "." or ".." segments, no control
        /// characters, at most 512 characters.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>True when valid.</returns>
        public static bool ValidPath(string? path)
        {
            return Garrison.Core.Helpers.RelativePaths.IsValid(path);
        }

        #endregion

        #region Private-Methods

        private async Task ValidateAsync(string tenantId, AgentAsset asset, CancellationToken token)
        {
            Dictionary<string, string> errors = new Dictionary<string, string>();
            Dictionary<string, string> codes = new Dictionary<string, string>();
            if (!_Name.IsMatch(asset.Name)) errors["name"] = "Asset names are 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit.";
            if (asset.Description != null && asset.Description.Length > 4000) errors["description"] = "At most 4000 characters.";
            for (int i = 0; i < asset.Tags.Count; i++)
            {
                if (String.IsNullOrWhiteSpace(asset.Tags[i]) || asset.Tags[i].Length > 128) errors["tags[" + i + "]"] = "Tags are 1 to 128 characters.";
            }
            string? code = null;
            if (asset.Kind == AgentAssetKindEnum.SystemPrompt)
            {
                if (String.IsNullOrEmpty(asset.PromptTemplateId))
                {
                    errors["promptTemplateId"] = "SystemPrompt assets name the prompt template that holds their text.";
                    codes["promptTemplateId"] = "AssetTemplateRequired";
                    code = "AssetTemplateRequired";
                }
                else if (await _Server.Database.PromptTemplates.ReadAsync(tenantId, asset.PromptTemplateId, token).ConfigureAwait(false) == null)
                {
                    errors["promptTemplateId"] = "Prompt template " + asset.PromptTemplateId + " was not found.";
                    codes["promptTemplateId"] = "ReferenceNotFound";
                }
                if (!String.IsNullOrEmpty(asset.ArtifactStoreId)) errors["artifactStoreId"] = "SystemPrompt assets have no files to store.";
            }
            else if (!String.IsNullOrEmpty(asset.PromptTemplateId))
            {
                errors["promptTemplateId"] = "Only SystemPrompt assets name a prompt template.";
            }
            if (!String.IsNullOrEmpty(asset.ArtifactStoreId) && asset.Kind != AgentAssetKindEnum.SystemPrompt)
            {
                ArtifactStore? store = await _Server.Database.ArtifactStores.ReadAsync(tenantId, asset.ArtifactStoreId, token).ConfigureAwait(false);
                if (store == null)
                {
                    errors["artifactStoreId"] = "Artifact store " + asset.ArtifactStoreId + " was not found.";
                    codes["artifactStoreId"] = "ReferenceNotFound";
                }
            }
            if (errors.Count == 0) return;
            ValidationException error = new ValidationException("The asset is invalid.", errors, codes);
            if (code != null) error.Code = code;
            throw error;
        }

        private async Task<ArtifactStore?> StoreAsync(string tenantId, AgentAsset asset, CancellationToken token)
        {
            if (String.IsNullOrEmpty(asset.ArtifactStoreId)) return null;
            return await _Server.Database.ArtifactStores.ReadAsync(tenantId, asset.ArtifactStoreId, token).ConfigureAwait(false);
        }

        private static string StorageKey(string tenantId, string assetId, string sha)
        {
            string tenant = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tenantId))).ToLowerInvariant();
            return Constants.AssetKeyPrefix + tenant + "/" + assetId + "/" + sha;
        }

        private static Artifact Locator(string tenantId, ArtifactStore store, string storageKey, long sizeBytes, string mediaType)
        {
            string prefix = String.IsNullOrEmpty(store.PathPrefix) ? store.Id : store.PathPrefix;
            Artifact locator = new Artifact();
            locator.TenantId = tenantId;
            locator.ArtifactStoreId = store.Id;
            locator.Location = prefix.TrimEnd('/') + "/" + storageKey;
            locator.SizeBytes = sizeBytes;
            locator.MediaType = mediaType;
            return locator;
        }

        private static string Fingerprint(AgentAssetVersion version)
        {
            return String.Join("\n", version.Files.OrderBy(f => f.Path, StringComparer.Ordinal).Select(f => f.Path + " " + f.Sha256 + " " + f.MediaType));
        }

        private static string MediaTypeFor(string path)
        {
            return Garrison.Core.Helpers.MediaTypes.ForPath(path);
        }

        private Task AuditAsync(RequestContext ctx, string tenantId, string id, string description, CancellationToken token)
        {
            return _Server.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgentAsset", id, description, tenantId, token);
        }

        #endregion
    }
}
