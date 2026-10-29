namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Helpers;

    /// <summary>Bounded explicit-glob file selection. Empty globs do no filesystem work. Thread-safe.</summary>
    public static class ArtifactSelection
    {
        /// <summary>Select regular files below a workspace; directory and file symlinks/junctions are skipped.</summary>
        /// <param name="workspace">Workspace root.</param>
        /// <param name="settings">Explicit globs and transfer bounds.</param>
        /// <param name="warning">Optional warning callback; no file content or credentials are included.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Selected files, sorted by relative name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when workspace or settings is null.</exception>
        public static async Task<List<ArtifactFile>> SelectAsync(string workspace, ExecutionArtifacts settings, Action<string>? warning = null, CancellationToken token = default)
        {
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            token.ThrowIfCancellationRequested();
            if (settings.Globs.Count == 0) return new List<ArtifactFile>();
            return await Task.Run(() => Select(workspace, settings, warning, token), token).ConfigureAwait(false);
        }

        private static List<ArtifactFile> Select(string workspace, ExecutionArtifacts settings, Action<string>? warning, CancellationToken token)
        {
            List<ArtifactFile> result = new List<ArtifactFile>();
            List<string> globs = settings.Globs.Where(ArtifactGlob.IsValid).Distinct(StringComparer.Ordinal).ToList();
            if (globs.Count != settings.Globs.Distinct(StringComparer.Ordinal).Count()) warning?.Invoke("Invalid artifact globs were skipped.");
            if (globs.Count == 0 || !Directory.Exists(workspace)) return result;
            string root = Path.GetFullPath(workspace);
            if ((File.GetAttributes(root) & FileAttributes.ReparsePoint) != 0) return result;
            Stack<string> directories = new Stack<string>();
            directories.Push(root);
            int scanned = 0;
            long total = 0;
            bool stopped = false;
            while (directories.Count > 0 && !stopped)
            {
                token.ThrowIfCancellationRequested();
                string directory = directories.Pop();
                try
                {
                    foreach (string path in Directory.EnumerateFileSystemEntries(directory))
                    {
                        token.ThrowIfCancellationRequested();
                        if (++scanned > settings.MaxScanEntries)
                        {
                            warning?.Invoke("Artifact collection reached the maximum scanned entries.");
                            stopped = true;
                            break;
                        }
                        FileAttributes attributes = File.GetAttributes(path);
                        if ((attributes & FileAttributes.ReparsePoint) != 0) continue;
                        if ((attributes & FileAttributes.Directory) != 0) { directories.Push(path); continue; }
                        string name = Path.GetRelativePath(root, path).Replace('\\', '/');
                        if (!globs.Any(glob => ArtifactGlob.Matches(glob, name))) continue;
                        if (settings.ExcludedPaths.Contains(name, StringComparer.Ordinal)) continue;
                        long bytes = new FileInfo(path).Length;
                        if (bytes > settings.MaxFileBytes || bytes > settings.MaxTotalBytes - total)
                        {
                            warning?.Invoke("An artifact exceeded the configured file or aggregate byte limit and was skipped.");
                            continue;
                        }
                        result.Add(new ArtifactFile { Name = name, FullPath = path, SizeBytes = bytes });
                        total += bytes;
                        if (result.Count >= settings.MaxFiles)
                        {
                            warning?.Invoke("Artifact collection reached the maximum file count.");
                            stopped = true;
                            break;
                        }
                    }
                }
                catch (Exception ex) when (ex is IOException || ex is UnauthorizedAccessException)
                {
                    warning?.Invoke("An inaccessible artifact directory or file was skipped.");
                }
            }
            result.Sort((left, right) => StringComparer.Ordinal.Compare(left.Name, right.Name));
            return result;
        }
    }
}
