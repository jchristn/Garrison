namespace Garrison.Server.Storage
{
    using System;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Amazon;
    using Amazon.Runtime;
    using Amazon.S3;
    using Amazon.S3.Model;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;

    /// <summary>Filesystem and S3 content operations; database bytes are persisted with metadata. Thread-safe.</summary>
    public class ArtifactStorage
    {
        private readonly ServerContext _Context;

        /// <summary>Construct server-side storage. Provider credentials never reach workers.</summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public ArtifactStorage(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
        }

        /// <summary>Validate a server-generated object location or operator-configured relative prefix.</summary>
        /// <param name="location">Slash-separated relative path.</param>
        /// <returns>Whether it is a bounded, nonescaping path.</returns>
        public static bool ValidLocation(string? location)
        {
            return !String.IsNullOrWhiteSpace(location) && location.Length <= 2048 && !location.StartsWith("/", StringComparison.Ordinal)
                && location.All(c => Char.IsAsciiLetterOrDigit(c) || c == '_' || c == '-' || c == '.' || c == '/')
                && location.Split('/').All(segment => segment.Length > 0 && segment != "." && segment != "..");
        }

        /// <summary>Write non-database bytes before metadata becomes visible.</summary>
        /// <param name="store">Store configuration.</param>
        /// <param name="artifact">Metadata with a server-generated location.</param>
        /// <param name="bytes">Bounded bytes.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task PutAsync(ArtifactStore store, Artifact artifact, byte[] bytes, CancellationToken token)
        {
            if (store == null) throw new ArgumentNullException(nameof(store));
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            if (bytes == null) throw new ArgumentNullException(nameof(bytes));
            token.ThrowIfCancellationRequested();
            if (store.Kind == ArtifactStoreKindEnum.Database) return;
            if (store.Kind == ArtifactStoreKindEnum.Filesystem)
            {
                string path = FilePath(artifact.Location);
                string directory = Path.GetDirectoryName(path)!;
                Directory.CreateDirectory(directory);
                if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                using (FileStream output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 16384, FileOptions.Asynchronous))
                {
                    if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(path, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                    await output.WriteAsync(bytes, token).ConfigureAwait(false);
                }
                return;
            }
            using (AmazonS3Client client = await ClientAsync(store, token).ConfigureAwait(false))
            using (MemoryStream stream = new MemoryStream(bytes, false))
            {
                PutObjectRequest request = new PutObjectRequest
                {
                    BucketName = store.Bucket, Key = artifact.Location, InputStream = stream, ContentType = artifact.MediaType,
                    AutoCloseStream = false, UseChunkEncoding = false
                };
                await client.PutObjectAsync(request, token).ConfigureAwait(false);
            }
        }

        /// <summary>Read exactly the recorded content length. Metadata pages never call this.</summary>
        /// <param name="store">Store configuration.</param>
        /// <param name="artifact">Scoped artifact metadata.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>File bytes.</returns>
        public async Task<byte[]> ReadAsync(ArtifactStore store, Artifact artifact, CancellationToken token)
        {
            if (store == null) throw new ArgumentNullException(nameof(store));
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            long limit = _Context.Settings.Artifacts.MaxFileBytes;
            if (artifact.SizeBytes < 0 || artifact.SizeBytes > limit) throw new ValidationException("Artifact exceeds the configured download size limit of " + limit + " bytes.");
            if (store.Kind == ArtifactStoreKindEnum.Database)
            {
                byte[] content = await _Context.Database.Artifacts.ReadContentAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false) ?? throw new NotFoundException("Artifact content not found.");
                if (content.LongLength != artifact.SizeBytes) throw new IOException("Artifact content length differs from recorded metadata.");
                return content;
            }
            if (store.Kind == ArtifactStoreKindEnum.Filesystem)
            {
                string path = FilePath(artifact.Location);
                if (!File.Exists(path)) throw new NotFoundException("Artifact content not found.");
                using (FileStream input = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 16384, FileOptions.Asynchronous))
                    return await ReadBoundedAsync(input, artifact.SizeBytes, limit, token).ConfigureAwait(false);
            }
            try
            {
                using (AmazonS3Client client = await ClientAsync(store, token).ConfigureAwait(false))
                using (GetObjectResponse response = await client.GetObjectAsync(store.Bucket, artifact.Location, token).ConfigureAwait(false))
                    return await ReadBoundedAsync(response.ResponseStream, artifact.SizeBytes, limit, token).ConfigureAwait(false);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new NotFoundException("Artifact content not found.");
            }
        }

        /// <summary>Delete external content. Database bytes are deleted with the metadata row.</summary>
        /// <param name="store">Store configuration.</param>
        /// <param name="artifact">Scoped artifact.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(ArtifactStore store, Artifact artifact, CancellationToken token)
        {
            if (store == null) throw new ArgumentNullException(nameof(store));
            if (artifact == null) throw new ArgumentNullException(nameof(artifact));
            token.ThrowIfCancellationRequested();
            if (store.Kind == ArtifactStoreKindEnum.Database) return;
            if (store.Kind == ArtifactStoreKindEnum.Filesystem) { File.Delete(FilePath(artifact.Location)); return; }
            using (AmazonS3Client client = await ClientAsync(store, token).ConfigureAwait(false))
                await client.DeleteObjectAsync(store.Bucket, artifact.Location, token).ConfigureAwait(false);
        }

        private string FilePath(string location)
        {
            if (!ValidLocation(location)) throw new ValidationException("Artifact location is invalid.");
            string root = Path.GetFullPath(_Context.Settings.Artifacts.RootDirectory);
            Directory.CreateDirectory(root);
            if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(root, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            return Path.Combine(root, location.Replace('/', Path.DirectorySeparatorChar));
        }

        private async Task<AmazonS3Client> ClientAsync(ArtifactStore store, CancellationToken token)
        {
            AmazonS3Config config = new AmazonS3Config
            {
                ForcePathStyle = store.ForcePathStyle, AuthenticationRegion = store.Region,
                RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED,
                ResponseChecksumValidation = ResponseChecksumValidation.WHEN_REQUIRED,
                MaxErrorRetry = 2
            };
            if (String.IsNullOrEmpty(store.Endpoint)) config.RegionEndpoint = RegionEndpoint.GetBySystemName(store.Region);
            else
            {
                // A tenant-chosen endpoint: connect only to addresses the outbound policy allows, checked at connect time,
                // and never follow redirects (SR-07).
                config.ServiceURL = store.Endpoint;
                config.HttpClientFactory = new GuardedS3HttpClientFactory();
            }
            if (String.IsNullOrEmpty(store.SecretId))
            {
                if (!String.IsNullOrEmpty(store.Endpoint) && !_Context.Settings.Artifacts.AllowAmbientCredentialsWithCustomEndpoint)
                    throw new ValidationException("Artifact store " + store.Name + " has a custom endpoint but no credential secret; the server's own cloud identity is not sent to it.");
                return new AmazonS3Client(config);
            }
            Secret secret = await _Context.Database.Secrets.ReadAsync(store.TenantId, store.SecretId, token).ConfigureAwait(false)
                ?? throw new NotFoundException("Artifact store credential secret not found.");
            if (!secret.Active || String.IsNullOrEmpty(secret.ValueEncrypted)) throw new ValidationException("Artifact store credentials are inactive or empty.");
            ArtifactS3Credentials? credentials;
            try { credentials = Serializer.Deserialize<ArtifactS3Credentials>(_Context.Cipher.Decrypt(secret.ValueEncrypted, secret.Id)); }
            catch (System.Text.Json.JsonException) { throw new ValidationException("Artifact store credentials must contain accessKey and secretKey."); }
            if (credentials == null || String.IsNullOrEmpty(credentials.AccessKey) || String.IsNullOrEmpty(credentials.SecretKey)) throw new ValidationException("Artifact store credentials must contain accessKey and secretKey.");
            AWSCredentials resolved = String.IsNullOrEmpty(credentials.SessionToken)
                ? new BasicAWSCredentials(credentials.AccessKey, credentials.SecretKey)
                : new SessionAWSCredentials(credentials.AccessKey, credentials.SecretKey, credentials.SessionToken);
            return new AmazonS3Client(resolved, config);
        }

        private static async Task<byte[]> ReadBoundedAsync(Stream input, long size, long limit, CancellationToken token)
        {
            if (size < 0 || size > limit) throw new ValidationException("Artifact exceeds the configured download size limit of " + limit + " bytes.");
            using (MemoryStream output = new MemoryStream((int)size))
            {
                byte[] buffer = new byte[16384];
                while (true)
                {
                    int count = await input.ReadAsync(buffer, token).ConfigureAwait(false);
                    if (count == 0) break;
                    if (output.Length + count > size) throw new IOException("Artifact content length differs from recorded metadata.");
                    await output.WriteAsync(buffer.AsMemory(0, count), token).ConfigureAwait(false);
                }
                if (output.Length != size) throw new IOException("Artifact content length differs from recorded metadata.");
                return output.ToArray();
            }
        }
    }
}
