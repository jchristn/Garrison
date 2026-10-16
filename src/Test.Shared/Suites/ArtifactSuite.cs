namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.IO;
    using System.IO.Compression;
    using System.Net.Http.Headers;
    using Garrison.Core.Protocol;
    using Garrison.Core.Compilation;
    using System.Net.Http;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Worker.Execution;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Artifact collection syntax, typed persistence, and tenant isolation on every provider.</summary>
    public static class ArtifactSuite
    {
        /// <summary>Build artifact suites for the selected database providers.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> result = new List<TestSuiteDescriptor>
            {
                new TestSuiteDescriptor("artifacts", "Artifact collection", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor("artifacts", "prepared-restore-boundary", "Prepared archives cannot restore HOME or config and private upload callbacks never serialize", PreparedRestoreBoundaryAsync),
                    new TestCaseDescriptor("artifacts", "selection", "Explicit collection is bounded, skips links, and does nothing without globs", SelectionAsync),
                    new TestCaseDescriptor("artifacts", "globs", "Artifact globs select only relative files with explicit supported patterns", GlobsAsync)
                })
            };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "artifacts-" + provider.ToString().ToLowerInvariant();
                string cacheId = "workspace-cache-" + provider.ToString().ToLowerInvariant();
                result.Add(new TestSuiteDescriptor(cacheId, "Prepared workspace cache", new List<TestCaseDescriptor> { new TestCaseDescriptor(cacheId, "cross-node-hit", "Immutable commit prepared archive restores byte-identically on a different worker (" + provider + ")", ct => PreparedWorkspaceAsync(provider, ct)) }));
                result.Add(new TestSuiteDescriptor(id, "Artifact persistence (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "internal-node-upload", "Internal archives require a node-owned live lease and cannot be poisoned with run or administrator public uploads", ct => InternalUploadAsync(provider, ct)),
                    new TestCaseDescriptor(id, "atomic-fence", "Artifact insertion atomically rejects stale epochs, repair phases, and cancellation", ct => FenceAsync(provider, ct)),
                    new TestCaseDescriptor(id, "worker-database", "Worker collects explicit files through MCP into the database; signed links download only their file", ct => WorkerAsync(provider, ArtifactStoreKindEnum.Database, ct)),
                    new TestCaseDescriptor(id, "worker-filesystem", "Worker collects explicit files through MCP into filesystem storage and deletes content", ct => WorkerAsync(provider, ArtifactStoreKindEnum.Filesystem, ct)),
                    new TestCaseDescriptor(id, "persistence", "Store configuration and ordered deployment globs persist; empty globs stay disabled", ct => PersistenceAsync(provider, ct)),
                    new TestCaseDescriptor(id, "metadata-content", "Metadata and database content stay separate, scoped, filtered, and idempotently addressable", ct => MetadataAsync(provider, ct))
                }));
            }
            return result;
        }

        /// <summary>Run the complete worker and signed-download flow against an isolated S3-compatible endpoint.</summary>
        /// <param name="endpoint">Temporary endpoint.</param>
        /// <param name="accessKey">Test credential access key.</param>
        /// <param name="secretKey">Test credential secret key.</param>
        /// <param name="bucket">Existing test bucket.</param>
        /// <param name="region">Signing region.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static Task S3ConformanceAsync(string endpoint, string accessKey, string secretKey, string bucket, string region, CancellationToken token)
        {
            return WorkerAsync(DatabaseTypeEnum.Sqlite, ArtifactStoreKindEnum.S3, token, endpoint, accessKey, secretKey, bucket, region);
        }

        private static async Task PreparedRestoreBoundaryAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-prepared-boundary-" + Guid.NewGuid().ToString("N"));
            try
            {
                foreach (string name in new[] { "home/.claude/settings.json", "config/mux/commands.json" })
                {
                    using MemoryStream bytes = new MemoryStream();
                    using (ZipArchive archive = new ZipArchive(bytes, ZipArchiveMode.Create, true))
                    using (StreamWriter writer = new StreamWriter(archive.CreateEntry(name).Open())) await writer.WriteAsync("poison").ConfigureAwait(false);
                    bytes.Position = 0;
                    RunDirectories destination = new RunDirectories(root, Guid.NewGuid().ToString("N"));
                    bool refused = false;
                    try { await new WorkspaceSnapshot { IncludeSession = false }.RestoreAsync(bytes, destination, token).ConfigureAwait(false); }
                    catch (IOException) { refused = true; }
                    Assert.True(refused && !Directory.Exists(destination.Root), "Prepared restore rejects private state before atomic publication");
                }
                RunAssignment assignment = new RunAssignment { SnapshotUploader = (_, _, _) => throw new InvalidOperationException("private-node-credential") };
                string serialized = Serializer.Serialize(assignment);
                Assert.True(!serialized.Contains("SnapshotUploader", StringComparison.OrdinalIgnoreCase) && !serialized.Contains("private-node-credential", StringComparison.Ordinal), "Private transport never enters wire spec");
                assignment.Spec.Artifacts = new ExecutionArtifacts(); assignment.SnapshotUploader = null;
                bool noFallback = false;
                try { await ArtifactUploader.StoreSnapshotAsync(assignment, Array.Empty<byte>(), token).ConfigureAwait(false); }
                catch (IOException) { noFallback = true; }
                Assert.True(noFallback, "Missing private transport does not fall back to harness run credential");
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static async Task InternalUploadAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using TestServerHost host = await TestServerHost.StartAsync(provider, token: token).ConfigureAwait(false);
            DatabaseDriverBase db = host.Server.Context.Database;
            ArtifactStore store = await db.ArtifactStores.CreateAsync(new ArtifactStore { TenantId = host.TenantId, Name = "internal-node", Kind = ArtifactStoreKindEnum.Database }, token).ConfigureAwait(false);
            WorkspaceTemplate workspace = await db.WorkspaceTemplates.CreateAsync(new WorkspaceTemplate { TenantId = host.TenantId, Name = "internal-work", Kind = WorkspaceKindEnum.GitRepository, GitUrl = "https://example.invalid/repo.git", GitRef = new string('a', 40) }, token).ConfigureAwait(false);
            Deployment deployment = await db.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, AgentId = "agt_internal", Name = "internal-node", SuspensionEnabled = true, ArtifactStoreId = store.Id, WorkspaceTemplateId = workspace.Id, ArtifactGlobs = new List<string> { "**/*" } }, token).ConfigureAwait(false);
            Node node = await db.Nodes.CreateAsync(new Node { Name = "internal-node" }, token).ConfigureAwait(false);
            Run run = await db.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = deployment.AgentId, DeploymentId = deployment.Id, CallerType = PrincipalTypeEnum.Administrator, Status = RunStatusEnum.Running, LeaseEpoch = 3, LeaseNodeId = node.Id, LeaseExpiresUtc = DateTime.UtcNow.AddMinutes(5) }, token).ConfigureAwait(false);
            string runToken = await host.Server.Context.Authentication.IssueForRunAsync(run, run.LeaseEpoch, DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false);
            using HttpClient harness = new HttpClient { BaseAddress = new Uri(host.BaseUrl) };
            harness.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", runToken);
            string name = ".garrison/prepared-" + WorkspaceCacheKey.For(host.TenantId, workspace, null) + ".zip";
            string suffix = "?tenantId=" + host.TenantId + "&nodeId=" + node.Id + "&storeId=" + store.Id + "&name=" + Uri.EscapeDataString(name) + "&epoch=3&repairAttempt=0";
            string publicPath = "/v1.0/api/tenants/" + host.TenantId + "/runs/" + run.Id + "/artifacts" + suffix;
            string nodePath = "/v1.0/api/node/runs/" + run.Id + "/artifacts" + suffix;
            foreach (HttpClient client in new[] { harness, host.AdminClient })
            {
                using HttpResponseMessage denied = await client.PostAsync(publicPath, new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false);
                Assert.Equal(400, (int)denied.StatusCode, "All public credentials reject reserved namespace");
            }
            using (HttpResponseMessage denied = await harness.PostAsync(nodePath, new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false)) Assert.True((int)denied.StatusCode >= 400, "Run bearer has no private node upload privilege");
            using (HttpResponseMessage wrong = await host.AdminClient.PostAsync(nodePath.Replace("nodeId=" + node.Id, "nodeId=nod_wrong", StringComparison.Ordinal), new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false)) Assert.Equal(409, (int)wrong.StatusCode, "Wrong node cannot commit archive");
            using (HttpResponseMessage invalid = await host.AdminClient.PostAsync(nodePath.Replace(Uri.EscapeDataString(name), Uri.EscapeDataString(".garrison/prepared-wrong.zip"), StringComparison.Ordinal), new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false)) Assert.Equal(400, (int)invalid.StatusCode, "Cache identity must match deployment immutable workspace");
            using (HttpResponseMessage accepted = await host.AdminClient.PostAsync(nodePath, new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false)) Assert.Equal(201, (int)accepted.StatusCode, "Owning node may upload exact prepared state");
            run.LeaseExpiresUtc = DateTime.UtcNow.AddSeconds(-1); await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
            using (HttpResponseMessage expired = await host.AdminClient.PostAsync(nodePath, new ByteArrayContent(new byte[] { 1 }), token).ConfigureAwait(false)) Assert.Equal(409, (int)expired.StatusCode, "Expired lease rejects even matching retry");
            Artifact stale = new Artifact { TenantId = run.TenantId, RunId = run.Id, ArtifactStoreId = store.Id, Name = ".garrison/continuation.zip", LeaseEpoch = 3 };
            Assert.True(await db.Artifacts.CreateForExecutionAsync(stale, null, token, node.Id).ConfigureAwait(false) == null, "Database commit independently fences expired node lease");
        }

        private static async Task SelectionAsync(CancellationToken token)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-artifact-select-" + Guid.NewGuid().ToString("N"));
            string outside = root + "-outside";
            Directory.CreateDirectory(Path.Combine(root, "reports"));
            Directory.CreateDirectory(outside);
            try
            {
                await File.WriteAllTextAsync(Path.Combine(root, "reports", "answer.json"), "{}", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(root, "reports", "secret.txt"), "not selected", token).ConfigureAwait(false);
                await File.WriteAllTextAsync(Path.Combine(outside, "outside.json"), "outside", token).ConfigureAwait(false);
                if (!OperatingSystem.IsWindows())
                {
                    File.CreateSymbolicLink(Path.Combine(root, "reports", "linked.json"), Path.Combine(outside, "outside.json"));
                    Directory.CreateSymbolicLink(Path.Combine(root, "reports", "linked-dir"), outside);
                }
                Garrison.Core.Compilation.ExecutionArtifacts settings = new Garrison.Core.Compilation.ExecutionArtifacts();
                Assert.Equal(0, (await ArtifactSelection.SelectAsync(root, settings, token: token).ConfigureAwait(false)).Count, "No globs means no collection");
                settings.Globs.Add("reports/**/*.json");
                settings.Globs.Add("reports/*.json");
                List<ArtifactFile> files = await ArtifactSelection.SelectAsync(root, settings, token: token).ConfigureAwait(false);
                Assert.Equal(1, files.Count, "Only one selected regular file, even with duplicate matching globs");
                Assert.Equal("reports/answer.json", files[0].Name, "Relative display name");
                await File.WriteAllBytesAsync(Path.Combine(root, "reports", "large.json"), new byte[2048], token).ConfigureAwait(false);
                settings.MaxFileBytes = 1024;
                Assert.Equal(1, (await ArtifactSelection.SelectAsync(root, settings, token: token).ConfigureAwait(false)).Count, "Oversized file skipped");
                settings.MaxScanEntries = 1;
                List<string> warnings = new List<string>();
                Assert.Equal(0, (await ArtifactSelection.SelectAsync(root, settings, warnings.Add, token).ConfigureAwait(false)).Count, "Scan bound stops before nested files");
                Assert.True(warnings.Count > 0, "Truncation is visible");
            }
            finally { Directory.Delete(root, true); Directory.Delete(outside, true); }
        }

        private static async Task FenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run run = await db.Runs.CreateAsync(new Run { TenantId = "ten_artifact", AgentId = "agt_artifact", DeploymentId = "dep_artifact", Status = RunStatusEnum.Running, LeaseEpoch = 3, RepairAttempts = 1 }, token).ConfigureAwait(false);
                Artifact artifact = new Artifact { TenantId = run.TenantId, RunId = run.Id, ArtifactStoreId = "ast_test", Name = "answer.txt", LeaseEpoch = 3, RepairAttempt = 1 };
                Assert.NotNull(await db.Artifacts.CreateForExecutionAsync(artifact, Array.Empty<byte>(), token).ConfigureAwait(false), "Current execution inserts");
                artifact.Id = IdGenerator.NewArtifactId(); artifact.Name = "stale.txt";
                run.LeaseEpoch = 4; await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                Assert.True(await db.Artifacts.CreateForExecutionAsync(artifact, null, token).ConfigureAwait(false) == null, "Lost epoch refuses metadata");
                artifact.LeaseEpoch = 4; run.RepairAttempts = 2; await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                Assert.True(await db.Artifacts.CreateForExecutionAsync(artifact, null, token).ConfigureAwait(false) == null, "Old repair refuses metadata");
                artifact.RepairAttempt = 2; run.CancelRequested = true; await db.Runs.UpdateAsync(run, token).ConfigureAwait(false);
                Assert.True(await db.Artifacts.CreateForExecutionAsync(artifact, null, token).ConfigureAwait(false) == null, "Cancellation refuses metadata");
                Assert.True(await db.Artifacts.ReadAsync(run.TenantId, artifact.Id, token).ConfigureAwait(false) == null, "Rejected upload leaves no row");
            }
        }

        private static async Task PreparedWorkspaceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            if (OperatingSystem.IsWindows()) return;
            await using (LocalGitFixture fixture = await LocalGitFixture.CreateAsync(token).ConfigureAwait(false))
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                string api = "/v1.0/api/tenants/" + host.TenantId;
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, api + "/artifact-stores", new ArtifactStore { Name = "prepared-cache", Kind = ArtifactStoreKindEnum.Database }, 201, token).ConfigureAwait(false);
                WorkspaceTemplate workspace = await HttpTestHelpers.SendAsync<WorkspaceTemplate>(host.AdminClient, HttpMethod.Post, api + "/workspace-templates", new WorkspaceTemplate { Name = "immutable-git", Kind = WorkspaceKindEnum.GitRepository, GitUrl = fixture.Url, GitRef = fixture.Commit, GitDepth = 0 }, 201, token).ConfigureAwait(false);
                Agent agent = await cluster.CreateAgentAsync("prepared-workspace", token: token, configureDeployment: deployment =>
                {
                    deployment.WorkspaceTemplateId = workspace.Id;
                    deployment.ArtifactStoreId = store.Id;
                    deployment.ArtifactGlobs.Add("payload.txt");
                    foreach (string name in new[] { "GIT_SSH_COMMAND", "GIT_SSH_VARIANT" }) deployment.EnvironmentOverrides.Add(new DeploymentEnvironmentOverride { Name = name, ValueTemplate = fixture.Environment[name] });
                }).ConfigureAwait(false);
                string expectedHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("immutable payload\n"))).ToLowerInvariant();
                for (int attempt = 0; attempt < 2; attempt++)
                {
                    if (attempt == 1)
                    {
                        await cluster.Workers[0].StopAsync(token).ConfigureAwait(false);
                        await cluster.AddWorkerAsync("prepared-other-node", token).ConfigureAwait(false);
                    }
                    Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, api + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "workspace", Wait = true, WaitSeconds = 30 }, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Workspace run succeeds: " + run.ErrorMessage);
                    EnumerationResult<Artifact> rows = await HttpTestHelpers.SendAsync<EnumerationResult<Artifact>>(host.AdminClient, HttpMethod.Get, api + "/runs/" + run.Id + "/artifacts", null, 200, token).ConfigureAwait(false);
                    Artifact payload = rows.Objects.Single(artifact => artifact.Name == "payload.txt");
                    Assert.Equal(expectedHash, payload.Sha256, "Cold and prepared workspaces preserve exact committed file bytes");
                    if (attempt == 0)
                    {
                        EnumerationResult<Artifact> internalRows = await host.Server.Context.Database.Artifacts.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 100 }, run.Id, token: token, includeInternal: true).ConfigureAwait(false);
                        Artifact checkpoint = internalRows.Objects.Single(artifact => artifact.Name.StartsWith(".garrison/prepared-", StringComparison.Ordinal));
                        Assert.True(!rows.Objects.Any(artifact => artifact.Id == checkpoint.Id), "Internal cache archive is absent from ordinary artifact listings");
                        using (HttpResponseMessage forbidden = await host.AdminClient.GetAsync(api + "/artifacts/" + checkpoint.Id + "/content", token).ConfigureAwait(false)) Assert.Equal(404, (int)forbidden.StatusCode, "Even administrators cannot retrieve internal archives through public artifact routes");
                    }
                    else
                    {
                        Garrison.Core.Responses.RunEventsResponse events = await HttpTestHelpers.SendAsync<Garrison.Core.Responses.RunEventsResponse>(host.AdminClient, HttpMethod.Get, api + "/runs/" + run.Id + "/events", null, 200, token).ConfigureAwait(false);
                        Assert.True(events.Events.Any(entry => entry.Code == "WorkspaceCacheHit"), "Another node used the artifact cache instead of cloning");
                    }
                }
            }
        }

        private static async Task WorkerAsync(DatabaseTypeEnum provider, ArtifactStoreKindEnum kind, CancellationToken token, string? endpoint = null, string? accessKey = null, string? secretKey = null, string? bucket = null, string? region = null)
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-artifact-store-" + Guid.NewGuid().ToString("N"));
            try
            {
                await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
                {
                    cluster.Server.Settings.Artifacts.RootDirectory = root;
                    string api = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                    ArtifactStore configured = new ArtifactStore { Name = "test-artifacts", Kind = kind };
                    if (kind == ArtifactStoreKindEnum.S3)
                    {
                        Secret credential = await HttpTestHelpers.SendAsync<Secret>(cluster.Server.AdminClient, HttpMethod.Post, api + "/secrets", new SecretRequest
                        {
                            Name = "artifact-s3-credential", Value = Serializer.Serialize(new Garrison.Server.Storage.ArtifactS3Credentials { AccessKey = accessKey!, SecretKey = secretKey! })
                        }, 201, token).ConfigureAwait(false);
                        configured.SecretId = credential.Id; configured.Endpoint = endpoint; configured.Bucket = bucket; configured.Region = region!;
                    }
                    ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(cluster.Server.AdminClient, HttpMethod.Post, api + "/artifact-stores", configured, 201, token).ConfigureAwait(false);
                    Agent agent = await cluster.CreateAgentAsync("artifact-worker", token: token, configureDeployment: deployment =>
                    {
                        deployment.ArtifactStoreId = store.Id;
                        deployment.ArtifactGlobs.Add("reports/**/*.txt");
                        deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 0, Template = "--output-last-message" });
                        deployment.ArgumentOverrides.Add(new DeploymentArgumentOverride { Position = 1, Template = "{{run.workspaceDir}}/reports/answer.txt" });
                    }).ConfigureAwait(false);
                    Run run = await HttpTestHelpers.SendAsync<Run>(cluster.Server.AdminClient, HttpMethod.Post, api + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "artifact payload", Wait = true, WaitSeconds = 30 }, 200, token).ConfigureAwait(false);
                    Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Harness succeeds: " + run.ErrorMessage);
                    EnumerationResult<Artifact> rows = await HttpTestHelpers.SendAsync<EnumerationResult<Artifact>>(cluster.Server.AdminClient, HttpMethod.Get, api + "/runs/" + run.Id + "/artifacts", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(1L, rows.TotalRecords, "Exactly the configured output collected");
                    Artifact artifact = rows.Objects.Single();
                    Assert.Equal("reports/answer.txt", artifact.Name, "Workspace relative name");
                    using (HttpResponseMessage content = await cluster.Server.AdminClient.GetAsync(api + "/artifacts/" + artifact.Id + "/content", token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (int)content.StatusCode, "Authenticated content download");
                        Assert.True((await content.Content.ReadAsStringAsync(token).ConfigureAwait(false)).Contains("artifact payload", StringComparison.Ordinal), "Actual harness file bytes stored");
                    }
                    ArtifactDownloadResponse link = await HttpTestHelpers.SendAsync<ArtifactDownloadResponse>(cluster.Server.AdminClient, HttpMethod.Post, api + "/artifacts/" + artifact.Id + "/download-url", null, 200, token).ConfigureAwait(false);
                    using (HttpClient anonymous = new HttpClient())
                    {
                        using (HttpResponseMessage download = await anonymous.GetAsync(link.Url, token).ConfigureAwait(false))
                            Assert.Equal(200, (int)download.StatusCode, "Signed link works without an auth session");
                        using (HttpResponseMessage wrong = await anonymous.GetAsync(link.Url.Replace(artifact.Id, "art_wrong", StringComparison.Ordinal), token).ConfigureAwait(false))
                            Assert.Equal(404, (int)wrong.StatusCode, "Ticket is bound to one artifact");
                        string ticket = Uri.UnescapeDataString(new Uri(link.Url).Query.Substring("?ticket=".Length));
                        anonymous.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ticket);
                        using (HttpResponseMessage session = await anonymous.GetAsync(cluster.Server.BaseUrl + api + "/artifacts/" + artifact.Id, token).ConfigureAwait(false))
                            Assert.Equal(401, (int)session.StatusCode, "Download ticket cannot authenticate API requests");
                    }
                    await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Delete, api + "/artifacts/" + artifact.Id, null, token).ConfigureAwait(false);
                    using (HttpClient anonymous = new HttpClient())
                    using (HttpResponseMessage deleted = await anonymous.GetAsync(link.Url, token).ConfigureAwait(false))
                        Assert.Equal(404, (int)deleted.StatusCode, "Deletion invalidates signed link immediately");
                    if (kind == ArtifactStoreKindEnum.Filesystem) Assert.True(!File.Exists(Path.Combine(root, artifact.Location.Replace('/', Path.DirectorySeparatorChar))), "External content deleted");
                }
            }
            finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
        }

        private static Task GlobsAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            foreach (string invalid in new[] { "", "/etc/*", "../*", "out/../secret", "C:\\secret", "out//*.json", "out/[abc].json", "*.json\n", new string('x', 513) })
                Assert.True(!ArtifactGlob.IsValid(invalid), "Unsupported or escaping glob rejected");
            Assert.True(ArtifactGlob.Matches("reports/**/*.json", "reports/answer.json"), "Double star matches zero directories");
            Assert.True(ArtifactGlob.Matches("reports/**/*.json", "reports/day/answer.json"), "Double star matches nested directories");
            Assert.True(!ArtifactGlob.Matches("reports/*.json", "reports/day/answer.json"), "Single star cannot cross directory boundaries");
            Assert.True(ArtifactGlob.Matches("out/part-?.txt", "out/part-a.txt"), "Question mark matches one character");
            Assert.True(!ArtifactGlob.Matches("out/*.json", "outside/answer.json"), "Relative prefix matters");
            Assert.True(!ArtifactGlob.Matches("**/*", "../secret"), "Even a broad explicit glob cannot escape workspace");
            Assert.True(!ArtifactGlob.Matches("**/*", "/etc/passwd"), "Absolute paths never match");
            return Task.CompletedTask;
        }

        private static async Task PersistenceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                ArtifactStore store = new ArtifactStore
                {
                    TenantId = "ten_artifacts", Name = "s3-artifacts", Kind = ArtifactStoreKindEnum.S3,
                    PathPrefix = "output", Bucket = "test-bucket", Endpoint = "http://127.0.0.1:19000", Region = "us-east-1", SecretId = "sec_artifact", ForcePathStyle = true
                };
                store = await db.ArtifactStores.CreateAsync(store, token).ConfigureAwait(false);
                ArtifactStore saved = Assert.NotNull(await db.ArtifactStores.ReadAsync(store.TenantId, store.Id, token).ConfigureAwait(false), "Store read");
                Assert.Equal(store.Bucket, saved.Bucket, "Bucket persisted");
                Assert.Equal(store.Endpoint, saved.Endpoint, "Endpoint persisted");
                Assert.Equal(store.SecretId, saved.SecretId, "Credential reference persisted");
                Assert.True(saved.ForcePathStyle, "Compatible addressing persisted");
                saved.Region = "eu-west-1";
                saved.ForcePathStyle = false;
                await db.ArtifactStores.UpdateAsync(saved, token).ConfigureAwait(false);
                saved = (await db.ArtifactStores.ReadAsync(store.TenantId, store.Id, token).ConfigureAwait(false))!;
                Assert.Equal("eu-west-1", saved.Region, "Region edit persists");
                Assert.True(!saved.ForcePathStyle, "Addressing edit persists");
                Assert.True(await db.ArtifactStores.ReadAsync("ten_other", store.Id, token).ConfigureAwait(false) == null, "Store scoped read");
                Deployment deployment = new Deployment { TenantId = store.TenantId, Name = "artifact-deployment", AgentId = "agt_artifact", ArtifactStoreId = store.Id, ArtifactGlobs = new List<string> { "reports/**/*.json", "images/*.png" } };
                deployment = await db.Deployments.CreateAsync(deployment, token).ConfigureAwait(false);
                Deployment read = (await db.Deployments.ReadAsync(deployment.TenantId, deployment.Id, token).ConfigureAwait(false))!;
                Assert.Equal("reports/**/*.json|images/*.png", String.Join("|", read.ArtifactGlobs), "Operator order preserved");
                read.ArtifactGlobs.Clear();
                await db.Deployments.UpdateAsync(read, token).ConfigureAwait(false);
                Assert.Equal(0, (await db.Deployments.ReadAsync(deployment.TenantId, deployment.Id, token).ConfigureAwait(false))!.ArtifactGlobs.Count, "Clearing globs disables collection");
            }
        }

        private static async Task MetadataAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                byte[] content = Encoding.UTF8.GetBytes("artifact content");
                Artifact artifact = new Artifact
                {
                    TenantId = "ten_artifacts", RunId = "run_artifact", ArtifactStoreId = "ast_artifact", Name = "reports/answer.txt", MediaType = "text/plain",
                    SizeBytes = content.Length, Sha256 = Convert.ToHexString(SHA256.HashData(content)).ToLowerInvariant(), Location = "test/object", LeaseEpoch = 4, RepairAttempt = 1
                };
                artifact = await db.Artifacts.CreateAsync(artifact, content, token).ConfigureAwait(false);
                Assert.Equal(artifact.Id, (await db.Artifacts.ReadUploadAsync(artifact.TenantId, artifact.RunId, 4, 1, artifact.Name, token).ConfigureAwait(false))?.Id, "Replay lookup is scoped to execution and name");
                Assert.True(await db.Artifacts.ReadUploadAsync(artifact.TenantId, artifact.RunId, 5, 1, artifact.Name, token).ConfigureAwait(false) == null, "New epoch cannot reuse an old upload");
                Assert.True(await db.Artifacts.ReadAsync("ten_other", artifact.Id, token).ConfigureAwait(false) == null, "Metadata never leaks across tenants");
                Assert.True(await db.Artifacts.ReadContentAsync("ten_other", artifact.Id, token).ConfigureAwait(false) == null, "Content never leaks across tenants");
                Assert.Equal("artifact content", Encoding.UTF8.GetString((await db.Artifacts.ReadContentAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false))!), "Database content round-trip");
                EnumerationResult<Artifact> rows = await db.Artifacts.EnumerateAsync(artifact.TenantId, new EnumerationQuery { Search = "ANSWER" }, artifact.RunId, artifact.ArtifactStoreId, token).ConfigureAwait(false);
                Assert.Equal(1L, rows.TotalRecords, "Run/store/name filtering");
                Assert.Equal(artifact.Sha256, rows.Objects.Single().Sha256, "List preserves hash metadata");
                Assert.True(!await db.Artifacts.DeleteAsync("ten_other", artifact.Id, token).ConfigureAwait(false), "Cross-tenant delete is refused");
                Assert.True(await db.Artifacts.DeleteAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false), "Own artifact delete");
                Assert.True(await db.Artifacts.ReadContentAsync(artifact.TenantId, artifact.Id, token).ConfigureAwait(false) == null, "Deleting metadata also removes database content");
            }
        }
    }
}
