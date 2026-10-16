namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.IO.Compression;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>Bounded portable snapshots of run work, home, and config directories. Links and special paths are refused.</summary>
    public class WorkspaceSnapshot
    {
        /// <summary>Maximum uncompressed bytes. Default 256 MiB; range 1 KiB to 1 GiB.</summary>
        public long MaxBytes { get { return _MaxBytes; } set { _MaxBytes = Math.Clamp(value, 1024, 1024L * 1024 * 1024); } }
        /// <summary>Maximum entries. Default 100000; range 1 to 1000000.</summary>
        public int MaxEntries { get { return _MaxEntries; } set { _MaxEntries = Math.Clamp(value, 1, 1000000); } }
        /// <summary>Include home and config session directories. False captures only the prepared workspace.</summary>
        public bool IncludeSession { get; set; } = true;
        private long _MaxBytes = 256L * 1024 * 1024;
        private int _MaxEntries = 100000;

        /// <summary>Create a ZIP snapshot after the harness has stopped. The caller owns the destination stream.</summary>
        /// <param name="directories">Stopped run directories.</param><param name="destination">Writable archive stream.</param><param name="token">Cancellation token.</param>
        /// <returns>Uncompressed bytes captured.</returns>
        /// <exception cref="IOException">A link or size limit prevents a complete snapshot.</exception>
        public Task<long> CaptureAsync(RunDirectories directories, Stream destination, CancellationToken token)
        {
            return Garrison.Core.Telemetry.ApplicationOperation.MeasureAsync("snapshot", "capture", ct => CaptureCoreAsync(directories, destination, ct), token);
        }

        private async Task<long> CaptureCoreAsync(RunDirectories directories, Stream destination, CancellationToken token)
        {
            if (directories == null) throw new ArgumentNullException(nameof(directories));
            if (destination == null) throw new ArgumentNullException(nameof(destination));
            long total = 0;
            int count = 0;
            using (ZipArchive archive = new ZipArchive(destination, ZipArchiveMode.Create, true))
            {
                foreach (string name in IncludeSession ? new[] { "work", "home", "config" } : new[] { "work" })
                {
                    string root = Path.Combine(directories.Root, name);
                    if (SafePaths.IsLink(root)) throw new IOException("Snapshot root is a filesystem link.");
                    Queue<string> pending = new Queue<string>();
                    pending.Enqueue(root);
                    while (pending.Count > 0)
                    {
                        token.ThrowIfCancellationRequested();
                        string directory = pending.Dequeue();
                        if (!Directory.Exists(directory)) continue;
                        foreach (string path in Directory.EnumerateFileSystemEntries(directory).OrderBy(p => p, StringComparer.Ordinal))
                        {
                            if (++count > MaxEntries) throw new IOException("Snapshot entry limit exceeded.");
                            if (SafePaths.IsLink(path)) throw new IOException("Snapshot contains a filesystem link.");
                            string relative = name + "/" + Path.GetRelativePath(root, path).Replace('\\', '/');
                            if (Directory.Exists(path)) { archive.CreateEntry(relative + "/"); pending.Enqueue(path); continue; }
                            byte[] content = await ArtifactUploader.ReadAsync(root, path, MaxBytes - total, token).ConfigureAwait(false);
                            total += content.LongLength;
                            ZipArchiveEntry entry = archive.CreateEntry(relative, CompressionLevel.Fastest);
                            if (!OperatingSystem.IsWindows()) entry.ExternalAttributes = ((int)File.GetUnixFileMode(path) & 0x1ff) << 16;
                            using (Stream output = entry.Open()) await output.WriteAsync(content, token).ConfigureAwait(false);
                        }
                    }
                }
            }
            return total;
        }

        /// <summary>Restore into a new root, checking every entry before publishing the complete directory atomically.</summary>
        /// <param name="source">Readable snapshot stream.</param><param name="directories">Destination, which must not exist.</param><param name="token">Cancellation token.</param>
        /// <returns>Uncompressed bytes restored.</returns>
        /// <exception cref="IOException">The archive is invalid, unsafe, too large, or the destination exists.</exception>
        public Task<long> RestoreAsync(Stream source, RunDirectories directories, CancellationToken token)
        {
            return Garrison.Core.Telemetry.ApplicationOperation.MeasureAsync("snapshot", "restore", ct => RestoreCoreAsync(source, directories, ct), token);
        }

        private async Task<long> RestoreCoreAsync(Stream source, RunDirectories directories, CancellationToken token)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (directories == null) throw new ArgumentNullException(nameof(directories));
            if (Directory.Exists(directories.Root) || File.Exists(directories.Root) || SafePaths.IsLink(directories.Root)) throw new IOException("Snapshot destination already exists.");
            string staging = directories.Root + ".restore-" + Guid.NewGuid().ToString("N");
            RunDirectories temporary = new RunDirectories(Path.GetDirectoryName(staging)!, Path.GetFileName(staging));
            temporary.Create();
            long total = 0;
            try
            {
                HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                using (ZipArchive archive = new ZipArchive(source, ZipArchiveMode.Read, true))
                {
                    if (archive.Entries.Count > MaxEntries) throw new IOException("Snapshot entry limit exceeded.");
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        token.ThrowIfCancellationRequested();
                        string name = entry.FullName;
                        string[] parts = name.Split('/');
                        int type = (entry.ExternalAttributes >> 16) & 0xf000;
                        if ((!IncludeSession && parts[0] != "work") || name.Contains('\\') || parts.Length < 2 || !new[] { "work", "home", "config" }.Contains(parts[0], StringComparer.Ordinal)
                            || parts.Any(p => p == "." || p == ".." || p.Contains(':')) || !seen.Add(name.TrimEnd('/'))
                            || (type != 0 && type != 0x8000 && type != 0x4000)) throw new IOException("Snapshot contains an unsafe entry.");
                        string path = SafePaths.Combine(staging, name);
                        if (name.EndsWith("/", StringComparison.Ordinal)) { Directory.CreateDirectory(path); continue; }
                        if (entry.Length > MaxBytes - total) throw new IOException("Snapshot byte limit exceeded.");
                        path = SafePaths.PrepareWrite(staging, name);
                        using (Stream input = entry.Open())
                        using (FileStream output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, 16384, FileOptions.Asynchronous))
                        {
                            byte[] buffer = new byte[16384];
                            while (true)
                            {
                                int read = await input.ReadAsync(buffer, token).ConfigureAwait(false);
                                if (read == 0) break;
                                total += read;
                                if (total > MaxBytes) throw new IOException("Snapshot byte limit exceeded.");
                                await output.WriteAsync(buffer.AsMemory(0, read), token).ConfigureAwait(false);
                            }
                        }
                        if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(path, (UnixFileMode)((entry.ExternalAttributes >> 16) & 0x1ff));
                    }
                }
                Directory.Move(staging, directories.Root);
                return total;
            }
            finally { if (Directory.Exists(staging)) Directory.Delete(staging, true); }
        }
    }
}
