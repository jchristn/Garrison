namespace Garrison.Server.Services
{
    using System;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Storage;

    /// <summary>Run-bound artifact transfers, idempotent metadata, and download-only signed tickets. Thread-safe.</summary>
    public class ArtifactService
    {
        private readonly ServerContext _Context;
        private readonly ArtifactStorage _Storage;
        private readonly TokenService _Tickets;

        /// <summary>Construct artifact services.</summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public ArtifactService(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Storage = new ArtifactStorage(context);
            // Tickets use their own keys, derived from the signing key and the master key under an artifact label, so a
            // session token never validates as a ticket and forging one needs both secrets (SR-12).
            _Tickets = new TokenService(context.Settings.Auth.SigningKey, context.Settings.Auth.Issuer, context.Settings.Auth.TokenLifetimeMinutes, "artifact-download:" + context.Settings.Security.MasterKey);
        }

        /// <summary>Upload a configured workspace file. Retries return the same artifact only when content matches.</summary>
        /// <param name="tenantId">Authenticated tenant.</param>
        /// <param name="runId">Producing run.</param>
        /// <param name="storeId">Compiled store binding.</param>
        /// <param name="name">Workspace-relative name.</param>
        /// <param name="mediaType">Validated media type.</param>
        /// <param name="epoch">Current lease epoch.</param>
        /// <param name="repairAttempt">Current repair phase.</param>
        /// <param name="content">Bounded bytes.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Persisted metadata; never the file bytes.</returns>
        public async Task<Artifact> UploadAsync(string tenantId, string runId, string storeId, string name, string mediaType, long epoch, int repairAttempt, byte[] content, CancellationToken token)
        {
            if (name.StartsWith(".garrison/", StringComparison.OrdinalIgnoreCase)) throw new ValidationException("The .garrison namespace is reserved for node-authenticated execution state.");
            return await UploadCoreAsync(tenantId, runId, storeId, name, mediaType, epoch, repairAttempt, content, null, token).ConfigureAwait(false);
        }

        /// <summary>Upload internal state using a separately authenticated worker node identity and a live execution fence.</summary>
        /// <param name="tenantId">Run tenant.</param><param name="runId">Run.</param><param name="storeId">Store.</param><param name="name">Exact internal archive name.</param><param name="epoch">Lease epoch.</param><param name="repairAttempt">Repair phase.</param><param name="content">Archive bytes.</param><param name="nodeId">Authenticated node.</param><param name="token">Cancellation.</param><returns>Artifact metadata.</returns>
        public Task<Artifact> UploadInternalAsync(string tenantId, string runId, string storeId, string name, long epoch, int repairAttempt, byte[] content, string nodeId, CancellationToken token)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ValidationException("An authenticated node is required.");
            return UploadCoreAsync(tenantId, runId, storeId, name, "application/zip", epoch, repairAttempt, content, nodeId, token);
        }

        private async Task<Artifact> UploadCoreAsync(string tenantId, string runId, string storeId, string name, string mediaType, long epoch, int repairAttempt, byte[] content, string? nodeId, CancellationToken token)
        {
            if (content == null) throw new ArgumentNullException(nameof(content));
            if (content.Length > _Context.Settings.Artifacts.MaxFileBytes) throw new ValidationException("Artifact exceeds the configured file byte limit.");
            if (!ArtifactGlob.Matches("**/*", name)) throw new ValidationException("Artifact name must be a relative workspace path.");
            if (!System.Text.RegularExpressions.Regex.IsMatch(mediaType, "\\A[a-zA-Z0-9!#$&^_.+-]+/[a-zA-Z0-9!#$&^_.+-]+\\z", System.Text.RegularExpressions.RegexOptions.NonBacktracking)) throw new ValidationException("Artifact media type is invalid.");
            Run run = await _Context.Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false) ?? throw new NotFoundException("Run not found.");
            if (run.LeaseEpoch != epoch || run.RepairAttempts != repairAttempt || (run.Status != RunStatusEnum.Leased && run.Status != RunStatusEnum.Running)) throw new ConflictException("StaleArtifactUpload", "Artifact upload no longer belongs to the current active execution.");
            if (nodeId != null && (run.LeaseNodeId != nodeId || !run.LeaseExpiresUtc.HasValue || run.LeaseExpiresUtc.Value <= DateTime.UtcNow || run.CancelRequested)) throw new ConflictException("StaleArtifactUpload", "The node no longer holds the run lease.");
            Deployment deployment = await _Context.Database.Deployments.ReadAsync(tenantId, run.DeploymentId, token).ConfigureAwait(false) ?? throw new NotFoundException("Deployment not found.");
            bool preparedCache = false;
            if (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId) && name.StartsWith(".garrison/prepared-", StringComparison.Ordinal))
            {
                WorkspaceTemplate? workspace = await _Context.Database.WorkspaceTemplates.ReadAsync(tenantId, deployment.WorkspaceTemplateId, token).ConfigureAwait(false);
                Secret? credential = workspace == null || String.IsNullOrEmpty(workspace.GitCredentialSecretId) ? null : await _Context.Database.Secrets.ReadAsync(tenantId, workspace.GitCredentialSecretId, token).ConfigureAwait(false);
                string? key = workspace == null ? null : WorkspaceCacheKey.For(tenantId, workspace, credential);
                preparedCache = key != null && name == ".garrison/prepared-" + key + ".zip";
            }
            bool checkpoint = deployment.SuspensionEnabled && name == ".garrison/continuation.zip";
            if (nodeId != null && !checkpoint && !preparedCache) throw new ValidationException("Node archive uploads require an exact configured internal name.");
            if (name.StartsWith(".garrison/", StringComparison.OrdinalIgnoreCase) && !checkpoint && !preparedCache) throw new ValidationException("The .garrison namespace is reserved for internal execution state.");
            if (deployment.ArtifactStoreId != storeId || (!preparedCache && !(deployment.SuspensionEnabled && name == ".garrison/continuation.zip") && !deployment.ArtifactGlobs.Any(glob => ArtifactGlob.Matches(glob, name)))) throw new ValidationException("Artifact is not selected by the deployment's configured store and globs.");
            ArtifactStore store = await StoreAsync(tenantId, storeId, token).ConfigureAwait(false);
            if (!store.Active) throw new ValidationException("Artifact store is inactive.");
            string hash = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
            Artifact? existing = await _Context.Database.Artifacts.ReadUploadAsync(tenantId, runId, epoch, repairAttempt, name, token).ConfigureAwait(false);
            if (existing != null) return Replay(existing, hash, storeId);
            Artifact artifact = new Artifact
            {
                TenantId = tenantId, RunId = runId, ArtifactStoreId = storeId, Name = name, MediaType = mediaType,
                LeaseEpoch = epoch, RepairAttempt = repairAttempt, Sha256 = hash, SizeBytes = content.Length
            };
            string prefix = String.IsNullOrEmpty(store.PathPrefix) ? store.Id : store.PathPrefix;
            artifact.Location = prefix.TrimEnd('/') + "/" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(tenantId))).ToLowerInvariant() + "/" + artifact.Id;
            if (!ArtifactStorage.ValidLocation(artifact.Location)) throw new ValidationException("Artifact store path prefix is invalid.");
            try
            {
                await _Storage.PutAsync(store, artifact, content, token).ConfigureAwait(false);
                return await _Context.Database.Artifacts.CreateForExecutionAsync(artifact, store.Kind == ArtifactStoreKindEnum.Database ? content : null, token, nodeId).ConfigureAwait(false)
                    ?? throw new ConflictException("StaleArtifactUpload", "The execution changed before artifact metadata could be committed.");
            }
            catch (Exception ex) when (DatabaseFailures.IsUniqueViolation(ex))
            {
                await _Storage.DeleteAsync(store, artifact, token).ConfigureAwait(false);
                Artifact? winner = await _Context.Database.Artifacts.ReadUploadAsync(tenantId, runId, epoch, repairAttempt, name, token).ConfigureAwait(false);
                if (winner == null) throw;
                return Replay(winner, hash, storeId);
            }
            catch
            {
                // A storage write can finish before metadata fails. Remove only this request's unique object.
                using (CancellationTokenSource cleanup = new CancellationTokenSource(TimeSpan.FromSeconds(10)))
                {
                    try
                    {
                        // If commit acknowledgment was lost, preserve any object whose metadata actually committed.
                        if (await _Context.Database.Artifacts.ReadAsync(tenantId, artifact.Id, cleanup.Token).ConfigureAwait(false) == null)
                            await _Storage.DeleteAsync(store, artifact, cleanup.Token).ConfigureAwait(false);
                    }
                    catch (Exception cleanupError) when (cleanupError is System.IO.IOException || cleanupError is Amazon.S3.AmazonS3Exception || cleanupError is OperationCanceledException || cleanupError is System.Data.Common.DbException) { }
                }
                throw;
            }
        }

        /// <summary>Issue a ticket that can only download this artifact, never authenticate a session.</summary>
        /// <param name="artifact">Authorized artifact metadata.</param>
        /// <param name="expiresUtc">Expiration to include in the response.</param>
        /// <returns>Opaque signed/encrypted ticket.</returns>
        public string Ticket(Artifact artifact, out DateTime expiresUtc)
        {
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            expiresUtc = DateTime.UtcNow.AddSeconds(_Context.Settings.Artifacts.DownloadLifetimeSeconds);
            return _Tickets.Issue(new TokenPayload
            {
                Purpose = "ArtifactDownload", TokenId = artifact.Id, TenantId = artifact.TenantId, RunId = artifact.RunId,
                SessionId = "artifact-download", ExpiresUtc = expiresUtc
            });
        }

        /// <summary>Resolve a valid download-only ticket to its exact artifact.</summary>
        /// <param name="id">Artifact route identifier.</param>
        /// <param name="ticket">Opaque ticket.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Artifact, or null for invalid, expired, wrong-purpose, or mismatched tickets.</returns>
        public async Task<Artifact?> ResolveTicketAsync(string id, string ticket, CancellationToken token)
        {
            TokenPayload? payload = _Tickets.Validate(ticket);
            if (payload?.Purpose != "ArtifactDownload" || payload.TokenId != id || String.IsNullOrEmpty(payload.TenantId)) return null;
            return await _Context.Database.Artifacts.ReadAsync(payload.TenantId, id, token).ConfigureAwait(false);
        }

        /// <summary>Read content for an already authorized artifact.</summary>
        /// <param name="artifact">Scoped metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File bytes.</returns>
        public async Task<byte[]> ReadAsync(Artifact artifact, CancellationToken token)
        {
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            return await _Storage.ReadAsync(await StoreAsync(artifact.TenantId, artifact.ArtifactStoreId, token).ConfigureAwait(false), artifact, token).ConfigureAwait(false);
        }

        /// <summary>Delete external and database content for an already authorized artifact.</summary>
        /// <param name="artifact">Scoped metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(Artifact artifact, CancellationToken token)
        {
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            await _Storage.DeleteAsync(await StoreAsync(artifact.TenantId, artifact.ArtifactStoreId, token).ConfigureAwait(false), artifact, token).ConfigureAwait(false);
            await _Context.Database.Artifacts.DeleteAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false);
        }

        private async Task<ArtifactStore> StoreAsync(string tenantId, string id, CancellationToken token)
        {
            return await _Context.Database.ArtifactStores.ReadAsync(tenantId, id, token).ConfigureAwait(false) ?? throw new NotFoundException("Artifact store not found.");
        }

        private static Artifact Replay(Artifact existing, string hash, string storeId)
        {
            if (existing.Sha256 != hash || existing.ArtifactStoreId != storeId) throw new ConflictException("ArtifactUploadConflict", "This execution already uploaded different content under the same artifact name.");
            return existing;
        }
    }
}
