namespace Garrison.Core.Memory
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// Default scoped memory content store (AA4): one owner-only file per written version under an operator-owned root,
    /// at root/H(tenant)/scopes/Kind/H(scope)/contentId.txt, where H is the uppercase hexadecimal SHA-256 of the UTF-8
    /// identifier. Agent memory written before scopes existed stays where FilesystemAgentMemoryStore put it,
    /// root/H(tenant)/H(agent)/H(key).txt, and is addressed with the content handle "legacy-" followed by H(key).
    /// Share the root across replicas. Thread-safe.
    /// </summary>
    /// <remarks>The root and its parents must be operator-owned; untrusted processes must never write to this tree.
    /// Paths through filesystem links are refused.</remarks>
    public sealed class FilesystemScopedMemoryStore : IScopedMemoryStore
    {
        #region Public-Members

        /// <summary>
        /// Prefix of the content handle of agent memory written before scopes existed.
        /// </summary>
        public static readonly string LegacyContentPrefix = "legacy-";

        /// <summary>
        /// Operator-owned root directory, absolute.
        /// </summary>
        public string Root
        {
            get
            {
                return _Root;
            }
        }

        /// <summary>
        /// Most UTF-8 bytes in one piece of content. Minimum 1, maximum 1048576, default 65536.
        /// </summary>
        public int MaxBytes
        {
            get
            {
                return _MaxBytes;
            }
        }

        #endregion

        #region Private-Members

        private readonly string _Root;
        private readonly int _MaxBytes;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Create a store over a root shared with FilesystemAgentMemoryStore.
        /// </summary>
        /// <param name="root">Operator-owned persistent directory.</param>
        /// <param name="maxBytes">Most UTF-8 bytes in one piece of content, 1 to 1048576; default 65536.</param>
        /// <exception cref="ArgumentException">Thrown when root is empty.</exception>
        public FilesystemScopedMemoryStore(string root, int maxBytes = 65536)
        {
            if (String.IsNullOrWhiteSpace(root)) throw new ArgumentException("A persistent memory root is required.", nameof(root));
            _Root = Path.TrimEndingDirectorySeparator(Path.GetFullPath(root));
            _MaxBytes = Math.Clamp(maxBytes, 1, 1048576);
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Content handle of agent memory that FilesystemAgentMemoryStore wrote for a key.
        /// </summary>
        /// <param name="key">Key.</param>
        /// <returns>Content handle.</returns>
        /// <exception cref="ArgumentNullException">Thrown when key is null.</exception>
        public static string LegacyContentId(string key)
        {
            if (key == null) throw new ArgumentNullException(nameof(key));
            return LegacyContentPrefix + Hash(key);
        }

        /// <inheritdoc />
        public async Task WriteAsync(MemoryContentAddress address, string content, CancellationToken token)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            if (content == null) throw new ArgumentNullException(nameof(content));
            token.ThrowIfCancellationRequested();
            byte[] data = Encoding.UTF8.GetBytes(content);
            if (data.Length > _MaxBytes) throw new ArgumentException("Memory content exceeds the configured byte limit.", nameof(content));
            string path = Location(address, true);
            string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                FileStreamOptions options = new FileStreamOptions { Mode = FileMode.CreateNew, Access = FileAccess.Write, Share = FileShare.None, Options = FileOptions.Asynchronous };
                if (!OperatingSystem.IsWindows()) options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
                using (FileStream stream = new FileStream(temporary, options))
                {
                    await stream.WriteAsync(data, token).ConfigureAwait(false);
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
        public async Task<string?> ReadAsync(MemoryContentAddress address, CancellationToken token)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            token.ThrowIfCancellationRequested();
            string path = Location(address, false);
            if (!File.Exists(path)) return null;
            using (FileStream stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete, 4096, true))
            {
                if (stream.Length > _MaxBytes) throw new IOException("Memory content exceeds the configured byte limit.");
                byte[] data = new byte[checked((int)stream.Length)];
                await stream.ReadExactlyAsync(data, token).ConfigureAwait(false);
                return new UTF8Encoding(false, true).GetString(data);
            }
        }

        /// <inheritdoc />
        public Task DeleteAsync(MemoryContentAddress address, CancellationToken token)
        {
            if (address == null) throw new ArgumentNullException(nameof(address));
            token.ThrowIfCancellationRequested();
            string path = Location(address, false);
            try { File.Delete(path); }
            catch (DirectoryNotFoundException) { /* An absent scope is absent content. */ }
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task DeleteScopeAsync(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId, CancellationToken token)
        {
            Validate(tenantId, nameof(tenantId));
            Validate(scopeId, nameof(scopeId));
            token.ThrowIfCancellationRequested();
            DeleteDirectory(ScopeDirectory(tenantId, scopeKind, scopeId));
            if (scopeKind == MemoryScopeKindEnum.Agent) DeleteDirectory(Path.Combine(_Root, Hash(tenantId), Hash(scopeId)));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task DeleteTenantAsync(string tenantId, CancellationToken token)
        {
            Validate(tenantId, nameof(tenantId));
            token.ThrowIfCancellationRequested();
            DeleteDirectory(Path.Combine(_Root, Hash(tenantId)));
            return Task.CompletedTask;
        }

        /// <inheritdoc />
        public Task<int> RemoveUnreferencedAsync(string tenantId, ISet<string> referenced, DateTime writtenBeforeUtc, CancellationToken token)
        {
            Validate(tenantId, nameof(tenantId));
            if (referenced == null) throw new ArgumentNullException(nameof(referenced));
            string scopes = Path.Combine(_Root, Hash(tenantId), "scopes");
            if (!Directory.Exists(scopes)) return Task.FromResult(0);
            RejectLinks(scopes);
            int removed = 0;
            foreach (string file in Directory.EnumerateFiles(scopes, "*", SearchOption.AllDirectories))
            {
                token.ThrowIfCancellationRequested();
                FileInfo info = new FileInfo(file);
                if (info.LinkTarget != null || info.LastWriteTimeUtc >= writtenBeforeUtc) continue;
                string name = info.Name;
                bool temporary = name.EndsWith(".tmp", StringComparison.Ordinal);
                string contentId = name.EndsWith(".txt", StringComparison.Ordinal) ? name.Substring(0, name.Length - 4) : name;
                if (!temporary && referenced.Contains(contentId)) continue;
                try
                {
                    File.Delete(file);
                    removed++;
                }
                catch (IOException) { /* Removed by another replica or busy; the next sweep retries. */ }
            }
            return Task.FromResult(removed);
        }

        /// <summary>
        /// Key hashes of the agent memory FilesystemAgentMemoryStore wrote for an agent, for importing it as Agent scope
        /// entries (AA4.7). The keys themselves were never stored.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Uppercase hexadecimal key hashes with each file's size in bytes and last write time.</returns>
        /// <exception cref="ArgumentException">Thrown when tenantId or agentId is empty or too long.</exception>
        public Task<List<LegacyMemoryFile>> ListLegacyAgentMemoryAsync(string tenantId, string agentId, CancellationToken token)
        {
            Validate(tenantId, nameof(tenantId));
            Validate(agentId, nameof(agentId));
            List<LegacyMemoryFile> files = new List<LegacyMemoryFile>();
            string directory = Path.Combine(_Root, Hash(tenantId), Hash(agentId));
            if (!Directory.Exists(directory)) return Task.FromResult(files);
            RejectLinks(directory);
            foreach (string file in Directory.EnumerateFiles(directory, "*.txt", SearchOption.TopDirectoryOnly))
            {
                token.ThrowIfCancellationRequested();
                FileInfo info = new FileInfo(file);
                string name = info.Name.Substring(0, info.Name.Length - 4);
                if (info.LinkTarget != null || name.Length != 64 || !IsHex(name)) continue;
                LegacyMemoryFile entry = new LegacyMemoryFile();
                entry.KeyHash = name;
                entry.Bytes = info.Length;
                entry.LastWriteUtc = info.LastWriteTimeUtc;
                files.Add(entry);
            }
            return Task.FromResult(files);
        }

        #endregion

        #region Private-Methods

        private string Location(MemoryContentAddress address, bool create)
        {
            Validate(address.TenantId, nameof(address.TenantId));
            Validate(address.ScopeId, nameof(address.ScopeId));
            string contentId = address.ContentId;
            if (String.IsNullOrEmpty(contentId) || contentId.Length > 128) throw new ArgumentException("A content handle holds 1 to 128 characters.", nameof(address));
            foreach (char c in contentId)
            {
                if (!(c >= 'a' && c <= 'z') && !(c >= 'A' && c <= 'Z') && !(c >= '0' && c <= '9') && c != '-') throw new ArgumentException("A content handle holds letters, digits, and hyphens.", nameof(address));
            }
            string directory;
            string file;
            if (contentId.StartsWith(LegacyContentPrefix, StringComparison.Ordinal))
            {
                string keyHash = contentId.Substring(LegacyContentPrefix.Length);
                if (address.ScopeKind != MemoryScopeKindEnum.Agent || keyHash.Length != 64 || !IsHex(keyHash)) throw new ArgumentException("Legacy content belongs to an Agent scope and names a key hash.", nameof(address));
                directory = Path.Combine(_Root, Hash(address.TenantId), Hash(address.ScopeId));
                file = keyHash.ToUpperInvariant() + ".txt";
            }
            else
            {
                directory = ScopeDirectory(address.TenantId, address.ScopeKind, address.ScopeId);
                file = contentId + ".txt";
            }
            string path = Path.Combine(directory, file);
            RejectLinks(path);
            if (create)
            {
                if (OperatingSystem.IsWindows()) Directory.CreateDirectory(directory);
                else Directory.CreateDirectory(directory, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                RejectLinks(path);
            }
            return path;
        }

        private string ScopeDirectory(string tenantId, MemoryScopeKindEnum scopeKind, string scopeId)
        {
            return Path.Combine(_Root, Hash(tenantId), "scopes", scopeKind.ToString(), Hash(scopeId));
        }

        private void DeleteDirectory(string directory)
        {
            if (!Directory.Exists(directory)) return;
            RejectLinks(directory);
            try { Directory.Delete(directory, true); }
            catch (DirectoryNotFoundException) { /* Deleted concurrently. */ }
        }

        private static string Hash(string value)
        {
            return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
        }

        private static bool IsHex(string value)
        {
            foreach (char c in value)
            {
                if (!Uri.IsHexDigit(c)) return false;
            }
            return true;
        }

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

        #endregion
    }
}
