namespace Garrison.Benchmark
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;

    /// <summary>
    /// Finds the repository root and reads git provenance. The root is the nearest folder, walking up from the
    /// executable and then from the working directory, that contains both .git and benchmarks/; default paths for
    /// results and datasets resolve from it, never from the working directory alone.
    /// </summary>
    public static class RepositoryInfo
    {
        /// <summary>
        /// Find the repository root.
        /// </summary>
        /// <returns>Root path, or null when none was found.</returns>
        public static string? FindRoot()
        {
            foreach (string start in new string[] { AppContext.BaseDirectory, Directory.GetCurrentDirectory() })
            {
                DirectoryInfo? directory = new DirectoryInfo(start);
                while (directory != null)
                {
                    bool hasGit = Directory.Exists(Path.Combine(directory.FullName, ".git")) || File.Exists(Path.Combine(directory.FullName, ".git"));
                    if (hasGit && Directory.Exists(Path.Combine(directory.FullName, "benchmarks"))) return directory.FullName;
                    directory = directory.Parent;
                }
            }
            return null;
        }

        /// <summary>
        /// Commit of HEAD with -dirty when anything in the working tree changed, including untracked files.
        /// </summary>
        /// <param name="root">Repository root.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Commit text and the count of changed or untracked paths; "unknown" when git is unavailable.</returns>
        /// <exception cref="ArgumentNullException">Thrown when root is null.</exception>
        public static async Task<GitState> ProductStateAsync(string root, CancellationToken token)
        {
            if (root == null) throw new ArgumentNullException(nameof(root));
            GitState state = new GitState();
            ProcessResult head = await ExternalProcess.RunAsync("git", new string[] { "-C", root, "rev-parse", "HEAD" }, null, null, 30000, token).ConfigureAwait(false);
            if (head.ExitCode != 0) return state;
            ProcessResult status = await ExternalProcess.RunAsync("git", new string[] { "-C", root, "status", "--porcelain", "--untracked-files=all" }, null, null, 60000, token).ConfigureAwait(false);
            List<string> changed = status.Stdout.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToList();
            state.DirtyFiles = changed.Count;
            state.Commit = head.Stdout.Trim() + (changed.Count > 0 ? "-dirty" : String.Empty);
            return state;
        }

        /// <summary>
        /// Last commit that touched a path, with -dirty when that path has uncommitted or untracked changes.
        /// </summary>
        /// <param name="root">Repository root.</param>
        /// <param name="relativePath">Path relative to the root, for example src/Test.Benchmark.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Commit text, or "uncommitted" when the path has no commit yet, or "unknown".</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static async Task<string> PathCommitAsync(string root, string relativePath, CancellationToken token)
        {
            if (root == null) throw new ArgumentNullException(nameof(root));
            if (relativePath == null) throw new ArgumentNullException(nameof(relativePath));
            ProcessResult log = await ExternalProcess.RunAsync("git", new string[] { "-C", root, "log", "-1", "--format=%H", "--", relativePath }, null, null, 30000, token).ConfigureAwait(false);
            if (log.ExitCode != 0) return "unknown";
            string commit = log.Stdout.Trim();
            if (commit.Length == 0) commit = "uncommitted";
            ProcessResult status = await ExternalProcess.RunAsync("git", new string[] { "-C", root, "status", "--porcelain", "--untracked-files=all", "--", relativePath }, null, null, 60000, token).ConfigureAwait(false);
            if (status.Stdout.Trim().Length > 0) commit += "-dirty";
            return commit;
        }
    }
}
