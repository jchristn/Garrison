namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using Garrison.Server.Settings;
    using Garrison.Server.Storage;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Reporting;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Explicit archive policy beyond default file limits, complete HOME fidelity, and failed checkpoint cleanup.</summary>
    public static class ContinuationArchiveSuite
    {
        /// <summary>Create bounded continuation archive policy cases without model access or a large session population.</summary>
        /// <returns>Archive cases.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            string id = "continuation-archive";
            return new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor(id, "Continuation archive policy", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "explicit-raised-cap", "Configuration and C# SDK retain an explicit 96 MiB file cap while preserving default, minimum and maximum guards", SettingsAsync),
                    new TestCaseDescriptor(id, "download-guards", "All store kinds enforce the configured download cap before I/O and database content must match recorded length", DownloadGuardsAsync),
                    new TestCaseDescriptor(id, "large-complete-home", "An incompressible 80 MiB HOME archive fails default worker/server limits and round-trips through node upload and signed download with an explicit 96 MiB cap", LargeHomeAsync),
                    new TestCaseDescriptor(id, "oversize-retention", "Oversized checkpoint failure retains KeepOnFailure work and removes HOME/config without uploading an artifact", ct => CleanupAsync("oversize", ct)),
                    new TestCaseDescriptor(id, "upload-failure-retention", "Checkpoint storage failure retains failed work and removes private HOME/config", ct => CleanupAsync("upload", ct)),
                    new TestCaseDescriptor(id, "upload-cancellation-retention", "Checkpoint cancellation remains Cancelled and retains failed work while removing HOME/config", ct => CleanupAsync("cancel", ct))
                })
            };
        }

        private static Task SettingsAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ExecutionArtifacts core = new ExecutionArtifacts();
            Garrison.Sdk.Compilation.ExecutionArtifacts sdk = new Garrison.Sdk.Compilation.ExecutionArtifacts();
            ArtifactSettings server = new ArtifactSettings();
            Assert.Equal(16 * 1024 * 1024, core.MaxFileBytes, "Worker default remains 16 MiB");
            Assert.Equal(core.MaxFileBytes, server.MaxFileBytes, "Server default matches wire default");
            core.MaxFileBytes = 96 * 1024 * 1024; sdk.MaxFileBytes = core.MaxFileBytes; server.MaxFileBytes = core.MaxFileBytes;
            Assert.Equal(96 * 1024 * 1024, core.MaxFileBytes, "Core no longer silently clamps an explicit archive cap to 64 MiB");
            Assert.Equal(core.MaxFileBytes, sdk.MaxFileBytes, "C# SDK preserves the raised cap");
            ServerSettings restored = Serializer.Deserialize<ServerSettings>(Serializer.Serialize(new ServerSettings { Artifacts = server }))!;
            Assert.Equal(core.MaxFileBytes, restored.Artifacts.MaxFileBytes, "Operator settings round-trip retains 96 MiB");
            core.MaxFileBytes = int.MaxValue; sdk.MaxFileBytes = int.MaxValue; server.MaxFileBytes = int.MaxValue;
            Assert.Equal(256 * 1024 * 1024, core.MaxFileBytes, "Explicit ceiling remains bounded");
            Assert.Equal(core.MaxFileBytes, sdk.MaxFileBytes, "SDK ceiling matches server wire policy");
            Assert.Equal(core.MaxFileBytes, server.MaxFileBytes, "Server ceiling matches wire policy");
            core.MaxFileBytes = 1; sdk.MaxFileBytes = 1; server.MaxFileBytes = 1;
            Assert.Equal(1024, core.MaxFileBytes, "Minimum remains 1 KiB");
            Assert.Equal(core.MaxFileBytes, sdk.MaxFileBytes, "SDK minimum matches");
            Assert.Equal(core.MaxFileBytes, server.MaxFileBytes, "Server minimum matches");
            return Task.CompletedTask;
        }

        private static async Task DownloadGuardsAsync(CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, settings => settings.Artifacts.MaxFileBytes = 1024, token).ConfigureAwait(false))
            {
                ArtifactStorage storage = new ArtifactStorage(host.Server.Context);
                foreach (ArtifactStoreKindEnum kind in new[] { ArtifactStoreKindEnum.Database, ArtifactStoreKindEnum.Filesystem, ArtifactStoreKindEnum.S3 })
                {
                    foreach (long size in new[] { -1L, 1025L })
                    {
                        bool rejected = false;
                        try { await storage.ReadAsync(new ArtifactStore { Kind = kind }, new Artifact { SizeBytes = size }, token).ConfigureAwait(false); }
                        catch (ValidationException exception) { rejected = exception.Message.Contains("configured download size", StringComparison.Ordinal); }
                        Assert.True(rejected, kind + " rejects invalid or over-cap metadata before database, filesystem or network access");
                    }
                }
                ArtifactStore store = await host.Server.Context.Database.ArtifactStores.CreateAsync(new ArtifactStore { TenantId = host.TenantId, Name = "length-check", Kind = ArtifactStoreKindEnum.Database }, token).ConfigureAwait(false);
                Artifact artifact = await host.Server.Context.Database.Artifacts.CreateAsync(new Artifact { TenantId = host.TenantId, RunId = "run_length", ArtifactStoreId = store.Id, Name = "length.bin", SizeBytes = 3 }, new byte[] { 1, 2 }, token).ConfigureAwait(false);
                bool mismatched = false;
                try { await storage.ReadAsync(store, artifact, token).ConfigureAwait(false); }
                catch (IOException exception) { mismatched = exception.Message.Contains("recorded metadata", StringComparison.Ordinal); }
                Assert.True(mismatched, "Database materialization enforces the same recorded-length contract as streamed stores");
            }
        }

        private static async Task LargeHomeAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-large-continuation-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            try
            {
                RunDirectories source = new RunDirectories(root, "source"); source.Create();
                string catalog = Path.Combine(source.Home, ".codex", "plugins", "catalog", "payload.bin");
                int payloadBytes = 80 * 1024 * 1024;
                await RandomFileAsync(catalog, payloadBytes, token).ConfigureAwait(false);
                Directory.CreateDirectory(Path.Combine(source.Home, ".codex", "sessions"));
                await File.WriteAllTextAsync(Path.Combine(source.Home, ".codex", "sessions", "session.jsonl"), "saved-completed-tool-history", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(source.Workspace, "completed-effect.txt"), "execute-once", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(source.Config, "private-config"), "synthetic-private-session-configuration", token).ConfigureAwait(false);
                await SessionSnapshotPaths.WriteAsync(source, "large-home-session", "codex-rollout-jsonl-v1", token).ConfigureAwait(false);
                string expected = await HashAsync(catalog, token).ConfigureAwait(false);
                byte[] content;
                long uncompressed;
                using (MemoryStream archive = new MemoryStream())
                {
                    uncompressed = await new WorkspaceSnapshot().CaptureAsync(source, archive, token).ConfigureAwait(false);
                    content = archive.ToArray();
                }
                Assert.True(content.Length > 64 * 1024 * 1024, "Incompressible fixture actually exceeds the previous hard ceiling");
                Assert.True(content.Length < 96 * 1024 * 1024, "Explicit 96 MiB policy leaves ZIP overhead headroom");
                await using (TestServerHost host = await TestServerHost.StartAsync(DatabaseTypeEnum.Sqlite, settings =>
                {
                    settings.Artifacts.RootDirectory = Path.Combine(root, "objects");
                }, token).ConfigureAwait(false))
                {
                    DatabaseDriverBase db = host.Server.Context.Database;
                    ArtifactStore store = await db.ArtifactStores.CreateAsync(new ArtifactStore { TenantId = host.TenantId, Name = "large-home", Kind = ArtifactStoreKindEnum.Filesystem }, token).ConfigureAwait(false);
                    Deployment deployment = await db.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, AgentId = "agt_archive", Name = "large-home", SuspensionEnabled = true, ArtifactStoreId = store.Id }, token).ConfigureAwait(false);
                    Node node = await db.Nodes.CreateAsync(new Node { Name = "archive-node" }, token).ConfigureAwait(false);
                    Run run = await db.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = deployment.AgentId, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, LeaseEpoch = 1, LeaseNodeId = node.Id, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(10) }, token).ConfigureAwait(false);
                    string path = "/v1.0/api/node/runs/" + run.Id + "/artifacts?nodeId=" + node.Id + "&tenantId=" + host.TenantId + "&storeId=" + store.Id + "&name=" + Uri.EscapeDataString(".garrison/continuation.zip") + "&epoch=1&repairAttempt=0";
                    int uploads = 0;
                    RunAssignment assignment = new RunAssignment { RunId = run.Id, Epoch = 1, Spec = new ExecutionSpec { Artifacts = new ExecutionArtifacts { StoreId = store.Id } } };
                    assignment.SnapshotUploader = async (name, bytes, ct) =>
                    {
                        uploads++;
                        using (ByteArrayContent body = new ByteArrayContent(bytes))
                        using (HttpResponseMessage response = await host.AdminClient.PostAsync(path, body, ct).ConfigureAwait(false))
                        {
                            Assert.Equal(201, (int)response.StatusCode, "Explicit raised-cap node upload succeeds (" + (int)response.StatusCode + ")");
                            return Serializer.Deserialize<Artifact>(await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false))!;
                        }
                    };
                    bool workerRejected = false;
                    try { await ArtifactUploader.StoreSnapshotAsync(assignment, content, token).ConfigureAwait(false); }
                    catch (IOException exception) { workerRejected = exception.Message.Contains("16777216", StringComparison.Ordinal); }
                    Assert.True(workerRejected && uploads == 0, "Default worker guard fails clearly before transport");
                    ArtifactService service = host.Server.Context.Get<ArtifactService>();
                    bool serverRejected = false;
                    try { await service.UploadInternalAsync(host.TenantId, run.Id, store.Id, ".garrison/continuation.zip", 1, 0, content, node.Id, token).ConfigureAwait(false); }
                    catch (ValidationException exception) { serverRejected = exception.Message.Contains("file byte limit", StringComparison.Ordinal); }
                    // Validate the actual shared server guard directly. An early HTTP rejection can close a large
                    // request mid-write; a client transport exception is not accepted as evidence of a policy rejection.
                    Assert.True(serverRejected, "Default server independently rejects the oversized archive with a validation error");
                    Assert.True(await db.Artifacts.ReadUploadAsync(host.TenantId, run.Id, 1, 0, ".garrison/continuation.zip", token).ConfigureAwait(false) == null, "Rejected upload creates no metadata");
                    Assert.True(!Directory.Exists(host.Settings.Artifacts.RootDirectory) || !Directory.EnumerateFiles(host.Settings.Artifacts.RootDirectory, "*", SearchOption.AllDirectories).Any(), "Rejected upload leaves no storage object");
                    host.Settings.Artifacts.MaxFileBytes = 96 * 1024 * 1024;
                    assignment.Spec.Artifacts!.MaxFileBytes = host.Settings.Artifacts.MaxFileBytes;
                    Artifact artifact = await ArtifactUploader.StoreSnapshotAsync(assignment, content, token).ConfigureAwait(false);
                    Assert.Equal(1, uploads, "Only the explicit-cap success reaches trusted transport");
                    Assert.Equal(Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant(), artifact.Sha256, "Persisted archive digest matches captured bytes");
                    string ticket = service.Ticket(artifact, out DateTime _);
                    using (HttpClient download = new HttpClient())
                    {
                        string url = host.BaseUrl + "/v1.0/artifact-download/" + artifact.Id + "?ticket=" + Uri.EscapeDataString(ticket);
                        host.Settings.Artifacts.MaxFileBytes = 16 * 1024 * 1024;
                        using (HttpResponseMessage denied = await download.GetAsync(url, token).ConfigureAwait(false))
                        {
                            Assert.Equal(400, (int)denied.StatusCode, "Lowered cap refuses an existing larger archive on signed download");
                            Assert.True((await denied.Content.ReadAsStringAsync(token).ConfigureAwait(false)).Contains("configured download size", StringComparison.Ordinal), "Download denial comes from the configured bound");
                        }
                        host.Settings.Artifacts.MaxFileBytes = 96 * 1024 * 1024;
                        using (HttpResponseMessage response = await download.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, token).ConfigureAwait(false))
                        {
                            Assert.Equal(200, (int)response.StatusCode, "Raised-cap signed archive download succeeds");
                            using (Stream archive = await response.Content.ReadAsStreamAsync(token).ConfigureAwait(false))
                            using (MemoryStream downloaded = new MemoryStream())
                            {
                                await archive.CopyToAsync(downloaded, token).ConfigureAwait(false);
                                Assert.Equal(artifact.Sha256, Convert.ToHexString(SHA256.HashData(downloaded.ToArray())).ToLowerInvariant(), "Signed download preserves complete archive digest");
                                Directory.Delete(source.Root, true);
                                RunDirectories restored = new RunDirectories(root, "replacement-worker"); downloaded.Position = 0;
                                long restoredBytes = await new WorkspaceSnapshot().RestoreAsync(downloaded, restored, token).ConfigureAwait(false);
                                await SessionSnapshotPaths.RestoreAsync(restored, HarnessTypeEnum.Codex, "codex-rollout-jsonl-v1", "large-home-session", token).ConfigureAwait(false);
                                Assert.Equal(uncompressed, restoredBytes, "Every captured byte restored after original root loss");
                                Assert.Equal(expected, await HashAsync(Path.Combine(restored.Home, ".codex", "plugins", "catalog", "payload.bin"), token).ConfigureAwait(false), "Entire catalog payload remains byte-identical; no HOME exclusions");
                                Assert.Equal("saved-completed-tool-history", await File.ReadAllTextAsync(Path.Combine(restored.Home, ".codex", "sessions", "session.jsonl"), token).ConfigureAwait(false), "Session history retained");
                                Assert.Equal("synthetic-private-session-configuration", await File.ReadAllTextAsync(Path.Combine(restored.Config, "private-config"), token).ConfigureAwait(false), "Private configuration retained inside protected archive");
                                Assert.Equal("execute-once", await File.ReadAllTextAsync(Path.Combine(restored.Workspace, "completed-effect.txt"), token).ConfigureAwait(false), "Completed work retained");
                                RunDirectories refused = new RunDirectories(root, "over-budget"); downloaded.Position = 0;
                                bool bounded = false;
                                try { await new WorkspaceSnapshot { MaxBytes = uncompressed - 1 }.RestoreAsync(downloaded, refused, token).ConfigureAwait(false); }
                                catch (IOException) { bounded = true; }
                                Assert.True(bounded && !Directory.Exists(refused.Root) && !Directory.EnumerateDirectories(root, "over-budget.restore-*").Any(), "Uncompressed guard refuses and removes partial restore staging");
                                await EvidenceAsync("large-home", new Dictionary<string, object?> { ["payloadBytes"] = payloadBytes, ["archiveBytes"] = content.Length, ["uncompressedBytes"] = uncompressed, ["configuredMaxFileBytes"] = assignment.Spec.Artifacts.MaxFileBytes, ["catalogSha256"] = expected, ["archiveSha256"] = artifact.Sha256, ["workerDefaultRejected"] = workerRejected, ["serverDefaultRejected"] = serverRejected, ["serverDefaultRejectionPath"] = "ArtifactService.UploadInternalAsync", ["replacementRoundtrip"] = true, ["failedRestoreCleaned"] = bounded }, token).ConfigureAwait(false);
                            }
                        }
                    }
                    await service.DeleteAsync(artifact, token).ConfigureAwait(false);
                }
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static async Task CleanupAsync(string mode, CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-checkpoint-cleanup-" + Guid.NewGuid().ToString("N"));
            try
            {
                using (CancellationTokenSource cancellation = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    string id = "run_archive_cleanup";
                    RunDirectories directories = new RunDirectories(root, id); directories.Create();
                    await RandomFileAsync(Path.Combine(directories.Home, ".codex", "catalog.bin"), 16384, token).ConfigureAwait(false);
                    string executable = Environment.ProcessPath != null && Path.GetFileNameWithoutExtension(Environment.ProcessPath) == "dotnet" ? Environment.ProcessPath : "dotnet";
                    ExecutionSpec spec = new ExecutionSpec { RunId = id, Executable = executable, Arguments = new List<string> { Path.Combine(AppContext.BaseDirectory, "garrison-fake-harness.dll"), "--format", "claude", "--answer", "GARRISON_CONTINUATION_WAIT" }, Parser = OutputParserEnum.ClaudeStreamJson, Stdin = "bounded archive cleanup", TimeoutSeconds = 20, KillGraceSeconds = 1, Continuation = new ExecutionContinuation { SessionFormat = "garrison-fake-session-v1" }, Artifacts = new ExecutionArtifacts { StoreId = "artstore_cleanup", MaxFileBytes = mode == "oversize" ? 1024 : 96 * 1024 * 1024 } };
                    spec.Workspace.Retention = WorkspaceRetentionEnum.KeepOnFailure;
                    spec.Workspace.Files.Add(new ExecutionWorkspaceFile { Path = "completed-effect.txt", Content = "preserve-on-failure" });
                    RunAssignment assignment = new RunAssignment { RunId = id, Epoch = 1, Spec = spec };
                    int uploads = 0;
                    assignment.SnapshotUploader = (name, bytes, ct) =>
                    {
                        uploads++;
                        if (mode == "cancel") { cancellation.Cancel(); return Task.FromCanceled<Artifact>(cancellation.Token); }
                        throw new IOException("Synthetic checkpoint store failure.");
                    };
                    RunCompleteRequest complete = await new ProcessRunExecutor(new ExecutorOptions { WorkRoot = root }).ExecuteAsync(assignment, new InMemoryRunReporter(), cancellation.Token).ConfigureAwait(false);
                    Assert.Equal(mode == "cancel" ? RunStatusEnum.Cancelled : RunStatusEnum.Failed, complete.Status, "Final outcome reflects checkpoint failure, not the preceding successful harness");
                    Assert.Equal(mode == "cancel" ? RunOutcomeEnum.Cancelled : RunOutcomeEnum.InternalError, complete.Outcome, "Cancellation and ordinary storage failure remain distinct");
                    Assert.True(complete.SnapshotArtifactId == null, "Failed checkpoint never reports an artifact or Suspended status");
                    if (mode == "oversize") Assert.True((complete.ErrorMessage ?? String.Empty).Contains("1024", StringComparison.Ordinal) && uploads == 0, "Explicit bound is actionable and transport is never called");
                    else Assert.Equal(1, uploads, "Upload fault occurs after capture");
                    Assert.True(!Directory.Exists(directories.Home) && !Directory.Exists(directories.Config), "Private HOME and config removed even when work is retained");
                    Assert.Equal("preserve-on-failure", await File.ReadAllTextAsync(Path.Combine(directories.Workspace, "completed-effect.txt"), token).ConfigureAwait(false), "KeepOnFailure uses final failure/cancellation, preserving operator diagnostic work");
                    await EvidenceAsync("cleanup-" + mode, new Dictionary<string, object?> { ["status"] = complete.Status.ToString(), ["outcome"] = complete.Outcome.ToString(), ["transportCalls"] = uploads, ["snapshotReported"] = complete.SnapshotArtifactId != null, ["privateDirectoriesRemoved"] = true, ["failedWorkRetained"] = true }, token).ConfigureAwait(false);
                }
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static async Task RandomFileAsync(string path, int bytes, CancellationToken token)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(path)!);
            Random random = new Random(63026);
            byte[] buffer = new byte[1024 * 1024];
            using (FileStream output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None, buffer.Length, FileOptions.Asynchronous))
            {
                int remaining = bytes;
                while (remaining > 0)
                {
                    token.ThrowIfCancellationRequested(); random.NextBytes(buffer);
                    int count = Math.Min(buffer.Length, remaining);
                    await output.WriteAsync(buffer.AsMemory(0, count), token).ConfigureAwait(false); remaining -= count;
                }
            }
        }

        private static async Task<string> HashAsync(string path, CancellationToken token)
        {
            using (FileStream input = File.OpenRead(path)) return Convert.ToHexString(await SHA256.HashDataAsync(input, token).ConfigureAwait(false)).ToLowerInvariant();
        }

        private static async Task EvidenceAsync(string name, Dictionary<string, object?> values, CancellationToken token)
        {
            string? directory = Environment.GetEnvironmentVariable("GARRISON_CONTINUATION_EVIDENCE");
            if (String.IsNullOrEmpty(directory)) return;
            Directory.CreateDirectory(directory);
            await File.WriteAllTextAsync(Path.Combine(directory, name + ".json"), JsonSerializer.Serialize(values, new JsonSerializerOptions { WriteIndented = true }) + "\n", token).ConfigureAwait(false);
        }
    }
}
