namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Conversation file space sync on the worker (AD3.3, AD-015): before launch, download the space's files, check
    /// their hashes, and add them to the spec as workspace files under the mount path; after the harness exits, write
    /// new and changed regular files under the mount path back through the node protocol with the version each run
    /// started from, so a stale write becomes a conflict file instead of overwriting. Links and paths that leave the
    /// mount path are skipped. Thread-safe.
    /// </summary>
    public static class FileSpaceSync
    {
        #region Public-Methods

        /// <summary>
        /// Download the space's files into the spec as workspace files, then clear their URLs.
        /// </summary>
        /// <param name="spec">Execution spec; changed in place.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Null on success, or a message naming the file that failed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when spec is null.</exception>
        public static async Task<string?> DownloadAsync(ExecutionSpec spec, CancellationToken token)
        {
            if (spec == null) throw new ArgumentNullException(nameof(spec));
            if (spec.FileSpace == null || spec.FileSpace.Files.Count == 0) return null;
            using (HttpClient client = new HttpClient { Timeout = TimeSpan.FromSeconds(Math.Max(30, spec.Artifacts?.TimeoutSeconds ?? 30)) })
            {
                foreach (ExecutionFileSpaceFile file in spec.FileSpace.Files)
                {
                    token.ThrowIfCancellationRequested();
                    if (String.IsNullOrEmpty(file.DownloadUrl)) continue;
                    if (!RelativePaths.IsValid(file.Path)) return "File space path " + file.Path + " is not a safe relative path.";
                    byte[] content;
                    try
                    {
                        content = await client.GetByteArrayAsync(file.DownloadUrl, token).ConfigureAwait(false);
                    }
                    catch (HttpRequestException e)
                    {
                        return "File space file " + file.Path + " could not be downloaded: " + e.Message;
                    }
                    string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
                    if (!String.Equals(sha, file.Sha256, StringComparison.Ordinal)) return "File space file " + file.Path + " version " + file.Version + " does not match its recorded SHA-256.";
                    spec.Files.Add(new ExecutionFile { BaseDirectory = FileBaseDirectoryEnum.Workspace, Path = spec.FileSpace.MountPath + "/" + file.Path, ContentBase64 = Convert.ToBase64String(content) });
                    file.DownloadUrl = null;
                }
            }
            return null;
        }

        /// <summary>
        /// Find new and changed regular files under the mount path: path relative to the mount path, base version, and
        /// content. Files over MaxFileBytes and anything past MaxFiles are reported through the warning callback and
        /// skipped.
        /// </summary>
        /// <param name="workspace">Workspace directory.</param>
        /// <param name="fileSpace">The run's file space.</param>
        /// <param name="warning">Warning callback (message).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Changed files.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<List<FileSpaceChange>> ChangesAsync(string workspace, ExecutionFileSpace fileSpace, Action<string> warning, CancellationToken token)
        {
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (fileSpace == null) throw new ArgumentNullException(nameof(fileSpace));
            if (warning == null) throw new ArgumentNullException(nameof(warning));
            List<FileSpaceChange> changes = new List<FileSpaceChange>();
            string root = Path.GetFullPath(Path.Combine(workspace, fileSpace.MountPath));
            if (!Directory.Exists(root) || SafePaths.IsLink(root)) return changes;
            Dictionary<string, ExecutionFileSpaceFile> known = fileSpace.Files.ToDictionary(f => f.Path, f => f, StringComparer.Ordinal);
            Queue<string> pending = new Queue<string>();
            pending.Enqueue(root);
            while (pending.Count > 0)
            {
                token.ThrowIfCancellationRequested();
                string directory = pending.Dequeue();
                foreach (string path in Directory.EnumerateFileSystemEntries(directory).OrderBy(p => p, StringComparer.Ordinal))
                {
                    if (SafePaths.IsLink(path)) continue;
                    if (Directory.Exists(path))
                    {
                        pending.Enqueue(path);
                        continue;
                    }
                    string relative = Path.GetRelativePath(root, path).Replace('\\', '/');
                    if (!RelativePaths.IsValid(relative)) continue;
                    long length = new FileInfo(path).Length;
                    if (length > fileSpace.MaxFileBytes)
                    {
                        warning("File " + relative + " is " + length + " bytes, over the file space limit of " + fileSpace.MaxFileBytes + " bytes; it was not saved.");
                        continue;
                    }
                    byte[] content = await File.ReadAllBytesAsync(path, token).ConfigureAwait(false);
                    string sha = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant();
                    known.TryGetValue(relative, out ExecutionFileSpaceFile? start);
                    if (start != null && String.Equals(start.Sha256, sha, StringComparison.Ordinal)) continue;
                    if (changes.Count >= fileSpace.MaxFiles)
                    {
                        warning("More than " + fileSpace.MaxFiles + " files changed; the rest were not saved.");
                        return changes;
                    }
                    changes.Add(new FileSpaceChange { Path = relative, BaseVersion = start?.Version ?? 0, Content = content });
                }
            }
            return changes;
        }

        /// <summary>
        /// Write changed files back through the assignment's node-authenticated uploader. Conflicts and failures are
        /// reported through the callbacks; one failed file does not stop the others.
        /// </summary>
        /// <param name="assignment">Run assignment with a file uploader.</param>
        /// <param name="changes">Changed files.</param>
        /// <param name="conflict">Called with each conflict result.</param>
        /// <param name="warning">Called with each failure message.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of files committed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<int> WriteBackAsync(RunAssignment assignment, List<FileSpaceChange> changes, Action<FileSpaceUploadResult> conflict, Action<string> warning, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            if (changes == null) throw new ArgumentNullException(nameof(changes));
            if (conflict == null) throw new ArgumentNullException(nameof(conflict));
            if (warning == null) throw new ArgumentNullException(nameof(warning));
            if (changes.Count == 0) return 0;
            if (assignment.FileUploader == null)
            {
                warning("This worker has no file space transport; " + changes.Count + " changed file(s) were not saved.");
                return 0;
            }
            int written = 0;
            foreach (FileSpaceChange change in changes)
            {
                token.ThrowIfCancellationRequested();
                try
                {
                    FileSpaceUploadResult result = await assignment.FileUploader(change.Path, change.BaseVersion, change.Content, token).ConfigureAwait(false);
                    written++;
                    if (result.Conflict) conflict(result);
                }
                catch (Exception e) when (e is not OperationCanceledException)
                {
                    warning("File " + change.Path + " could not be saved to the file space: " + e.Message);
                }
            }
            return written;
        }

        #endregion
    }
}
