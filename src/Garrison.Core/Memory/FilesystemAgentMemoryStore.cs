namespace Garrison.Core.Memory
{
    using System;
    using System.IO;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>Plain-text key/value memory with atomic publication and hashed tenant/agent/key paths. Share its volume across replicas.</summary>
    /// <remarks>The root and its parents must be operator-owned. Untrusted processes must never have write access to this tree. Last successful atomic rename wins concurrent writes.</remarks>
    public sealed class FilesystemAgentMemoryStore : IAgentMemoryStore
    {
        private readonly string _Root;
        private readonly int _MaxBytes;

        /// <summary>Create a store. Files are owner-only on Unix; existing links are rejected.</summary>
        /// <param name="root">Operator-owned persistent directory.</param><param name="maxBytes">Maximum UTF-8 value bytes, 1 to 1048576; default 65536.</param>
        /// <exception cref="ArgumentException">Root is empty.</exception>
        public FilesystemAgentMemoryStore(string root, int maxBytes = 65536)
        {
            if (String.IsNullOrWhiteSpace(root)) throw new ArgumentException("A persistent memory root is required.", nameof(root));
            _Root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root));
            _MaxBytes = Math.Clamp(maxBytes, 1, 1048576);
        }

        /// <inheritdoc />
        public async Task<string?> ReadAsync(string tenantId, string agentId, string key, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            string path = Location(tenantId, agentId, key, false);
            if (!File.Exists(path)) return null;
            using (FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete, 4096, true))
            {
                if (stream.Length > _MaxBytes) throw new IOException("Memory value exceeds the configured byte limit.");
                byte[] data = new byte[checked((int)stream.Length)];
                await stream.ReadExactlyAsync(data, token).ConfigureAwait(false);
                return new UTF8Encoding(false, true).GetString(data);
            }
        }

        /// <inheritdoc />
        public async Task WriteAsync(string tenantId, string agentId, string key, string value, CancellationToken token)
        {
            ArgumentNullException.ThrowIfNull(value);
            token.ThrowIfCancellationRequested();
            if (Encoding.UTF8.GetByteCount(value) > _MaxBytes) throw new ArgumentException("Memory value exceeds the configured byte limit.", nameof(value));
            string path = Location(tenantId, agentId, key, true);
            string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                FileStreamOptions options = new FileStreamOptions { Mode = FileMode.CreateNew, Access = FileAccess.Write, Share = FileShare.None, Options = FileOptions.Asynchronous };
                if (!OperatingSystem.IsWindows()) options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
                using (FileStream stream = new FileStream(temporary, options))
                {
                    await stream.WriteAsync(Encoding.UTF8.GetBytes(value), token).ConfigureAwait(false);
                    await stream.FlushAsync(token).ConfigureAwait(false);
                    stream.Flush(true);
                }
                token.ThrowIfCancellationRequested();
                RejectLinks(path);
                File.Move(temporary, path, true);
            }
            finally
            {
                if (File.Exists(temporary)) File.Delete(temporary);
            }
        }

        /// <inheritdoc />
        public Task DeleteAsync(string tenantId, string agentId, string key, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            string path = Location(tenantId, agentId, key, false);
            try { File.Delete(path); }
            catch (DirectoryNotFoundException) { /* An absent scope is an absent key. */ }
            return Task.CompletedTask;
        }

        private string Location(string tenantId, string agentId, string key, bool create)
        {
            Validate(tenantId, nameof(tenantId)); Validate(agentId, nameof(agentId)); Validate(key, nameof(key));
            string directory = Path.Combine(_Root, Hash(tenantId), Hash(agentId));
            string path = Path.Combine(directory, Hash(key) + ".txt");
            RejectLinks(path);
            if (create)
            {
                if (OperatingSystem.IsWindows()) Directory.CreateDirectory(directory);
                else Directory.CreateDirectory(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                RejectLinks(path);
            }
            return path;
        }

        private static string Hash(string value) { return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))); }
        private static void Validate(string value, string parameter)
        {
            if (String.IsNullOrWhiteSpace(value) || value.Length > 256) throw new ArgumentException("Memory identifiers must contain 1 to 256 characters.", parameter);
        }
        private void RejectLinks(string path)
        {
            for (string? current = path; current != null; current = Path.GetDirectoryName(current))
            {
                if ((File.Exists(current) || Directory.Exists(current) || new FileInfo(current).LinkTarget != null)
                    && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0)
                    throw new IOException("Memory paths cannot contain filesystem links.");
                if (String.Equals(current, _Root, StringComparison.Ordinal)) break;
            }
        }
    }
}
