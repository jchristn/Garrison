namespace Test.Shared.Infrastructure
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Harnesses.Execution;

    /// <summary>Real local git repository exposed through an SSH transport shim, with no network or SSH service.</summary>
    public sealed class LocalGitFixture : IAsyncDisposable
    {
        /// <summary>Fixture root.</summary>
        public string Root { get; } = Path.Combine(Path.GetTempPath(), "garrison-git-" + Guid.NewGuid().ToString("N"));
        /// <summary>Immutable commit.</summary>
        public string Commit { get; private set; } = String.Empty;
        /// <summary>Git transport environment pointing only at this fixture.</summary>
        public Dictionary<string, string> Environment { get; } = new Dictionary<string, string>();
        /// <summary>Validated SSH URL; the shim substitutes its local repository.</summary>
        public string Url { get; } = "ssh://fixture.invalid/repository";
        private LocalGitFixture() { }

        /// <summary>Create a repository containing a payload and an executable.</summary>
        /// <param name="token">Cancellation token.</param><returns>Fixture.</returns>
        public static async Task<LocalGitFixture> CreateAsync(CancellationToken token)
        {
            LocalGitFixture fixture = new LocalGitFixture();
            Directory.CreateDirectory(fixture.Root);
            fixture.Environment["PATH"] = System.Environment.GetEnvironmentVariable("PATH") ?? "/usr/bin:/bin";
            await fixture.GitAsync(new[] { "init", "--initial-branch=main", "repository" }, token).ConfigureAwait(false);
            string repo = Path.Combine(fixture.Root, "repository");
            await File.WriteAllTextAsync(Path.Combine(repo, "payload.txt"), "immutable payload\n", token).ConfigureAwait(false);
            await fixture.GitAsync(new[] { "-C", repo, "add", "." }, token).ConfigureAwait(false);
            await fixture.GitAsync(new[] { "-C", repo, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "fixture" }, token).ConfigureAwait(false);
            fixture.Commit = (await File.ReadAllTextAsync(Path.Combine(repo, ".git", "refs", "heads", "main"), token).ConfigureAwait(false)).Trim();
            string shim = Path.Combine(fixture.Root, "ssh.sh");
            await File.WriteAllTextAsync(shim, "#!/bin/sh\nexec git-upload-pack '" + repo.Replace("'", "'\\''", StringComparison.Ordinal) + "'\n", token).ConfigureAwait(false);
            if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(shim, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
            fixture.Environment["GIT_SSH_COMMAND"] = "sh '" + shim.Replace("'", "'\\''", StringComparison.Ordinal) + "'";
            fixture.Environment["GIT_SSH_VARIANT"] = "ssh";
            return fixture;
        }

        /// <summary>Delete fixture files.</summary><returns>Completed task.</returns>
        public ValueTask DisposeAsync()
        {
            if (Directory.Exists(Root)) Directory.Delete(Root, true);
            return ValueTask.CompletedTask;
        }

        private async Task GitAsync(string[] arguments, CancellationToken token)
        {
            ProcessRunRequest request = new ProcessRunRequest { Executable = "git", Arguments = new List<string>(arguments), WorkingDirectory = Root, Environment = Environment, TimeoutSeconds = 30 };
            ProcessRunResult result = await new ProcessRunner().RunAsync(request, null, null, token).ConfigureAwait(false);
            if (result.ExitCode != 0) throw new TestAssertionException("Local git fixture failed: " + result.StderrTail);
        }
    }
}
