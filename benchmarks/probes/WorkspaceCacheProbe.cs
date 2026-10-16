namespace Garrison.Benchmark.Probes
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Worker.Execution;

    /// <summary>Measure real workspace preparation using a deterministic large git repository and local SSH transport.</summary>
    public static class WorkspaceCacheProbe
    {
        /// <summary>Generate a bounded fixture, compare cold/warm clones and a prepared snapshot, and emit JSON.</summary>
        /// <param name="args">Output JSON path, optional file count and bytes per file.</param><returns>Zero when all trees match.</returns>
        public static async Task<int> Main(string[] args)
        {
            string output = Path.GetFullPath(args[0]);
            int files = args.Length > 1 ? Int32.Parse(args[1]) : 10000;
            int bytesPerFile = args.Length > 2 ? Int32.Parse(args[2]) : 8192;
            if (files < 1 || files > 100000 || bytesPerFile < 1 || (long)files * bytesPerFile > 100 * 1024 * 1024) throw new ArgumentException("Fixture must contain 1..100000 files and at most 100 MiB.");
            string root = Path.Combine(Path.GetTempPath(), "garrison-cache-probe-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            try
            {
                string repository = Path.Combine(root, "repository");
                await GitAsync(root, "init", "--initial-branch=main", repository).ConfigureAwait(false);
                Random random = new Random(603146);
                byte[] payload = new byte[bytesPerFile];
                for (int index = 0; index < files; index++)
                {
                    string directory = Path.Combine(repository, "files", (index / 100).ToString("D4"));
                    Directory.CreateDirectory(directory);
                    random.NextBytes(payload);
                    await File.WriteAllBytesAsync(Path.Combine(directory, index.ToString("D6") + ".bin"), payload).ConfigureAwait(false);
                }
                await GitAsync(root, "-C", repository, "add", ".").ConfigureAwait(false);
                await GitAsync(root, "-C", repository, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "deterministic cache fixture").ConfigureAwait(false);
                string shim = Path.Combine(root, "ssh.sh");
                await File.WriteAllTextAsync(shim, "#!/bin/sh\nexec git-upload-pack '" + repository.Replace("'", "'\\''", StringComparison.Ordinal) + "'\n").ConfigureAwait(false);
                Dictionary<string, string> environment = new Dictionary<string, string>
                {
                    ["PATH"] = Environment.GetEnvironmentVariable("PATH") ?? "/usr/bin:/bin",
                    ["GIT_SSH_COMMAND"] = "sh '" + shim.Replace("'", "'\\''", StringComparison.Ordinal) + "'",
                    ["GIT_SSH_VARIANT"] = "ssh"
                };
                List<object> measurements = new List<object>();
                string? expected = null;
                RunDirectories? prepared = null;
                foreach (string arm in new[] { "uncached", "mirror-cold", "mirror-warm" })
                {
                    RunDirectories directories = new RunDirectories(root, arm);
                    directories.Create();
                    string trace = Path.Combine(root, arm + ".pack");
                    environment["GIT_TRACE_PACKFILE"] = trace;
                    WorkspacePreparer preparer = new WorkspacePreparer { GitCacheRoot = arm == "uncached" ? null : Path.Combine(root, "mirror") };
                    ExecutionWorkspace workspace = new ExecutionWorkspace { Kind = WorkspaceKindEnum.GitRepository, GitUrl = "ssh://fixture.invalid/repository", GitRef = "main", GitDepth = 0 };
                    Stopwatch elapsed = Stopwatch.StartNew();
                    await preparer.PrepareAsync(workspace, directories, environment, CancellationToken.None).ConfigureAwait(false);
                    elapsed.Stop();
                    string digest = Digest(directories.Workspace);
                    expected ??= digest;
                    if (expected != digest) throw new InvalidDataException("Work tree changed under " + arm);
                    measurements.Add(new { arm, elapsedMs = elapsed.Elapsed.TotalMilliseconds, receivedPackBytes = File.Exists(trace) ? new FileInfo(trace).Length : 0, workspace.MirrorCacheHit, workTreeSha256 = digest });
                    prepared = directories;
                }
                WorkspaceSnapshot snapshot = new WorkspaceSnapshot { IncludeSession = false, MaxBytes = 256L * 1024 * 1024 };
                string archive = Path.Combine(root, "prepared.zip");
                Stopwatch capture = Stopwatch.StartNew();
                using (FileStream destination = File.Create(archive)) await snapshot.CaptureAsync(prepared!, destination, CancellationToken.None).ConfigureAwait(false);
                capture.Stop();
                RunDirectories restored = new RunDirectories(root, "another-node");
                Stopwatch restore = Stopwatch.StartNew();
                using (FileStream source = File.OpenRead(archive)) await snapshot.RestoreAsync(source, restored, CancellationToken.None).ConfigureAwait(false);
                restore.Stop();
                string restoredDigest = Digest(restored.Workspace);
                if (restoredDigest != expected) throw new InvalidDataException("Prepared snapshot changed work tree bytes");
                measurements.Add(new { arm = "prepared-snapshot", elapsedMs = restore.Elapsed.TotalMilliseconds, captureMs = capture.Elapsed.TotalMilliseconds, archiveTransferBytes = new FileInfo(archive).Length, workTreeSha256 = restoredDigest });
                Directory.CreateDirectory(Path.GetDirectoryName(output)!);
                await File.WriteAllTextAsync(output, JsonSerializer.Serialize(new { measuredUtc = DateTime.UtcNow, files, workTreeBytes = (long)files * bytesPerFile, transport = "local git-upload-pack over SSH command shim; pack payload bytes, no physical network latency", sharedHost = true, measurements }, new JsonSerializerOptions { WriteIndented = true })).ConfigureAwait(false);
                Console.WriteLine("PASS uncached, cold/warm mirror, and prepared snapshot have identical work tree SHA-256; " + output);
                return 0;
            }
            finally { Directory.Delete(root, true); }
        }

        private static string Digest(string root)
        {
            using (IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256))
            {
                foreach (string path in Directory.EnumerateFiles(Path.Combine(root, "files"), "*", SearchOption.AllDirectories).OrderBy(path => path, StringComparer.Ordinal))
                {
                    hash.AppendData(System.Text.Encoding.UTF8.GetBytes(Path.GetRelativePath(root, path).Replace('\\', '/')));
                    hash.AppendData(File.ReadAllBytes(path));
                }
                return Convert.ToHexString(hash.GetHashAndReset());
            }
        }

        private static async Task GitAsync(string root, params string[] arguments)
        {
            ProcessStartInfo start = new ProcessStartInfo("git") { WorkingDirectory = root, RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false };
            foreach (string argument in arguments) start.ArgumentList.Add(argument);
            using (Process process = Process.Start(start)!)
            {
                Task<string> stdout = process.StandardOutput.ReadToEndAsync();
                Task<string> stderr = process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync().ConfigureAwait(false);
                await Task.WhenAll(stdout, stderr).ConfigureAwait(false);
                if (process.ExitCode != 0) throw new IOException("Fixture git failed: " + stderr.Result);
            }
        }
    }
}
