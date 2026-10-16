namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Core.Services;
    using Garrison.Harnesses.Execution;

    /// <summary>
    /// Prepares a run workspace: empty, seeded files, or a shallow git clone. Git credentials are passed through an
    /// askpass script in the config directory and environment variables, never written into the workspace.
    /// Thread-safe.
    /// </summary>
    public class WorkspacePreparer
    {
        #region Public-Members

        /// <summary>
        /// Git clone timeout in seconds. Minimum 10, maximum 7200, default 600.
        /// </summary>
        public int GitTimeoutSeconds
        {
            get
            {
                return _GitTimeoutSeconds;
            }
            set
            {
                _GitTimeoutSeconds = Math.Clamp(value, 10, 7200);
            }
        }

        #endregion

        #region Private-Members

        /// <summary>Optional private node-local mirror root. Null disables caching. Mirrors are isolated by repository and credential identity.</summary>
        public string? GitCacheRoot { get; set; } = null;

        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _CacheLocks = new ConcurrentDictionary<string, SemaphoreSlim>(StringComparer.Ordinal);
        private readonly ProcessRunner _Runner = new ProcessRunner();
        private int _GitTimeoutSeconds = 600;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Prepare the workspace.
        /// </summary>
        /// <param name="workspace">Workspace instructions.</param>
        /// <param name="directories">Run directories (created).</param>
        /// <param name="baseEnvironment">Base environment for git.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the git clone fails or the repository URL or reference is not allowed.</exception>
        /// <exception cref="UnauthorizedAccessException">Thrown when a seeded file's path escapes the workspace or a directory on the way is a filesystem link.</exception>
        public Task PrepareAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            return Garrison.Core.Telemetry.ApplicationOperation.MeasureAsync("workspace", "prepare", ct => PrepareCoreAsync(workspace, directories, baseEnvironment, ct), token);
        }

        private async Task PrepareCoreAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (directories == null) throw new ArgumentNullException(nameof(directories));

            if (workspace.Kind == WorkspaceKindEnum.GitRepository)
            {
                await CloneAsync(workspace, directories, baseEnvironment, token).ConfigureAwait(false);
            }

            foreach (ExecutionWorkspaceFile file in workspace.Files)
            {
                // Conversation turns reuse the workspace the previous harness controlled: never write through its links (SR-24).
                string path = SafePaths.PrepareWrite(directories.Workspace, file.Path);
                await File.WriteAllTextAsync(path, file.Content ?? String.Empty, new UTF8Encoding(false), token).ConfigureAwait(false);
            }
        }

        #endregion

        #region Private-Methods

        private Task CloneAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            return Garrison.Core.Telemetry.ApplicationOperation.MeasureAsync("workspace", "git-clone", ct => CloneCoreAsync(workspace, directories, baseEnvironment, ct), token);
        }

        private async Task CloneCoreAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            if (String.IsNullOrEmpty(workspace.GitUrl)) throw new InvalidOperationException("GitRepository workspace has no GitUrl.");
            // SR-22: the control plane validates these too; a worker never hands git a local path, another transport, or
            // an argument that reads as an option.
            if (!ConfigurationValidator.IsAllowedGitUrl(workspace.GitUrl)) throw new InvalidOperationException("The repository URL must be https://, ssh://, or user@host:path.");
            if (!String.IsNullOrEmpty(workspace.GitRef) && !ConfigurationValidator.IsAllowedGitRef(workspace.GitRef)) throw new InvalidOperationException("The git reference is not allowed.");

            Dictionary<string, string> environment = new Dictionary<string, string>(baseEnvironment);
            environment["GIT_TERMINAL_PROMPT"] = "0";
            environment["GIT_ALLOW_PROTOCOL"] = "https:ssh";
            environment["GIT_PROTOCOL_FROM_USER"] = "0";
            environment["HOME"] = directories.Home;
            if (!String.IsNullOrEmpty(workspace.GitPassword))
            {
                string askpass = Path.Combine(directories.Config, RuntimeInformation.IsOSPlatform(OSPlatform.Windows) ? "git-askpass.cmd" : "git-askpass.sh");
                string script = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
                    ? "@echo off\r\necho %1 | findstr /i username >nul && (echo %GARRISON_GIT_USERNAME%) || (echo %GARRISON_GIT_PASSWORD%)\r\n"
                    : "#!/bin/sh\ncase \"$1\" in\n  *sername*) printf '%s\\n' \"$GARRISON_GIT_USERNAME\" ;;\n  *) printf '%s\\n' \"$GARRISON_GIT_PASSWORD\" ;;\nesac\n";
                await File.WriteAllTextAsync(askpass, script, token).ConfigureAwait(false);
                if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) File.SetUnixFileMode(askpass, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                environment["GIT_ASKPASS"] = askpass;
                environment["GARRISON_GIT_USERNAME"] = String.IsNullOrEmpty(workspace.GitUsername) ? "x-access-token" : workspace.GitUsername;
                environment["GARRISON_GIT_PASSWORD"] = workspace.GitPassword;
            }

            workspace.MirrorCacheHit = false;
            string? mirror = await PrepareMirrorAsync(workspace, directories, environment, token).ConfigureAwait(false);
            List<string> arguments = new List<string> { "clone" };
            if (mirror != null)
            {
                arguments.Add("--reference-if-able");
                arguments.Add(mirror);
                arguments.Add("--dissociate");
            }
            if (workspace.GitDepth > 0)
            {
                arguments.Add("--depth");
                arguments.Add(workspace.GitDepth.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
            if (!String.IsNullOrEmpty(workspace.GitRef))
            {
                arguments.Add("--branch");
                arguments.Add(workspace.GitRef);
            }
            arguments.Add("--");
            arguments.Add(workspace.GitUrl);
            arguments.Add(directories.Workspace);

            if (Directory.Exists(directories.Workspace) && Directory.GetFileSystemEntries(directories.Workspace).Length == 0) Directory.Delete(directories.Workspace);

            ProcessRunResult result = await RunGitAsync(arguments, directories.Root, environment, token).ConfigureAwait(false);
            if (result.ExitCode == 0) return;

            if (!String.IsNullOrEmpty(workspace.GitRef))
            {
                if (Directory.Exists(directories.Workspace)) Directory.Delete(directories.Workspace, true);
                List<string> full = new List<string> { "clone", "--", workspace.GitUrl, directories.Workspace };
                ProcessRunResult fallback = await RunGitAsync(full, directories.Root, environment, token).ConfigureAwait(false);
                if (fallback.ExitCode == 0)
                {
                    ProcessRunResult checkout = await RunGitAsync(new List<string> { "-C", directories.Workspace, "checkout", "--end-of-options", workspace.GitRef, "--" }, directories.Root, environment, token).ConfigureAwait(false);
                    if (checkout.ExitCode == 0) return;
                    throw new InvalidOperationException("git checkout " + workspace.GitRef + " failed: " + LastLine(checkout.StderrTail));
                }
                result = fallback;
            }

            Directory.CreateDirectory(directories.Workspace);
            throw new InvalidOperationException(result.NotInstalled ? "git is not installed." : "git clone failed: " + LastLine(result.StderrTail));
        }

        private Task<string?> PrepareMirrorAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> environment, CancellationToken token)
        {
            return Garrison.Core.Telemetry.ApplicationOperation.MeasureAsync("workspace", "git-mirror", ct => PrepareMirrorCoreAsync(workspace, directories, environment, ct), token);
        }

        private async Task<string?> PrepareMirrorCoreAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> environment, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(GitCacheRoot)) return null;
            string identity = workspace.GitUrl + "\n" + workspace.GitUsername + "\n" + workspace.GitPassword;
            string key = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(identity))).ToLowerInvariant();
            string root = Path.GetFullPath(GitCacheRoot);
            if (SafePaths.IsLink(root)) throw new IOException("Git cache root is a filesystem link.");
            if (OperatingSystem.IsWindows()) Directory.CreateDirectory(root);
            else Directory.CreateDirectory(root, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            string mirror = Path.Combine(root, key + ".git");
            SemaphoreSlim gate = _CacheLocks.GetOrAdd(mirror, _ => new SemaphoreSlim(1, 1));
            await gate.WaitAsync(token).ConfigureAwait(false);
            try
            {
                if (SafePaths.IsLink(mirror)) throw new IOException("Git mirror is a filesystem link.");
                bool existing = Directory.Exists(mirror);
                List<string> arguments = existing
                    ? new List<string> { "-C", mirror, "remote", "update", "--prune" }
                    : new List<string> { "clone", "--mirror", "--", workspace.GitUrl!, mirror };
                ProcessRunResult result = await RunGitAsync(arguments, directories.Root, environment, token).ConfigureAwait(false);
                if (result.ExitCode != 0)
                {
                    if (!existing && Directory.Exists(mirror)) Directory.Delete(mirror, true);
                    return null; // An unavailable cache never prevents a normal clone.
                }
                workspace.MirrorCacheHit = existing;
                return mirror;
            }
            finally { gate.Release(); }
        }

        private async Task<ProcessRunResult> RunGitAsync(List<string> arguments, string workingDirectory, Dictionary<string, string> environment, CancellationToken token)
        {
            ProcessRunRequest request = new ProcessRunRequest();
            request.Executable = "git";
            request.Arguments = arguments;
            request.WorkingDirectory = workingDirectory;
            request.Environment = environment;
            request.TimeoutSeconds = _GitTimeoutSeconds;
            request.KillGraceSeconds = 2;
            request.StderrTailBytes = 4000;
            return await _Runner.RunAsync(request, null, null, token).ConfigureAwait(false);
        }

        private static string LastLine(string? text)
        {
            if (String.IsNullOrWhiteSpace(text)) return "no output";
            string[] lines = text.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            return lines.Length == 0 ? "no output" : lines[lines.Length - 1];
        }

        #endregion
    }
}
