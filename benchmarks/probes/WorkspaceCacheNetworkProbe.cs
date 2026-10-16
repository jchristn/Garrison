namespace Garrison.Benchmark.Probes
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enums;
    using Garrison.Worker.Execution;

    /// <summary>Bounded repeated production-cache validation over a private real TCP/TLS Git smart endpoint.</summary>
    public static class WorkspaceCacheNetworkProbe
    {
        private static readonly JsonSerializerOptions _Json = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, WriteIndented = true };

        /// <summary>Measure three preparation paths and prepared transfer/restore without accessing production state.</summary>
        /// <param name="args">Output, file count, bytes/file, rounds, response delay milliseconds, bandwidth MiB/second, Python endpoint script.</param>
        /// <returns>Zero when all independent work trees and restored file modes match.</returns>
        public static async Task<int> Main(string[] args)
        {
            string output = Path.GetFullPath(args[0]);
            int files = Int32.Parse(args[1]);
            int bytesPerFile = Int32.Parse(args[2]);
            int rounds = Int32.Parse(args[3]);
            int delayMs = Int32.Parse(args[4]);
            int bandwidthMib = Int32.Parse(args[5]);
            if (files < 1 || files > 10000 || bytesPerFile < 1 || (long)files * bytesPerFile > 32 * 1024 * 1024 || rounds < 1 || rounds > 10 || delayMs < 0 || delayMs > 500 || bandwidthMib < 0 || bandwidthMib > 1024)
                throw new ArgumentOutOfRangeException(nameof(args), "Use at most 32 MiB, 10000 files, ten rounds, 0..500 ms response delay and 0..1024 MiB/s target pacing.");
            using (CancellationTokenSource timeout = new CancellationTokenSource(TimeSpan.FromMinutes(5)))
            {
                CancellationToken token = timeout.Token;
                string root = Path.Combine(Path.GetTempPath(), "garrison-network-cache-" + Guid.NewGuid().ToString("N"));
                Directory.CreateDirectory(root);
                if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(root, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                Process? endpoint = null;
                Task<string>? endpointErrors = null;
                try
                {
                    Dictionary<string, string> environment = new Dictionary<string, string>
                    {
                        ["PATH"] = Environment.GetEnvironmentVariable("PATH") ?? "/usr/bin:/bin",
                        ["HOME"] = root,
                        ["GIT_CONFIG_GLOBAL"] = OperatingSystem.IsWindows() ? "NUL" : "/dev/null",
                        ["GIT_CONFIG_NOSYSTEM"] = "1",
                        ["GIT_CONFIG_COUNT"] = "1",
                        ["GIT_CONFIG_KEY_0"] = "pack.threads",
                        ["GIT_CONFIG_VALUE_0"] = "1",
                        ["GIT_AUTHOR_DATE"] = "2000-01-01T00:00:00Z",
                        ["GIT_COMMITTER_DATE"] = "2000-01-01T00:00:00Z"
                    };
                    string repository = Path.Combine(root, "source");
                    await CommandAsync("git", new[] { "init", "--initial-branch=main", repository }, root, environment, token).ConfigureAwait(false);
                    Random random = new Random(603146);
                    byte[] payload = new byte[bytesPerFile];
                    for (int index = 0; index < files; index++)
                    {
                        string directory = Path.Combine(repository, "files", (index / 100).ToString("D4"));
                        Directory.CreateDirectory(directory);
                        random.NextBytes(payload);
                        await File.WriteAllBytesAsync(Path.Combine(directory, index.ToString("D6") + ".bin"), payload, token).ConfigureAwait(false);
                    }
                    await File.WriteAllTextAsync(Path.Combine(repository, "README.txt"), "Deterministic bounded HTTPS workspace cache fixture.\n", token).ConfigureAwait(false);
                    await File.WriteAllTextAsync(Path.Combine(repository, ".fixture"), "hidden file retained\n", token).ConfigureAwait(false);
                    string executable = Path.Combine(repository, "check.sh");
                    await File.WriteAllTextAsync(executable, "#!/bin/sh\nprintf 'cache fixture\\n'\n", token).ConfigureAwait(false);
                    if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(executable, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
                    await CommandAsync("git", new[] { "-C", repository, "add", "." }, root, environment, token).ConfigureAwait(false);
                    await CommandAsync("git", new[] { "-C", repository, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "bounded cache fixture" }, root, environment, token).ConfigureAwait(false);
                    await CommandAsync("git", new[] { "clone", "--bare", repository, Path.Combine(root, "repository.git") }, root, environment, token).ConfigureAwait(false);
                    string certificate = Path.Combine(root, "certificate.pem");
                    string key = Path.Combine(root, "key.pem");
                    string configuration = Path.Combine(root, "openssl.cnf");
                    await File.WriteAllTextAsync(configuration, "[req]\nprompt=no\ndistinguished_name=dn\nx509_extensions=extensions\n[dn]\nCN=127.0.0.1\n[extensions]\nsubjectAltName=IP:127.0.0.1\nbasicConstraints=critical,CA:TRUE\nkeyUsage=critical,digitalSignature,keyEncipherment,keyCertSign\n", token).ConfigureAwait(false);
                    await CommandAsync("openssl", new[] { "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-config", configuration, "-keyout", key, "-out", certificate }, root, environment, token).ConfigureAwait(false);
                    if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(key, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                    ProcessStartInfo start = Start("python3", new[] { Path.GetFullPath(args[6]), "--root", root, "--certificate", certificate, "--key", key, "--delay-ms", delayMs.ToString(), "--bytes-per-second", ((long)bandwidthMib * 1024 * 1024).ToString() }, root, environment);
                    endpoint = Process.Start(start) ?? throw new IOException("Could not start private HTTPS fixture.");
                    endpointErrors = endpoint.StandardError.ReadToEndAsync(CancellationToken.None);
                    string readyLine = await endpoint.StandardOutput.ReadLineAsync(token).ConfigureAwait(false) ?? throw new IOException("Private endpoint exited before readiness.");
                    CacheNetworkReady ready = JsonSerializer.Deserialize<CacheNetworkReady>(readyLine, _Json) ?? throw new InvalidDataException("Missing endpoint readiness.");
                    string url = "https://127.0.0.1:" + ready.Port;
                    environment["GIT_SSL_CAINFO"] = certificate;
                    string statsPath = Path.Combine(root, "network-stats.json");
                    List<object> measurements = new List<object>();
                    string? expected = null;
                    long treeBytes = 0;
                    for (int round = 1; round <= rounds; round++)
                    {
                        RunDirectories? prepared = null;
                        long coldResponseBytes = 0;
                        foreach (string arm in new[] { "uncached", "mirror-cold", "mirror-warm" })
                        {
                            RunDirectories directories = new RunDirectories(root, "r" + round + "-" + arm);
                            directories.Create();
                            string trace = Path.Combine(root, "r" + round + "-" + arm + ".pack");
                            environment["GIT_TRACE_PACKFILE"] = trace;
                            WorkspacePreparer preparer = new WorkspacePreparer { GitCacheRoot = arm == "uncached" ? null : Path.Combine(root, "mirror-r" + round) };
                            ExecutionWorkspace workspace = new ExecutionWorkspace { Kind = WorkspaceKindEnum.GitRepository, GitUrl = url + "/repository.git", GitRef = "main", GitDepth = 0 };
                            CacheNetworkStats before = await StatsAsync(statsPath, token).ConfigureAwait(false);
                            Stopwatch elapsed = Stopwatch.StartNew();
                            await preparer.PrepareAsync(workspace, directories, environment, token).ConfigureAwait(false);
                            elapsed.Stop();
                            CacheNetworkStats after = await StatsAsync(statsPath, token).ConfigureAwait(false);
                            string digest = Digest(directories.Workspace);
                            expected ??= digest;
                            if (expected != digest) throw new InvalidDataException("Work tree bytes or file modes changed in " + arm);
                            if (arm == "mirror-warm" && !workspace.MirrorCacheHit) throw new InvalidDataException("Warm mirror was not used.");
                            if (arm == "mirror-cold") coldResponseBytes = after.ResponseBodyBytes - before.ResponseBodyBytes;
                            if (arm == "mirror-warm" && ((File.Exists(trace) && new FileInfo(trace).Length > 0) || after.ResponseBodyBytes - before.ResponseBodyBytes >= coldResponseBytes))
                                throw new InvalidDataException("Warm mirror did not reduce actual HTTPS transfer to negotiation-only traffic.");
                            treeBytes = TreeFiles(directories.Workspace).Sum(f => new FileInfo(f).Length);
                            measurements.Add(new { round, arm, elapsedMs = elapsed.Elapsed.TotalMilliseconds, receivedPackBytes = File.Exists(trace) ? new FileInfo(trace).Length : 0, workspace.MirrorCacheHit, httpsRequests = after.Requests - before.Requests, requestBodyBytes = after.RequestBodyBytes - before.RequestBodyBytes, responseBodyBytes = after.ResponseBodyBytes - before.ResponseBodyBytes, workTreeSha256 = digest });
                            prepared = directories;
                        }
                        WorkspaceSnapshot snapshot = new WorkspaceSnapshot { IncludeSession = false, MaxBytes = 128L * 1024 * 1024 };
                        string archive = Path.Combine(root, "prepared.zip");
                        Stopwatch capture = Stopwatch.StartNew();
                        using (FileStream destination = File.Create(archive)) await snapshot.CaptureAsync(prepared!, destination, token).ConfigureAwait(false);
                        capture.Stop();
                        CacheNetworkStats beforeDownload = await StatsAsync(statsPath, token).ConfigureAwait(false);
                        string downloaded = Path.Combine(root, "downloaded-r" + round + ".zip");
                        Stopwatch transfer = Stopwatch.StartNew();
                        await CommandAsync("curl", new[] { "--silent", "--show-error", "--fail", "--noproxy", "*", "--cacert", certificate, "--output", downloaded, url + "/snapshot.zip" }, root, environment, token).ConfigureAwait(false);
                        transfer.Stop();
                        CacheNetworkStats afterDownload = await StatsAsync(statsPath, token).ConfigureAwait(false);
                        if (new FileInfo(downloaded).Length != new FileInfo(archive).Length || afterDownload.ResponseBodyBytes - beforeDownload.ResponseBodyBytes != new FileInfo(downloaded).Length)
                            throw new InvalidDataException("Prepared download did not match measured HTTPS payload bytes.");
                        RunDirectories restored = new RunDirectories(root, "r" + round + "-replacement-node");
                        Stopwatch restore = Stopwatch.StartNew();
                        using (FileStream source = File.OpenRead(downloaded)) await snapshot.RestoreAsync(source, restored, token).ConfigureAwait(false);
                        restore.Stop();
                        string restoredDigest = Digest(restored.Workspace);
                        if (restoredDigest != expected) throw new InvalidDataException("Prepared restore changed bytes or executable modes.");
                        measurements.Add(new { round, arm = "prepared-snapshot", captureMs = capture.Elapsed.TotalMilliseconds, transferMs = transfer.Elapsed.TotalMilliseconds, restoreMs = restore.Elapsed.TotalMilliseconds, archiveTransferBytes = new FileInfo(downloaded).Length, responseBodyBytes = afterDownload.ResponseBodyBytes - beforeDownload.ResponseBodyBytes, workTreeSha256 = restoredDigest });
                    }
                    Directory.CreateDirectory(Path.GetDirectoryName(output)!);
                    await File.WriteAllTextAsync(output, JsonSerializer.Serialize(new { measuredUtc = DateTime.UtcNow, dataFiles = files, treeFiles = files + 3, workTreeBytes = treeBytes, rounds, transport = "real loopback TCP/TLS HTTPS Git smart endpoint; process-local ephemeral CA; no SSH command shim", responseDelayMs = delayMs, targetResponseMiBPerSecondPerConnection = bandwidthMib, byteAccounting = "HTTP request/response bodies and received Git pack payload; excludes HTTP headers and TCP/TLS framing", identity = "SHA256 over sorted relative paths, file lengths, bytes and Unix file modes, excluding .git", sharedDevelopmentHost = true, measurements }, _Json), token).ConfigureAwait(false);
                    Console.WriteLine("PASS " + rounds + " repeated HTTPS cold/warm/uncached and prepared transfer/restore rounds; exact tree/mode identity; " + output);
                    return 0;
                }
                finally
                {
                    if (endpoint != null)
                    {
                        if (!endpoint.HasExited) endpoint.Kill(true);
                        await endpoint.WaitForExitAsync(CancellationToken.None).ConfigureAwait(false);
                        endpoint.Dispose();
                        if (endpointErrors != null)
                        {
                            string errors = await endpointErrors.ConfigureAwait(false);
                            if (!String.IsNullOrWhiteSpace(errors)) Console.Error.WriteLine(errors);
                        }
                    }
                    Directory.Delete(root, true);
                }
            }
        }

        private static List<string> TreeFiles(string root)
        {
            return Directory.EnumerateFiles(root, "*", SearchOption.AllDirectories).Where(path => !Path.GetRelativePath(root, path).Replace('\\', '/').StartsWith(".git/", StringComparison.Ordinal)).OrderBy(path => Path.GetRelativePath(root, path), StringComparer.Ordinal).ToList();
        }

        private static string Digest(string root)
        {
            using (IncrementalHash hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256))
            {
                foreach (string path in TreeFiles(root))
                {
                    hash.AppendData(Encoding.UTF8.GetBytes(Path.GetRelativePath(root, path).Replace('\\', '/')));
                    hash.AppendData(new byte[] { 0 });
                    hash.AppendData(BitConverter.GetBytes(new FileInfo(path).Length));
                    hash.AppendData(BitConverter.GetBytes(OperatingSystem.IsWindows() ? 0 : (int)File.GetUnixFileMode(path)));
                    hash.AppendData(File.ReadAllBytes(path));
                }
                return Convert.ToHexString(hash.GetHashAndReset());
            }
        }

        private static async Task<CacheNetworkStats> StatsAsync(string path, CancellationToken token)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(10);
            while (true)
            {
                CacheNetworkStats stats = JsonSerializer.Deserialize<CacheNetworkStats>(await File.ReadAllTextAsync(path, token).ConfigureAwait(false), _Json) ?? throw new InvalidDataException("Missing network accounting.");
                if (stats.ActiveRequests == 0) return stats;
                if (DateTime.UtcNow >= deadline) throw new TimeoutException("HTTPS fixture did not finish accounting.");
                await Task.Delay(5, token).ConfigureAwait(false);
            }
        }

        private static ProcessStartInfo Start(string executable, IEnumerable<string> arguments, string root, Dictionary<string, string> environment)
        {
            ProcessStartInfo start = new ProcessStartInfo(executable) { WorkingDirectory = root, RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false };
            start.Environment.Clear();
            foreach (KeyValuePair<string, string> entry in environment) start.Environment[entry.Key] = entry.Value;
            foreach (string argument in arguments) start.ArgumentList.Add(argument);
            return start;
        }

        private static async Task CommandAsync(string executable, IEnumerable<string> arguments, string root, Dictionary<string, string> environment, CancellationToken token)
        {
            using (Process process = Process.Start(Start(executable, arguments, root, environment)) ?? throw new IOException("Could not start " + executable))
            {
                Task<string> stdout = process.StandardOutput.ReadToEndAsync(token);
                Task<string> stderr = process.StandardError.ReadToEndAsync(token);
                try
                {
                    await process.WaitForExitAsync(token).ConfigureAwait(false);
                    await Task.WhenAll(stdout, stderr).ConfigureAwait(false);
                    if (process.ExitCode != 0) throw new IOException(executable + " fixture failed: " + await stderr.ConfigureAwait(false));
                }
                catch
                {
                    if (!process.HasExited) process.Kill(true);
                    throw;
                }
            }
        }
    }
}
