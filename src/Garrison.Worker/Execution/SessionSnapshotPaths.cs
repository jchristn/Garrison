namespace Garrison.Worker.Execution
{
    using System;
    using System.IO;
    using System.Text.RegularExpressions;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

    /// <summary>Validate pinned session metadata and relocate Claude's workspace-keyed project directory on restore.</summary>
    public static class SessionSnapshotPaths
    {
        /// <summary>Save the session identity and workspace path before snapshot capture.</summary>
        /// <param name="directories">Run layout.</param><param name="sessionId">Session.</param><param name="format">Pinned format.</param><param name="token">Cancellation.</param><returns>Task.</returns>
        public static Task WriteAsync(RunDirectories directories, string sessionId, string format, CancellationToken token)
        {
            string path = SafePaths.PrepareWrite(directories.Config, "continuation-manifest.json");
            return File.WriteAllTextAsync(path, Serializer.Serialize(new SessionSnapshotManifest { WorkspacePath = directories.Workspace, SessionId = sessionId, SessionFormat = format }), token);
        }

        /// <summary>Validate an archive's format and session, then relocate the project directory if HOME moved across workers.</summary>
        /// <param name="directories">Restored layout.</param><param name="harness">Harness.</param><param name="format">Expected format.</param><param name="sessionId">Expected session.</param><param name="token">Cancellation.</param><returns>Task.</returns>
        /// <exception cref="IOException">Metadata does not match or a Claude session has conflicting project locations.</exception>
        public static async Task RestoreAsync(RunDirectories directories, HarnessTypeEnum harness, string format, string? sessionId, CancellationToken token)
        {
            string path = SafePaths.Combine(directories.Config, "continuation-manifest.json");
            if (!File.Exists(path)) throw new IOException("Checkpoint has no pinned session manifest.");
            SessionSnapshotManifest manifest = Serializer.Deserialize<SessionSnapshotManifest>(await File.ReadAllTextAsync(path, token).ConfigureAwait(false)) ?? throw new IOException("Checkpoint manifest is invalid.");
            if (manifest.SessionFormat != format || String.IsNullOrEmpty(manifest.SessionId) || (sessionId != null && sessionId != manifest.SessionId)) throw new IOException("Checkpoint session identity or format does not match.");
            if (harness != HarnessTypeEnum.ClaudeCode || manifest.WorkspacePath == directories.Workspace) return;
            string projects = Path.Combine(directories.Home, ".claude", "projects");
            if (!Directory.Exists(projects)) return;
            string target = SafePaths.Combine(projects, Regex.Replace(directories.Workspace, "[^a-zA-Z0-9]", "-", RegexOptions.CultureInvariant));
            foreach (string project in Directory.GetDirectories(projects))
            {
                token.ThrowIfCancellationRequested();
                if (!File.Exists(SafePaths.Combine(project, manifest.SessionId + ".jsonl")) || project == target) continue;
                if (Directory.Exists(target)) throw new IOException("Restored Claude session conflicts with an existing project directory.");
                Directory.Move(project, target);
            }
        }
    }
}
