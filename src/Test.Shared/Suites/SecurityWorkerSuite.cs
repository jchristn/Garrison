namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Runtime.InteropServices;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Worker.Execution;
    using Garrison.Worker.Kubernetes;
    using k8s;
    using k8s.Models;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Regression tests for the worker-side P15.22 security fixes (docs/SECURITY_REVIEW.md): stdio MCP diagnostics are a
    /// worker opt-in (SR-04), PersistentVolume workspaces mount only claims labeled for the run's tenant (SR-09), node
    /// names and run reports are bound to the registering credential (SR-16), git workspaces accept only https and ssh
    /// with no option-like arguments (SR-22), and reused conversation directories cannot redirect worker writes or
    /// artifact reads through planted links (SR-24).
    /// </summary>
    public static class SecurityWorkerSuite
    {
        #region Public-Methods

        /// <summary>
        /// Build the suites.
        /// </summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            List<TestCaseDescriptor> unit = new List<TestCaseDescriptor>();
            unit.Add(new TestCaseDescriptor("security-worker-unit", "git-url-policy", "Workspace templates accept only https, ssh, and user@host:path repositories and refuse option-like references (SR-22)", ct => GitUrlPolicyAsync()));
            unit.Add(new TestCaseDescriptor("security-worker-unit", "git-clone-local-refused", "The worker refuses to clone a local path or file:// repository even when the spec reaches it (SR-22)", ct => GitCloneLocalAsync(ct)));
            unit.Add(new TestCaseDescriptor("security-worker-unit", "link-safe-writes", "Spec and seeded files replace a planted link instead of writing through it, and a linked parent directory is refused (SR-24)", ct => LinkSafeWritesAsync(ct)));
            unit.Add(new TestCaseDescriptor("security-worker-unit", "artifact-link-swap", "An artifact whose parent directory became a link to outside the workspace is not read (SR-24)", ct => ArtifactLinkSwapAsync(ct)));
            unit.Add(new TestCaseDescriptor("security-worker-unit", "pvc-tenant-label", "A PersistentVolume workspace mounts only a claim whose garrison.io/tenant label is the run's tenant (SR-09)", ct => ClaimLabelAsync(ct)));
            suites.Add(new TestSuiteDescriptor("security-worker-unit", "Security review, worker (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "security-worker-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "mcp-tests-opt-in", "A worker advertises stdio MCP diagnostics only when McpTestsEnabled is set, so a default worker cannot run them (SR-04, " + provider + ")", ct => McpTestsOptInAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "node-identity", "Another NodeAgent credential cannot take over a node name or report run events for it until the bound credential is deactivated (SR-16, " + provider + ")", ct => NodeIdentityAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Security review, worker (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task GitUrlPolicyAsync()
        {
            foreach (string refused in new[] { "file:///etc", "/srv/repos/private", "../other", "-uhttps://example.com/x", "--upload-pack=touch /tmp/x", "ext::sh -c touch% /tmp/x", "http://example.com/repo.git", "git://example.com/repo.git", "https://-oProxyCommand=x/repo", "C:\\repos\\x", "git@host:repo with space" })
            {
                bool threw = false;
                try
                {
                    ConfigurationValidator.Workspace(new WorkspaceTemplate { Name = "git-policy", Kind = WorkspaceKindEnum.GitRepository, GitUrl = refused });
                }
                catch (ValidationException)
                {
                    threw = true;
                }
                Assert.True(threw, refused + " should be refused.");
            }
            foreach (string allowed in new[] { "https://github.com/example/repo.git", "ssh://git@github.com/example/repo.git", "git@github.com:example/repo.git", "deploy@git.internal:team/repo" })
            {
                ConfigurationValidator.Workspace(new WorkspaceTemplate { Name = "git-policy", Kind = WorkspaceKindEnum.GitRepository, GitUrl = allowed, GitRef = "release/1.2" });
            }
            foreach (string badRef in new[] { "--upload-pack=x", "-b", "main branch", "a..b" })
            {
                bool threw = false;
                try
                {
                    ConfigurationValidator.Workspace(new WorkspaceTemplate { Name = "git-policy", Kind = WorkspaceKindEnum.GitRepository, GitUrl = "https://github.com/example/repo.git", GitRef = badRef });
                }
                catch (ValidationException)
                {
                    threw = true;
                }
                Assert.True(threw, "Reference " + badRef + " should be refused.");
            }
            return Task.CompletedTask;
        }

        private static async Task GitCloneLocalAsync(CancellationToken token)
        {
            string root = NewTemp();
            try
            {
                string origin = Path.Combine(root, "origin");
                Directory.CreateDirectory(origin);
                File.WriteAllText(Path.Combine(origin, "secret.txt"), "worker-local-file");
                if (!Git(origin, "init", "-q") || !Git(origin, "add", "secret.txt") || !Git(origin, "-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-q", "-m", "init"))
                {
                    throw new TestAssertionException("git is required for this test and could not create a local repository.");
                }

                Dictionary<string, string> environment = new Dictionary<string, string> { ["PATH"] = Environment.GetEnvironmentVariable("PATH") ?? String.Empty };
                foreach (string url in new[] { origin, "file://" + origin })
                {
                    RunDirectories directories = new RunDirectories(Path.Combine(root, "work"), "run_" + Guid.NewGuid().ToString("N"));
                    directories.Create();
                    ExecutionWorkspace workspace = new ExecutionWorkspace { Kind = WorkspaceKindEnum.GitRepository, GitUrl = url, GitDepth = 1 };
                    bool refused = false;
                    try
                    {
                        await new WorkspacePreparer().PrepareAsync(workspace, directories, environment, token).ConfigureAwait(false);
                    }
                    catch (InvalidOperationException)
                    {
                        refused = true;
                    }
                    Assert.True(refused, "Cloning " + url + " should be refused.");
                    Assert.True(!File.Exists(Path.Combine(directories.Workspace, "secret.txt")), "Local repository content must not reach the workspace (" + url + ").");
                }
            }
            finally
            {
                TryDelete(root);
            }
        }

        private static async Task LinkSafeWritesAsync(CancellationToken token)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;
            string root = NewTemp();
            try
            {
                string outside = Path.Combine(root, "outside");
                Directory.CreateDirectory(outside);
                string victim = Path.Combine(outside, "victim.txt");
                File.WriteAllText(victim, "original");

                RunDirectories directories = new RunDirectories(Path.Combine(root, "work"), "run_" + Guid.NewGuid().ToString("N"));
                directories.Create();

                // A planted link at the file's own path is replaced by a regular file.
                File.CreateSymbolicLink(Path.Combine(directories.Config, "settings.json"), victim);
                string written = await FileMaterializer.WriteAsync(new ExecutionFile { Path = "settings.json", Content = "spec", BaseDirectory = FileBaseDirectoryEnum.Config }, directories, token).ConfigureAwait(false);
                Assert.Equal("original", File.ReadAllText(victim), "The link target outside the run is untouched");
                Assert.True(new FileInfo(written).LinkTarget == null, "The written path is a regular file");
                Assert.Equal("spec", File.ReadAllText(written), "Spec content written");

                // A planted directory link on the way is refused.
                Directory.CreateSymbolicLink(Path.Combine(directories.Home, ".config"), outside);
                bool refused = false;
                try
                {
                    await FileMaterializer.WriteAsync(new ExecutionFile { Path = ".config/victim.txt", Content = "spec", BaseDirectory = FileBaseDirectoryEnum.Home }, directories, token).ConfigureAwait(false);
                }
                catch (UnauthorizedAccessException)
                {
                    refused = true;
                }
                Assert.True(refused, "Writing through a linked directory is refused.");
                Assert.Equal("original", File.ReadAllText(victim), "Linked directory target untouched");

                // Seeded workspace files follow the same rule.
                File.CreateSymbolicLink(Path.Combine(directories.Workspace, "README.md"), victim);
                ExecutionWorkspace seeded = new ExecutionWorkspace { Kind = WorkspaceKindEnum.Seeded };
                seeded.Files.Add(new ExecutionWorkspaceFile { Path = "README.md", Content = "seed" });
                await new WorkspacePreparer().PrepareAsync(seeded, directories, new Dictionary<string, string>(), token).ConfigureAwait(false);
                Assert.Equal("original", File.ReadAllText(victim), "Seeded file did not write through the link");
                Assert.Equal("seed", File.ReadAllText(Path.Combine(directories.Workspace, "README.md")), "Seeded content written");
            }
            finally
            {
                TryDelete(root);
            }
        }

        private static async Task ArtifactLinkSwapAsync(CancellationToken token)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;
            string root = NewTemp();
            try
            {
                string workspace = Path.Combine(root, "workspace");
                string outside = Path.Combine(root, "outside");
                Directory.CreateDirectory(Path.Combine(workspace, "out"));
                Directory.CreateDirectory(outside);
                File.WriteAllText(Path.Combine(workspace, "out", "report.txt"), "artifact");
                File.WriteAllText(Path.Combine(outside, "report.txt"), "worker-private");

                byte[] ok = await ArtifactUploader.ReadAsync(workspace, Path.Combine(workspace, "out", "report.txt"), 1024, token).ConfigureAwait(false);
                Assert.Equal("artifact", Encoding.UTF8.GetString(ok), "A regular artifact is read");

                // After selection, the harness swaps the parent directory for a link to a directory outside the workspace.
                Directory.Delete(Path.Combine(workspace, "out"), true);
                Directory.CreateSymbolicLink(Path.Combine(workspace, "out"), outside);
                bool refused = false;
                try
                {
                    await ArtifactUploader.ReadAsync(workspace, Path.Combine(workspace, "out", "report.txt"), 1024, token).ConfigureAwait(false);
                }
                catch (IOException)
                {
                    refused = true;
                }
                Assert.True(refused, "An artifact reached through a linked directory is not read.");
            }
            finally
            {
                TryDelete(root);
            }
        }

        private static async Task ClaimLabelAsync(CancellationToken token)
        {
            Assert.True(WorkspaceClaimGuard.Refusal(Claim("mine", "ten_a"), "mine", "runs", "ten_a") == null, "Own claim allowed");
            Assert.True(WorkspaceClaimGuard.Refusal(Claim("theirs", "ten_b"), "theirs", "runs", "ten_a") != null, "Other tenant's claim refused");
            Assert.True(WorkspaceClaimGuard.Refusal(Claim("backup", null), "backup", "runs", "ten_a") != null, "Unlabeled claim refused");
            Assert.True(WorkspaceClaimGuard.Refusal(null, "missing", "runs", "ten_a") != null, "Missing claim refused");

            int port = TestServerHost.FreePort();
            using (HttpListener listener = new HttpListener())
            using (CancellationTokenSource stop = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
                listener.Start();
                Task serve = Task.Run(() => ServeClaimsAsync(listener, stop.Token));
                try
                {
                    using (k8s.Kubernetes client = new k8s.Kubernetes(new KubernetesClientConfiguration { Host = "http://127.0.0.1:" + port }))
                    {
                        Assert.True(await WorkspaceClaimGuard.CheckAsync(client, "runs", Spec("ten_a", "tenant-claim"), token).ConfigureAwait(false) == null, "Labeled claim of the run's tenant mounts");
                        string? other = await WorkspaceClaimGuard.CheckAsync(client, "runs", Spec("ten_a", "other-claim"), token).ConfigureAwait(false);
                        Assert.True(other != null && other.Contains("another tenant", StringComparison.Ordinal), "Another tenant's claim refused: " + other);
                        string? backup = await WorkspaceClaimGuard.CheckAsync(client, "runs", Spec("ten_a", "postgres-backup"), token).ConfigureAwait(false);
                        Assert.True(backup != null && backup.Contains(WorkspaceClaimGuard.TenantLabel, StringComparison.Ordinal), "Unlabeled platform claim refused: " + backup);
                        string? missing = await WorkspaceClaimGuard.CheckAsync(client, "runs", Spec("ten_a", "nope"), token).ConfigureAwait(false);
                        Assert.True(missing != null && missing.Contains("does not exist", StringComparison.Ordinal), "Missing claim refused: " + missing);
                        ExecutionSpec empty = new ExecutionSpec { TenantId = "ten_a" };
                        Assert.True(await WorkspaceClaimGuard.CheckAsync(client, "runs", empty, token).ConfigureAwait(false) == null, "Non-PersistentVolume workspaces need no claim");
                    }
                }
                finally
                {
                    stop.Cancel();
                    listener.Stop();
                    try
                    {
                        await serve.ConfigureAwait(false);
                    }
                    catch (Exception e) when (e is HttpListenerException || e is ObjectDisposedException || e is OperationCanceledException)
                    {
                    }
                }
            }
        }

        private static async Task ServeClaimsAsync(HttpListener listener, CancellationToken token)
        {
            while (!token.IsCancellationRequested)
            {
                HttpListenerContext context;
                try
                {
                    context = await listener.GetContextAsync().ConfigureAwait(false);
                }
                catch (Exception e) when (e is HttpListenerException || e is ObjectDisposedException || e is InvalidOperationException)
                {
                    return;
                }
                string path = context.Request.Url?.AbsolutePath ?? String.Empty;
                string prefix = "/api/v1/namespaces/runs/persistentvolumeclaims/";
                string? name = path.StartsWith(prefix, StringComparison.Ordinal) ? path.Substring(prefix.Length) : null;
                string body;
                int status = 200;
                if (name == "tenant-claim") body = KubernetesJson.Serialize(Claim(name, "ten_a"));
                else if (name == "other-claim") body = KubernetesJson.Serialize(Claim(name, "ten_b"));
                else if (name == "postgres-backup") body = KubernetesJson.Serialize(Claim(name, null));
                else
                {
                    status = 404;
                    body = "{\"kind\":\"Status\",\"apiVersion\":\"v1\",\"status\":\"Failure\",\"reason\":\"NotFound\",\"code\":404}";
                }
                byte[] bytes = Encoding.UTF8.GetBytes(body);
                context.Response.StatusCode = status;
                context.Response.ContentType = "application/json";
                context.Response.ContentLength64 = bytes.Length;
                await context.Response.OutputStream.WriteAsync(bytes, token).ConfigureAwait(false);
                context.Response.Close();
            }
        }

        private static V1PersistentVolumeClaim Claim(string name, string? tenant)
        {
            V1PersistentVolumeClaim claim = new V1PersistentVolumeClaim();
            claim.ApiVersion = "v1";
            claim.Kind = "PersistentVolumeClaim";
            claim.Metadata = new V1ObjectMeta { Name = name, NamespaceProperty = "runs" };
            if (tenant != null) claim.Metadata.Labels = new Dictionary<string, string> { { WorkspaceClaimGuard.TenantLabel, tenant } };
            return claim;
        }

        private static ExecutionSpec Spec(string tenantId, string claim)
        {
            ExecutionSpec spec = new ExecutionSpec();
            spec.TenantId = tenantId;
            spec.Workspace = new ExecutionWorkspace { Kind = WorkspaceKindEnum.PersistentVolume, PersistentVolumeClaim = claim };
            return spec;
        }

        private static async Task McpTestsOptInAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 0, token).ConfigureAwait(false))
            {
                cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "default-worker", null, token).ConfigureAwait(false));
                cluster.Workers.Add(await TestCluster.StartWorkerAsync(cluster.Server.BaseUrl, "diagnostic-worker", settings => settings.McpTestsEnabled = true, token).ConfigureAwait(false));
                EnumerationResult<Node> nodes = await cluster.Server.Server.Context.Database.Nodes.EnumerateAsync(new EnumerationQuery(), token).ConfigureAwait(false);
                Node plain = nodes.Objects.Single(n => n.Name == "default-worker");
                Node diagnostic = nodes.Objects.Single(n => n.Name == "diagnostic-worker");
                Assert.True(!plain.SupportsMcpTests, "A worker without McpTestsEnabled does not advertise stdio diagnostics.");
                Assert.True(diagnostic.SupportsMcpTests, "A worker with McpTestsEnabled advertises stdio diagnostics.");

                string api = "/v1.0/api/tenants/" + cluster.Server.TenantId;
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(cluster.Server.AdminClient, HttpMethod.Post, api + "/mcp-servers", new McpServer
                {
                    Name = "stdio-opt-in", Active = false, Transport = McpTransportEnum.Stdio, Command = "garrison-fake-harness", Arguments = new List<string> { "--mcp-stdio" }
                }, 201, token).ConfigureAwait(false);
                TestResponse refused = await HttpTestHelpers.SendAsync(cluster.Server.AdminClient, HttpMethod.Post, api + "/mcp-servers/" + server.Id + "/test?nodeId=" + plain.Id, null, token).ConfigureAwait(false);
                Assert.Equal(400, refused.StatusCode, "Stdio diagnostic on a worker that did not opt in: " + refused.Body);
            }
        }

        private static async Task NodeIdentityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                User owner = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "second-node@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = owner.Id, RoleName = BuiltInRoles.NodeAgent }, 201, token).ConfigureAwait(false);
                CredentialCreateResponse firstKey = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "first-node-key", UserId = owner.Id, RoleName = BuiltInRoles.NodeAgent }, 201, token).ConfigureAwait(false);
                CredentialCreateResponse second = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "second-node-key", UserId = owner.Id, RoleName = BuiltInRoles.NodeAgent }, 201, token).ConfigureAwait(false);

                NodeRegisterRequest register = new NodeRegisterRequest { Name = "bound-node", MaxConcurrentRuns = 2 };
                using (HttpClient first = host.CredentialClient(firstKey.AccessKey, firstKey.SecretKey))
                using (HttpClient other = host.CredentialClient(second.AccessKey, second.SecretKey))
                {
                    NodeRegisterResponse registered = await HttpTestHelpers.SendAsync<NodeRegisterResponse>(first, HttpMethod.Post, "/v1.0/api/node/register", register, 200, token).ConfigureAwait(false);

                    TestResponse takeover = await HttpTestHelpers.SendAsync(other, HttpMethod.Post, "/v1.0/api/node/register", register, token).ConfigureAwait(false);
                    Assert.Equal(409, takeover.StatusCode, "Re-registering another credential's node: " + takeover.Body);
                    Assert.True(takeover.Body.Contains("NodeIdentityMismatch", StringComparison.Ordinal), "Mismatch code: " + takeover.Body);
                    Node? stored = await host.Server.Context.Database.Nodes.ReadAsync(registered.NodeId, token).ConfigureAwait(false);
                    Assert.True(stored != null && stored.CredentialId != second.Credential.Id, "The node stays bound to its credential.");

                    string runPath = "/v1.0/api/node/runs/run_does_not_matter/";
                    TestResponse events = await HttpTestHelpers.SendAsync(other, HttpMethod.Post, runPath + "events", new RunEventsRequest { NodeId = registered.NodeId, Epoch = 1 }, token).ConfigureAwait(false);
                    Assert.True(events.StatusCode == 409 && events.Body.Contains("NodeIdentityMismatch", StringComparison.Ordinal), "Events for another credential's node: " + events.StatusCode + " " + events.Body);
                    TestResponse started = await HttpTestHelpers.SendAsync(other, HttpMethod.Post, runPath + "started", new RunStartedRequest { NodeId = registered.NodeId, Epoch = 1 }, token).ConfigureAwait(false);
                    Assert.True(started.StatusCode == 409 && started.Body.Contains("NodeIdentityMismatch", StringComparison.Ordinal), "Started for another credential's node: " + started.StatusCode + " " + started.Body);
                    TestResponse complete = await HttpTestHelpers.SendAsync(other, HttpMethod.Post, runPath + "complete", new RunCompleteRequest { NodeId = registered.NodeId, Epoch = 1, Status = RunStatusEnum.Succeeded }, token).ConfigureAwait(false);
                    Assert.True(complete.StatusCode == 409 && complete.Body.Contains("NodeIdentityMismatch", StringComparison.Ordinal), "Complete for another credential's node: " + complete.StatusCode + " " + complete.Body);

                    // The bound credential still reaches the lease fence (StaleLease for an unknown run), not the identity check.
                    TestResponse own = await HttpTestHelpers.SendAsync(first, HttpMethod.Post, runPath + "events", new RunEventsRequest { NodeId = registered.NodeId, Epoch = 1 }, token).ConfigureAwait(false);
                    Assert.True(!own.Body.Contains("NodeIdentityMismatch", StringComparison.Ordinal), "The bound credential is not refused: " + own.Body);

                    // Once the bound credential is deactivated, another NodeAgent credential may take the name over.
                    await HttpTestHelpers.SendAsync<Credential>(host.AdminClient, HttpMethod.Put, t + "/credentials/" + firstKey.Credential.Id, new CredentialRequest { Active = false }, 200, token).ConfigureAwait(false);
                    NodeRegisterResponse moved = await HttpTestHelpers.SendAsync<NodeRegisterResponse>(other, HttpMethod.Post, "/v1.0/api/node/register", register, 200, token).ConfigureAwait(false);
                    Assert.Equal(registered.NodeId, moved.NodeId, "Takeover keeps the node");
                }
            }
        }

        private static bool Git(string directory, params string[] arguments)
        {
            ProcessStartInfo start = new ProcessStartInfo("git");
            start.WorkingDirectory = directory;
            start.RedirectStandardOutput = true;
            start.RedirectStandardError = true;
            start.UseShellExecute = false;
            foreach (string argument in arguments) start.ArgumentList.Add(argument);
            try
            {
                using (Process? process = Process.Start(start))
                {
                    if (process == null) return false;
                    process.StandardOutput.ReadToEnd();
                    process.StandardError.ReadToEnd();
                    process.WaitForExit();
                    return process.ExitCode == 0;
                }
            }
            catch (System.ComponentModel.Win32Exception)
            {
                return false;
            }
        }

        private static string NewTemp()
        {
            string root = Path.Combine(Path.GetTempPath(), "garrison-security-worker-" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(root);
            return root;
        }

        private static void TryDelete(string root)
        {
            try
            {
                if (Directory.Exists(root)) Directory.Delete(root, true);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
            }
        }

        #endregion
    }
}
