namespace Garrison.Worker.Execution
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
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
        /// <exception cref="InvalidOperationException">Thrown when the git clone fails.</exception>
        public async Task PrepareAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            if (workspace == null) throw new ArgumentNullException(nameof(workspace));
            if (directories == null) throw new ArgumentNullException(nameof(directories));

            if (workspace.Kind == WorkspaceKindEnum.GitRepository)
            {
                await CloneAsync(workspace, directories, baseEnvironment, token).ConfigureAwait(false);
            }

            foreach (ExecutionWorkspaceFile file in workspace.Files)
            {
                string path = SafePaths.Combine(directories.Workspace, file.Path);
                string? parent = Path.GetDirectoryName(path);
                if (!String.IsNullOrEmpty(parent)) Directory.CreateDirectory(parent);
                await File.WriteAllTextAsync(path, file.Content ?? String.Empty, new UTF8Encoding(false), token).ConfigureAwait(false);
            }
        }

        #endregion

        #region Private-Methods

        private async Task CloneAsync(ExecutionWorkspace workspace, RunDirectories directories, Dictionary<string, string> baseEnvironment, CancellationToken token)
        {
            if (String.IsNullOrEmpty(workspace.GitUrl)) throw new InvalidOperationException("GitRepository workspace has no GitUrl.");

            Dictionary<string, string> environment = new Dictionary<string, string>(baseEnvironment);
            environment["GIT_TERMINAL_PROMPT"] = "0";
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

            List<string> arguments = new List<string> { "clone" };
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
            arguments.Add(workspace.GitUrl);
            arguments.Add(directories.Workspace);

            if (Directory.Exists(directories.Workspace) && Directory.GetFileSystemEntries(directories.Workspace).Length == 0) Directory.Delete(directories.Workspace);

            ProcessRunResult result = await RunGitAsync(arguments, directories.Root, environment, token).ConfigureAwait(false);
            if (result.ExitCode == 0) return;

            if (!String.IsNullOrEmpty(workspace.GitRef))
            {
                if (Directory.Exists(directories.Workspace)) Directory.Delete(directories.Workspace, true);
                List<string> full = new List<string> { "clone", workspace.GitUrl, directories.Workspace };
                ProcessRunResult fallback = await RunGitAsync(full, directories.Root, environment, token).ConfigureAwait(false);
                if (fallback.ExitCode == 0)
                {
                    ProcessRunResult checkout = await RunGitAsync(new List<string> { "-C", directories.Workspace, "checkout", workspace.GitRef }, directories.Root, environment, token).ConfigureAwait(false);
                    if (checkout.ExitCode == 0) return;
                    throw new InvalidOperationException("git checkout " + workspace.GitRef + " failed: " + LastLine(checkout.StderrTail));
                }
                result = fallback;
            }

            Directory.CreateDirectory(directories.Workspace);
            throw new InvalidOperationException(result.NotInstalled ? "git is not installed." : "git clone failed: " + LastLine(result.StderrTail));
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
