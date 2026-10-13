namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.IO;
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
                    new TestCaseDescriptor("artifacts", "selection", "Explicit collection is bounded, skips links, and does nothing without globs", SelectionAsync),
                    new TestCaseDescriptor("artifacts", "globs", "Artifact globs select only relative files with explicit supported patterns", GlobsAsync)
                })
            };
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "artifacts-" + provider.ToString().ToLowerInvariant();
                result.Add(new TestSuiteDescriptor(id, "Artifact persistence (" + provider + ")", new List<TestCaseDescriptor>
                {
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
