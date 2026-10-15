namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Net.Sockets;
    using System.Net.WebSockets;
    using System.Security.Cryptography;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Settings;
    using Garrison.Server.Routes;
    using Garrison.Server.Settings;
    using Garrison.Server.Storage;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Regression tests for the P15.22 fixes to the open P15.1 findings (docs/SECURITY_REVIEW.md): chunked request bodies
    /// (SR-03), connect-time outbound address checks and redirects (SR-07), public default keys (SR-08), the permission to
    /// use secrets (SR-10), seeded credentials (SR-11), artifact ticket keys (SR-12), the grant ceiling (SR-13), prompt
    /// arguments (SR-14), the live-updates WebSocket (SR-15), session lifetime (SR-17), secret metadata (SR-18), key
    /// handling (SR-19), anonymous metrics (SR-20), ambient S3 credentials (SR-21), and the smaller observations (SR-26).
    /// Worker-side fixes are tested in SecurityWorkerSuite and deployment assets in SecurityAssetsSuite.
    /// </summary>
    public static class SecurityHardeningSuite
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
            unit.Add(new TestCaseDescriptor("security-hardening-unit", "insecure-defaults", "The server refuses to start with empty or public default keys and credentials unless development mode is explicit (SR-08)", ct => InsecureDefaultsAsync()));
            unit.Add(new TestCaseDescriptor("security-hardening-unit", "secret-metadata", "Short secrets show no last four characters and fingerprints are keyed with the master key (SR-18)", ct => SecretMetadataAsync()));
            unit.Add(new TestCaseDescriptor("security-hardening-unit", "key-handling", "Weak keys are recognized and a value written under another master key version is refused (SR-19)", ct => KeyHandlingAsync()));
            unit.Add(new TestCaseDescriptor("security-hardening-unit", "outbound-handler", "The outbound handler refuses blocked addresses at connect time, after resolving names, and never follows redirects; S3 clients use it (SR-07)", ct => OutboundHandlerAsync(ct)));
            unit.Add(new TestCaseDescriptor("security-hardening-unit", "metrics-default", "Metrics are not served on the service port by default (SR-20)", ct => MetricsDefaultAsync()));
            suites.Add(new TestSuiteDescriptor("security-hardening-unit", "Security hardening (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "security-hardening-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "mcp-test-redirect", "The HTTP MCP server test uses the outbound handler through Voltaic 2.4.0: a 302 from the server is reported, and its target is never contacted (SR-07, " + provider + ")", ct => McpTestRedirectAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "chunked-body-limit", "A chunked request body larger than Rest.MaxRequestBodyBytes is refused with 413; a small chunked body still works (SR-03, " + provider + ")", ct => ChunkedBodyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "secret-use", "Configuring a deployment, MCP server test, or manifest that uses a secret needs Execute on that secret (SR-10, " + provider + ")", ct => SecretUseAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "seeded-credential-kept", "Seeding again never overwrites a seeded credential's secret (SR-11, " + provider + ")", ct => SeededCredentialAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "artifact-ticket-key", "A session-key token cannot be used as an artifact download ticket (SR-12, " + provider + ")", ct => TicketKeyAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "grant-ceiling", "A SecurityAdmin cannot grant what it does not hold, set the tenant administrator flag, take over a tenant administrator, or use a built-in role name (SR-13, " + provider + ")", ct => GrantCeilingAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "prompt-argument-separator", "A prompt delivered as an argument follows --, so text starting with - is not read as an option (SR-14, " + provider + ")", ct => PromptSeparatorAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "websocket-scope-and-cap", "/v1.0/ws is in the operation scope map and a session may hold at most 64 subscriptions (SR-15, " + provider + ")", ct => WebSocketAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "session-lifetime", "A password change revokes the user's other sessions and a refresh revokes the session it replaces (SR-17, " + provider + ")", ct => SessionLifetimeAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "metrics-service-port", "GET /metrics on the REST port answers 404 by default (SR-20, " + provider + ")", ct => MetricsPortAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "s3-ambient-credentials", "An S3 store with a custom endpoint needs a credential secret unless the operator allows ambient credentials (SR-21, " + provider + ")", ct => AmbientS3Async(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "info-findings", "Sanitized MCP test errors, 401 for unreadable credential secrets, rate-limited key failures, typed A2A ids, Enum run override default, and checked remote endpoints (SR-26, " + provider + ")", ct => InfoFindingsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Security hardening (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task InsecureDefaultsAsync()
        {
            ServerSettings defaults = new ServerSettings();
            List<string> found = defaults.InsecureDefaults();
            Assert.Equal(6, found.Count, "Six public defaults: " + String.Join(", ", found));
            bool refused = false;
            try
            {
                defaults.Validate();
            }
            catch (InvalidOperationException e)
            {
                refused = e.Message.Contains("GARRISON_MASTER_KEY", StringComparison.Ordinal) && e.Message.Contains("GARRISON_ALLOW_INSECURE_DEFAULTS", StringComparison.Ordinal);
            }
            Assert.True(refused, "Startup with public defaults is refused with the variables named.");

            ServerSettings empty = Real();
            empty.Auth.AdminApiKey = String.Empty;
            Assert.True(empty.InsecureDefaults().Count == 1, "An empty administrator API key counts as insecure.");

            ServerSettings development = new ServerSettings();
            development.Security.AllowInsecureDefaults = true;
            development.Validate();

            ServerSettings real = Real();
            Assert.Equal(0, real.InsecureDefaults().Count, "Real values pass");
            real.Validate();
            return Task.CompletedTask;
        }

        private static ServerSettings Real()
        {
            ServerSettings settings = new ServerSettings();
            settings.Security.MasterKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            settings.Auth.SigningKey = SecretGenerator.Alphanumeric(48);
            settings.Auth.AdminApiKey = SecretGenerator.Alphanumeric(40);
            settings.Security.AdminPassword = SecretGenerator.Alphanumeric(20);
            settings.Security.DefaultSecretKey = SecretGenerator.NewSecretKey();
            settings.Security.NodeSecretKey = SecretGenerator.NewSecretKey();
            return settings;
        }

        private static Task SecretMetadataAsync()
        {
            Assert.Equal(String.Empty, SecretGenerator.Last4("abcd"), "Four-character secret");
            Assert.Equal(String.Empty, SecretGenerator.Last4("short-pass1"), "Eleven-character secret");
            Assert.Equal("6789", SecretGenerator.Last4("sk-ant-123456789"), "Long secret");

            SecretCipher one = new SecretCipher("fingerprint-key-one");
            SecretCipher two = new SecretCipher("fingerprint-key-two");
            string unsalted = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes("hunter2"))).Substring(0, 16).ToLowerInvariant();
            Assert.True(one.Fingerprint("hunter2") != unsalted, "The fingerprint is not an unsalted hash a guess can be checked against.");
            Assert.True(one.Fingerprint("hunter2") != two.Fingerprint("hunter2"), "Fingerprints depend on the master key.");
            Assert.Equal(one.Fingerprint("hunter2"), one.Fingerprint("hunter2"), "Fingerprints are stable for change detection");
            Assert.Equal(16, one.Fingerprint("x").Length, "Sixteen hex characters");
            return Task.CompletedTask;
        }

        private static Task KeyHandlingAsync()
        {
            Assert.True(SecretCipher.IsStrongKey(Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))), "Base64 of 32 bytes is strong.");
            Assert.True(!SecretCipher.IsStrongKey("passphrase"), "A passphrase is weak.");
            Assert.True(!SecretCipher.IsStrongKey(Convert.ToBase64String(RandomNumberGenerator.GetBytes(16))), "Sixteen bytes is weak.");
            Assert.True(TokenService.IsStrongKey(SecretGenerator.Alphanumeric(32)), "Thirty-two characters is strong.");
            Assert.True(!TokenService.IsStrongKey("short-signing-key"), "A short signing key is weak.");

            string key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
            string encrypted = new SecretCipher(key, 1).Encrypt("value", "sec_1");
            Assert.Equal("value", new SecretCipher(key, 1).Decrypt(encrypted, "sec_1"), "Same version decrypts");
            bool refused = false;
            try
            {
                new SecretCipher(key, 2).Decrypt(encrypted, "sec_1");
            }
            catch (CryptographicException e)
            {
                refused = e.Message.Contains("version", StringComparison.Ordinal);
            }
            Assert.True(refused, "A value written under key version 1 is refused by a server holding version 2 only.");
            return Task.CompletedTask;
        }

        private static async Task OutboundHandlerAsync(CancellationToken token)
        {
            Assert.True(OutboundAddressPolicy.IsLoopbackOrPrivate(IPAddress.Parse("10.1.2.3")) && OutboundAddressPolicy.IsLoopbackOrPrivate(IPAddress.Parse("::1")) && !OutboundAddressPolicy.IsLoopbackOrPrivate(IPAddress.Parse("8.8.8.8")), "Private range detection");

            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            Task server = Task.Run(async () =>
            {
                for (int i = 0; i < 4; i++)
                {
                    using (TcpClient client = await listener.AcceptTcpClientAsync(token).ConfigureAwait(false))
                    using (NetworkStream stream = client.GetStream())
                    {
                        byte[] buffer = new byte[4096];
                        await stream.ReadAsync(buffer, token).ConfigureAwait(false);
                        byte[] reply = Encoding.ASCII.GetBytes("HTTP/1.1 302 Found\r\nLocation: http://169.254.169.254/latest/meta-data/\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                        await stream.WriteAsync(reply, token).ConfigureAwait(false);
                    }
                }
            }, token);
            try
            {
                using (HttpClient guarded = new HttpClient(OutboundAddressPolicy.CreateHandler(), true))
                {
                    guarded.Timeout = TimeSpan.FromSeconds(10);
                    HttpResponseMessage redirect = await guarded.GetAsync("http://127.0.0.1:" + port + "/", token).ConfigureAwait(false);
                    Assert.Equal(302, (int)redirect.StatusCode, "The redirect is returned, not followed");

                    HttpResponseMessage named = await guarded.GetAsync("http://localhost:" + port + "/", token).ConfigureAwait(false);
                    Assert.Equal(302, (int)named.StatusCode, "A name that resolves to an allowed address connects");

                    DateTime started = DateTime.UtcNow;
                    Exception? blocked = null;
                    try
                    {
                        await guarded.GetAsync("http://169.254.169.254/latest/meta-data/", token).ConfigureAwait(false);
                    }
                    catch (HttpRequestException e)
                    {
                        blocked = e.InnerException;
                    }
                    Assert.True(blocked is OutboundAddressBlockedException, "The metadata address is refused at connect time: " + blocked);
                    Assert.True(DateTime.UtcNow - started < TimeSpan.FromSeconds(5), "Refused without a connection attempt.");
                }

                using (HttpClient strict = new HttpClient(OutboundAddressPolicy.CreateHandler(false), true))
                {
                    Exception? refused = null;
                    try
                    {
                        await strict.GetAsync("http://localhost:" + port + "/", token).ConfigureAwait(false);
                    }
                    catch (HttpRequestException e)
                    {
                        refused = e.InnerException;
                    }
                    Assert.True(refused is OutboundAddressBlockedException, "With private networks refused, a name that resolves to loopback is refused after resolution: " + refused);
                }

                Amazon.S3.AmazonS3Config config = new Amazon.S3.AmazonS3Config();
                using (HttpClient s3 = new GuardedS3HttpClientFactory().CreateHttpClient(config))
                {
                    HttpResponseMessage redirect = await s3.GetAsync("http://127.0.0.1:" + port + "/", token).ConfigureAwait(false);
                    Assert.Equal(302, (int)redirect.StatusCode, "S3 clients do not follow redirects");
                    Exception? blocked = null;
                    try
                    {
                        await s3.GetAsync("http://[fd00:ec2::254]/", token).ConfigureAwait(false);
                    }
                    catch (HttpRequestException e)
                    {
                        blocked = e.InnerException;
                    }
                    Assert.True(blocked is OutboundAddressBlockedException, "S3 clients refuse the IPv6 metadata address: " + blocked);
                }
            }
            finally
            {
                listener.Stop();
                try
                {
                    await server.ConfigureAwait(false);
                }
                catch (Exception e) when (e is SocketException || e is ObjectDisposedException || e is OperationCanceledException || e is IOException)
                {
                }
            }
        }

        private static Task MetricsDefaultAsync()
        {
            Assert.True(!new TelemetrySettings().ServeMetricsOnServicePort, "Metrics are served only on the metrics listener by default.");
            return Task.CompletedTask;
        }

        private static async Task ChunkedBodyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => s.Rest.MaxRequestBodyBytes = 1048576, token).ConfigureAwait(false))
            using (HttpClient anonymous = new HttpClient())
            {
                int status;
                try
                {
                    using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, host.BaseUrl + "/v1.0/token"))
                    {
                        request.Content = new StreamContent(new MemoryStream(new byte[3 * 1048576]));
                        request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                        request.Headers.TransferEncodingChunked = true;
                        HttpResponseMessage response = await anonymous.SendAsync(request, token).ConfigureAwait(false);
                        status = (int)response.StatusCode;
                    }
                }
                catch (HttpRequestException)
                {
                    // The listener may close the connection once it has answered, before the client finishes sending.
                    status = 413;
                }
                Assert.Equal(413, status, "Oversized chunked request");

                using (HttpRequestMessage small = new HttpRequestMessage(HttpMethod.Post, host.BaseUrl + "/v1.0/token"))
                {
                    small.Content = new StreamContent(new MemoryStream(Encoding.UTF8.GetBytes(Serializer.Serialize(new { email = "admin@garrison", password = "password", tenantId = host.TenantId }))));
                    small.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                    small.Headers.TransferEncodingChunked = true;
                    HttpResponseMessage ok = await anonymous.SendAsync(small, token).ConfigureAwait(false);
                    Assert.Equal(200, (int)ok.StatusCode, "A small chunked request is read by the handler: " + await ok.Content.ReadAsStringAsync(token).ConfigureAwait(false));
                }
            }
        }

        private static async Task SecretUseAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                Secret secret = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, t + "/secrets", new SecretRequest { Name = "vendor-token", Value = "vendor-token-value-1234" }, 201, token).ConfigureAwait(false);
                User editor = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "editor@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = editor.Id, RoleName = BuiltInRoles.Editor }, 201, token).ConfigureAwait(false);
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, t + "/agents", new Agent { Name = "secret-user-agent" }, 201, token).ConfigureAwait(false);

                using (HttpClient client = await host.UserClientAsync(editor.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Deployment deployment = new Deployment { Name = "uses-vendor", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" };
                    deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "vendor", ResourceId = secret.Id });
                    TestResponse denied = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/deployments", deployment, token).ConfigureAwait(false);
                    Assert.Equal(400, denied.StatusCode, "An editor binding a secret it may not use: " + denied.Body);
                    Assert.True(denied.Body.Contains(SecretUseChecker.DeniedCode, StringComparison.Ordinal), "Field code: " + denied.Body);

                    McpServer exfil = await HttpTestHelpers.SendAsync<McpServer>(client, HttpMethod.Post, t + "/mcp-servers", new McpServer { Name = "exfil", Transport = McpTransportEnum.Http, Url = "http://127.0.0.1:9", Headers = new List<McpServerHeader> { new McpServerHeader { Name = "x-leak", ValueTemplate = "{{secret.vendor-token}}" } } }, 201, token).ConfigureAwait(false);
                    TestResponse test = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/mcp-servers/" + exfil.Id + "/test", null, token).ConfigureAwait(false);
                    Assert.Equal(400, test.StatusCode, "An MCP test that renders a secret the caller may not use: " + test.Body);
                    Assert.True(test.Body.Contains(SecretUseChecker.DeniedCode, StringComparison.Ordinal), "Field code: " + test.Body);

                    string manifest = "apiVersion: garrison/v1\nkind: Deployment\nmetadata:\n  name: manifest-vendor\nspec:\n  agent: secret-user-agent\n  harnessProfile: builtin/fake\n  resources:\n    secrets:\n      - alias: vendor\n        secret: vendor-token\n";
                    using (StringContent yaml = new StringContent(manifest, Encoding.UTF8, "application/yaml"))
                    {
                        HttpResponseMessage applied = await client.PostAsync(t + "/manifests/apply", yaml, token).ConfigureAwait(false);
                        string body = await applied.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                        Assert.Equal(400, (int)applied.StatusCode, "A manifest binding a secret the caller may not use: " + body);
                        ManifestApply result = Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply.");
                        Assert.Equal(SecretUseChecker.DeniedCode, result.Items.Single().ErrorCode, "Manifest item error code");
                    }
                }

                // SecretUser on this one secret is enough.
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = editor.Id, RoleName = BuiltInRoles.SecretUser, ResourceScope = ResourceScopeEnum.Resource, ResourceId = secret.Id }, 201, token).ConfigureAwait(false);
                host.Server.Context.Authorization.Invalidate();
                using (HttpClient client = await host.UserClientAsync(editor.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    Deployment deployment = new Deployment { Name = "uses-vendor", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" };
                    deployment.ResourceBindings.Add(new DeploymentResourceBinding { Kind = ResourceBindingKindEnum.Secret, Alias = "vendor", ResourceId = secret.Id });
                    await HttpTestHelpers.SendAsync<Deployment>(client, HttpMethod.Post, t + "/deployments", deployment, 201, token).ConfigureAwait(false);
                }
            }
        }

        private static async Task SeededCredentialAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                SecretCipher cipher = new SecretCipher("seed-test-master-key");
                SeedOptions first = new SeedOptions();
                first.NodeSecretKey = "secret_seeded_node_first_value";
                await new DefaultSeeder(db, cipher, null).SeedAsync(first, token).ConfigureAwait(false);

                Credential node = await db.Credentials.ReadByAccessKeyAsync(first.NodeAccessKey, token).ConfigureAwait(false) ?? throw new TestAssertionException("Node credential was not seeded.");
                node.SecretKeyEncrypted = cipher.Encrypt("secret_rotated_through_the_api", node.Id);
                await db.Credentials.UpdateAsync(node, token).ConfigureAwait(false);

                SeedOptions restart = new SeedOptions();
                restart.NodeSecretKey = "secret_seeded_node_first_value";
                await new DefaultSeeder(db, cipher, null).SeedAsync(restart, token).ConfigureAwait(false);
                Credential after = await db.Credentials.ReadByAccessKeyAsync(first.NodeAccessKey, token).ConfigureAwait(false) ?? throw new TestAssertionException("Node credential vanished.");
                Assert.Equal("secret_rotated_through_the_api", cipher.Decrypt(after.SecretKeyEncrypted, after.Id), "A restart keeps the rotated secret");
            }
        }

        private static async Task TicketKeyAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                DatabaseDriverBase db = host.Server.Context.Database;
                ArtifactStore store = await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "ticket-store", Kind = ArtifactStoreKindEnum.Database }, 201, token).ConfigureAwait(false);
                Run run = await db.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = "agt_ticket", DeploymentId = "dep_ticket", Status = RunStatusEnum.Running, LeaseEpoch = 1 }, token).ConfigureAwait(false);
                Artifact artifact = new Artifact { TenantId = host.TenantId, RunId = run.Id, ArtifactStoreId = store.Id, Name = "answer.txt", LeaseEpoch = 1, SizeBytes = 5, Location = store.Id + "/ticket" };
                Artifact created = await db.Artifacts.CreateForExecutionAsync(artifact, Encoding.UTF8.GetBytes("hello"), token).ConfigureAwait(false) ?? throw new TestAssertionException("Artifact was not created.");

                string forged = host.Server.Context.Tokens.Issue(new TokenPayload { Purpose = "ArtifactDownload", TokenId = created.Id, TenantId = host.TenantId, RunId = run.Id, SessionId = "artifact-download", ExpiresUtc = DateTime.UtcNow.AddMinutes(5) });
                using (HttpClient anonymous = new HttpClient())
                {
                    HttpResponseMessage refused = await anonymous.GetAsync(host.BaseUrl + "/v1.0/artifact-download/" + created.Id + "?ticket=" + Uri.EscapeDataString(forged), token).ConfigureAwait(false);
                    Assert.Equal(404, (int)refused.StatusCode, "A token made with the session key is not a ticket");

                    ArtifactDownloadResponse link = await HttpTestHelpers.SendAsync<ArtifactDownloadResponse>(host.AdminClient, HttpMethod.Post, t + "/artifacts/" + created.Id + "/download-url", null, 200, token).ConfigureAwait(false);
                    HttpResponseMessage genuine = await anonymous.GetAsync(link.Url, token).ConfigureAwait(false);
                    Assert.Equal(200, (int)genuine.StatusCode, "A genuine ticket downloads");
                    string ticket = Uri.UnescapeDataString(new Uri(link.Url).Query.Substring("?ticket=".Length));
                    Assert.True(host.Server.Context.Tokens.Validate(ticket) == null, "A ticket is not a session token.");
                }
            }
        }

        private static async Task GrantCeilingAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                User security = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "secadmin@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = security.Id, RoleName = BuiltInRoles.SecurityAdmin }, 201, token).ConfigureAwait(false);
                User tenantAdmin = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "owner@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                User member = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "plain@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);

                using (HttpClient client = await host.UserClientAsync(security.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    TestResponse self = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = security.Id, RoleName = BuiltInRoles.TenantAdmin }, token).ConfigureAwait(false);
                    Assert.Equal(400, self.StatusCode, "Assigning TenantAdmin to oneself: " + self.Body);
                    Assert.True(self.Body.Contains("GrantCeiling", StringComparison.Ordinal), "Field code: " + self.Body);

                    TestResponse secrets = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = member.Id, RoleName = BuiltInRoles.SecretManager }, token).ConfigureAwait(false);
                    Assert.Equal(400, secrets.StatusCode, "Assigning a role with permissions the assigner lacks: " + secrets.Body);

                    TestResponse flag = await HttpTestHelpers.SendAsync(client, HttpMethod.Put, t + "/users/" + security.Id, new UserRequest { IsTenantAdmin = true }, token).ConfigureAwait(false);
                    Assert.Equal(400, flag.StatusCode, "Setting the tenant administrator flag on oneself: " + flag.Body);
                    TestResponse newAdmin = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/users", new UserRequest { Email = "sneaky@example.com", Password = "password123", IsTenantAdmin = true }, token).ConfigureAwait(false);
                    Assert.Equal(400, newAdmin.StatusCode, "Creating a tenant administrator: " + newAdmin.Body);

                    TestResponse takeover = await HttpTestHelpers.SendAsync(client, HttpMethod.Put, t + "/users/" + tenantAdmin.Id, new UserRequest { Password = "taken-over-2" }, token).ConfigureAwait(false);
                    Assert.Equal(400, takeover.StatusCode, "Resetting a tenant administrator's password: " + takeover.Body);
                    TestResponse mint = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "owner-key", UserId = tenantAdmin.Id }, token).ConfigureAwait(false);
                    Assert.Equal(400, mint.StatusCode, "Minting a credential that acts as a tenant administrator: " + mint.Body);

                    TestResponse reserved = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/roles", new RoleRequest { Name = "tenantadmin" }, token).ConfigureAwait(false);
                    Assert.Equal(400, reserved.StatusCode, "A tenant role named like a built-in role: " + reserved.Body);
                    Assert.True(reserved.Body.Contains("ReservedRoleName", StringComparison.Ordinal), "Field code: " + reserved.Body);

                    Role mine = await HttpTestHelpers.SendAsync<Role>(client, HttpMethod.Post, t + "/roles", new RoleRequest { Name = "auditors-plus" }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(client, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = security.Id, RoleId = mine.Id }, 201, token).ConfigureAwait(false);
                    Permission everything = await HttpTestHelpers.SendAsync<Permission>(client, HttpMethod.Post, t + "/permissions", new PermissionRequest { Name = "everything", ResourceTypes = new List<string> { "All" }, OperationTypes = new List<string> { "All" } }, 201, token).ConfigureAwait(false);
                    TestResponse map = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/role-permissions", new RolePermissionRequest { RoleId = mine.Id, PermissionId = everything.Id }, token).ConfigureAwait(false);
                    Assert.Equal(400, map.StatusCode, "Mapping a permission beyond the caller into an assigned role: " + map.Body);

                    // Within the ceiling still works: a role that only reads users, mapped and assigned by the SecurityAdmin.
                    Role readers = await HttpTestHelpers.SendAsync<Role>(client, HttpMethod.Post, t + "/roles", new RoleRequest { Name = "user-readers" }, 201, token).ConfigureAwait(false);
                    Permission readUsers = await HttpTestHelpers.SendAsync<Permission>(client, HttpMethod.Post, t + "/permissions", new PermissionRequest { Name = "read-users", ResourceTypes = new List<string> { "User" }, OperationTypes = new List<string> { "Read" } }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<RolePermissionMap>(client, HttpMethod.Post, t + "/role-permissions", new RolePermissionRequest { RoleId = readers.Id, PermissionId = readUsers.Id }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(client, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = member.Id, RoleId = readers.Id }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<User>(client, HttpMethod.Put, t + "/users/" + member.Id, new UserRequest { Password = "new-password-2" }, 200, token).ConfigureAwait(false);
                }

                // An assignment that names a tenant role by identifier never receives a built-in role's grants by name.
                Role custom = await host.Server.Context.Database.Roles.CreateAsync(new Role { TenantId = host.TenantId, Name = "plain-custom" }, token).ConfigureAwait(false);
                await host.Server.Context.Database.UserRoleAssignments.CreateAsync(new UserRoleAssignment { TenantId = host.TenantId, UserId = member.Id, RoleId = custom.Id, RoleName = BuiltInRoles.TenantAdmin }, token).ConfigureAwait(false);
                host.Server.Context.Authorization.Invalidate();
                List<PermissionGrant> grants = await host.Server.Context.Authorization.GrantsForUserAsync(host.TenantId, member.Id, token).ConfigureAwait(false);
                Assert.True(!grants.Any(g => g.Source == BuiltInRoles.TenantAdmin), "A role identifier wins over a matching built-in name.");
            }
        }

        private static async Task PromptSeparatorAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (CompilerFixture fixture = await CompilerFixture.CreateAsync(provider, token).ConfigureAwait(false))
            {
                Deployment deployment = await fixture.DeploymentAsync("fake", false, token).ConfigureAwait(false);
                HarnessProfile profile = new HarnessProfile { TenantId = CompilerFixture.TenantId, Name = "argument-cli", Executable = "argument-cli", PromptDelivery = PromptDeliveryEnum.Argument, SystemPromptDelivery = SystemPromptDeliveryEnum.None };
                profile = await fixture.Database.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);
                deployment.HarnessProfileId = profile.Id;
                deployment.PromptBindings.RemoveAll(b => b.Role == "Task");
                await fixture.Database.Deployments.UpdateAsync(deployment, token).ConfigureAwait(false);

                Run run = CompilerFixture.RunFor(deployment, false);
                run.InputText = "--dangerously-skip-permissions";
                CompilationResult result = await fixture.Compiler.CompileAsync(run, null, token).ConfigureAwait(false);
                List<string> arguments = result.Spec.Arguments;
                int at = arguments.IndexOf("--dangerously-skip-permissions");
                Assert.True(at > 0 && arguments[at - 1] == "--", "The task follows --: " + String.Join(" ", arguments));

                profile.PromptArgumentTemplate = "--prompt={{input.text}}";
                await fixture.Database.HarnessProfiles.UpdateAsync(profile, token).ConfigureAwait(false);
                CompilationResult prefixed = await fixture.Compiler.CompileAsync(run, null, token).ConfigureAwait(false);
                Assert.True(!prefixed.Spec.Arguments.Contains("--"), "A template with a literal prefix needs no separator: " + String.Join(" ", prefixed.Spec.Arguments));
            }
        }

        private static async Task WebSocketAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                OperationScope? scope = host.Server.Context.Scopes.Find("GET", "/v1.0/ws");
                Assert.True(scope != null && scope.Authorization == RouteAuthorizationEnum.Handler, "/v1.0/ws is recorded as a handler-authorized route.");

                List<string> runIds = new List<string>();
                for (int i = 0; i < 65; i++)
                {
                    Run run = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = "agt_ws", DeploymentId = "dep_ws", Status = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded }, token).ConfigureAwait(false);
                    runIds.Add(run.Id);
                }
                string bearer = await LoginAsync(host, "admin@garrison", "password", token).ConfigureAwait(false);
                using (ClientWebSocket socket = new ClientWebSocket())
                {
                    await socket.ConnectAsync(new Uri("ws://127.0.0.1:" + host.Settings.Rest.Port + "/v1.0/ws?token=" + Uri.EscapeDataString(bearer)), token).ConfigureAwait(false);
                    await ReceiveUntilAsync(socket, "\"welcome\"", token).ConfigureAwait(false);
                    for (int i = 0; i < 64; i++)
                    {
                        await SendTextAsync(socket, "{\"type\":\"subscribe\",\"channel\":\"run:" + runIds[i] + "\"}", token).ConfigureAwait(false);
                        await ReceiveUntilAsync(socket, "\"subscribed\"", token).ConfigureAwait(false);
                    }
                    await SendTextAsync(socket, "{\"type\":\"subscribe\",\"channel\":\"run:" + runIds[64] + "\"}", token).ConfigureAwait(false);
                    string refused = await ReceiveUntilAsync(socket, "TooManySubscriptions", token).ConfigureAwait(false);
                    Assert.True(refused.Contains("TooManySubscriptions", StringComparison.Ordinal), "The 65th subscription is refused: " + refused);
                    await SendTextAsync(socket, "{\"type\":\"unsubscribe\",\"channel\":\"run:" + runIds[0] + "\"}", token).ConfigureAwait(false);
                    await ReceiveUntilAsync(socket, "\"unsubscribed\"", token).ConfigureAwait(false);
                    await SendTextAsync(socket, "{\"type\":\"subscribe\",\"channel\":\"run:" + runIds[64] + "\"}", token).ConfigureAwait(false);
                    await ReceiveUntilAsync(socket, "\"subscribed\"", token).ConfigureAwait(false);
                }
            }
        }

        private static async Task SessionLifetimeAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => s.Auth.RateLimitPerMinute = 1000, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "session@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                string first = await LoginAsync(host, user.Email, "password123", token).ConfigureAwait(false);
                string second = await LoginAsync(host, user.Email, "password123", token).ConfigureAwait(false);
                using (HttpClient a = Bearer(host, first))
                using (HttpClient b = Bearer(host, second))
                {
                    await HttpTestHelpers.SendAsync<User>(a, HttpMethod.Put, t + "/users/" + user.Id, new UserRequest { Password = "password456" }, 200, token).ConfigureAwait(false);
                    Assert.Equal(401, (await HttpTestHelpers.SendAsync(b, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode, "The other session ends at the password change");
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(a, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode, "The session that changed the password continues");

                    TokenResponse refreshed = await HttpTestHelpers.SendAsync<TokenResponse>(a, HttpMethod.Post, "/v1.0/token/refresh", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(401, (await HttpTestHelpers.SendAsync(a, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode, "The refreshed session is revoked");
                    using (HttpClient c = Bearer(host, refreshed.Token))
                    {
                        Assert.Equal(200, (await HttpTestHelpers.SendAsync(c, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode, "The new session works");
                    }
                }

                // An administrator resetting the password ends every session of that user.
                string third = await LoginAsync(host, user.Email, "password456", token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Put, t + "/users/" + user.Id, new UserRequest { Password = "password789" }, 200, token).ConfigureAwait(false);
                using (HttpClient d = Bearer(host, third))
                {
                    Assert.Equal(401, (await HttpTestHelpers.SendAsync(d, HttpMethod.Get, "/v1.0/token/details", null, token).ConfigureAwait(false)).StatusCode, "A reset by someone else ends the user's sessions");
                }
            }
        }

        private static async Task MetricsPortAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            using (HttpClient anonymous = new HttpClient())
            {
                HttpResponseMessage metrics = await anonymous.GetAsync(host.BaseUrl + "/metrics", token).ConfigureAwait(false);
                Assert.Equal(404, (int)metrics.StatusCode, "No anonymous metrics on the REST port by default");
            }
        }

        private static async Task AmbientS3Async(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                TestResponse ambient = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "ambient", Kind = ArtifactStoreKindEnum.S3, Bucket = "b", Endpoint = "https://s3.tenant.example.com" }, token).ConfigureAwait(false);
                Assert.Equal(400, ambient.StatusCode, "A custom endpoint without a credential secret: " + ambient.Body);
                Assert.True(ambient.Body.Contains("secretId", StringComparison.Ordinal), "Error names secretId: " + ambient.Body);
                await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "regional", Kind = ArtifactStoreKindEnum.S3, Bucket = "b", Region = "us-east-1" }, 201, token).ConfigureAwait(false);
                host.Settings.Artifacts.AllowAmbientCredentialsWithCustomEndpoint = true;
                await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "vpc-endpoint", Kind = ArtifactStoreKindEnum.S3, Bucket = "b", Endpoint = "https://bucket.vpce.example.com" }, 201, token).ConfigureAwait(false);
            }
        }

        private static async Task McpTestRedirectAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                TcpListener target = new TcpListener(IPAddress.Loopback, 0);
                TcpListener redirector = new TcpListener(IPAddress.Loopback, 0);
                target.Start();
                redirector.Start();
                int targetPort = ((IPEndPoint)target.LocalEndpoint).Port;
                int redirectorPort = ((IPEndPoint)redirector.LocalEndpoint).Port;
                int targetHits = 0;
                using (CancellationTokenSource stop = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    Task countTarget = Task.Run(async () =>
                    {
                        try
                        {
                            while (true)
                            {
                                using (TcpClient client = await target.AcceptTcpClientAsync(stop.Token).ConfigureAwait(false))
                                {
                                    Interlocked.Increment(ref targetHits);
                                }
                            }
                        }
                        catch (Exception e) when (e is OperationCanceledException || e is SocketException || e is ObjectDisposedException)
                        {
                        }
                    }, CancellationToken.None);
                    Task redirect = Task.Run(async () =>
                    {
                        try
                        {
                            while (true)
                            {
                                using (TcpClient client = await redirector.AcceptTcpClientAsync(stop.Token).ConfigureAwait(false))
                                using (NetworkStream stream = client.GetStream())
                                {
                                    byte[] buffer = new byte[8192];
                                    await stream.ReadAsync(buffer, stop.Token).ConfigureAwait(false);
                                    byte[] reply = Encoding.ASCII.GetBytes("HTTP/1.1 302 Found\r\nLocation: http://127.0.0.1:" + targetPort + "/mcp\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
                                    await stream.WriteAsync(reply, stop.Token).ConfigureAwait(false);
                                }
                            }
                        }
                        catch (Exception e) when (e is OperationCanceledException || e is SocketException || e is IOException || e is ObjectDisposedException)
                        {
                        }
                    }, CancellationToken.None);
                    McpServerTestResponse result;
                    try
                    {
                        McpServer redirecting = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers", new McpServer { Name = "redirecting", Transport = McpTransportEnum.Http, Url = "http://127.0.0.1:" + redirectorPort }, 201, token).ConfigureAwait(false);
                        result = await HttpTestHelpers.SendAsync<McpServerTestResponse>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers/" + redirecting.Id + "/test", null, 200, token).ConfigureAwait(false);
                    }
                    finally
                    {
                        stop.Cancel();
                        target.Stop();
                        redirector.Stop();
                        await Task.WhenAll(countTarget, redirect).ConfigureAwait(false);
                    }
                    Assert.True(!result.Success, "A redirecting MCP server fails the test: " + result.Error);
                    Assert.Equal(0, Volatile.Read(ref targetHits), "The redirect target was never contacted");
                }
            }
        }

        private static async Task InfoFindingsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => s.Auth.RateLimitPerMinute = 3, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;

                // MCP test errors name the class of failure only: an internal service's error text is not echoed back.
                TcpListener internalService = new TcpListener(IPAddress.Loopback, 0);
                internalService.Start();
                int internalPort = ((IPEndPoint)internalService.LocalEndpoint).Port;
                Task serve = Task.Run(() => FakeMcpAsync(internalService, token), token);
                McpServerTestResponse failed;
                try
                {
                    McpServer chatty = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers", new McpServer { Name = "chatty", Transport = McpTransportEnum.Http, Url = "http://127.0.0.1:" + internalPort }, 201, token).ConfigureAwait(false);
                    failed = await HttpTestHelpers.SendAsync<McpServerTestResponse>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers/" + chatty.Id + "/test", null, 200, token).ConfigureAwait(false);
                }
                finally
                {
                    internalService.Stop();
                    await serve.ConfigureAwait(false);
                }
                Assert.True(!failed.Success && failed.Error != null && !failed.Error.Contains("INTERNAL-DETAIL", StringComparison.Ordinal) && failed.Error.StartsWith("The MCP", StringComparison.Ordinal), "No raw error text: " + failed.Error);

                // Run override rules default to Enum, so a rule without a validation needs its values.
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, t + "/agents", new Agent { Name = "override-agent" }, 201, token).ConfigureAwait(false);
                string rule = "{\"name\":\"override-default\",\"agentId\":\"" + agent.Id + "\",\"harnessProfileId\":\"hrn_builtin_fake\",\"allowedRunOverrides\":[{\"name\":\"model\"}]}";
                TestResponse loose = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, t + "/deployments", rule, token).ConfigureAwait(false);
                Assert.Equal(400, loose.StatusCode, "An override rule without a validation: " + loose.Body);

                // Remote agent endpoints on metadata addresses are refused.
                TestResponse remote = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, t + "/agents", new Agent { Name = "remote-metadata", Kind = AgentKindEnum.Remote, RemoteProtocol = RemoteProtocolEnum.A2A, RemoteEndpointUrl = "http://169.254.169.254/a2a" }, token).ConfigureAwait(false);
                Assert.Equal(400, remote.StatusCode, "Metadata remote endpoint: " + remote.Body);

                // A2A identifiers are read with a typed contract; a fractional id no longer fails the request.
                await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Put, t + "/agents/" + agent.Id, new Agent { Name = "override-agent", ExposeA2A = true }, 200, token).ConfigureAwait(false);
                TestResponse rpc = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/a2a/" + host.TenantId + "/override-agent", "{\"jsonrpc\":\"2.0\",\"id\":1.5,\"method\":\"NoSuchMethod\"}", token).ConfigureAwait(false);
                Assert.True(rpc.StatusCode < 500 && rpc.Body.Contains("1.5", StringComparison.Ordinal), "Fractional id answered as a JSON-RPC error: " + rpc.StatusCode + " " + rpc.Body);

                // A credential whose secret cannot be decrypted answers 401, not 500.
                User admin = (await host.Server.Context.Database.Users.ReadByEmailAsync(host.TenantId, "admin@garrison", token).ConfigureAwait(false))!;
                CredentialCreateResponse key = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "broken", UserId = admin.Id }, 201, token).ConfigureAwait(false);
                Credential stored = (await host.Server.Context.Database.Credentials.ReadAsync(host.TenantId, key.Credential.Id, token).ConfigureAwait(false))!;
                stored.SecretKeyEncrypted = new SecretCipher("another-master-key").Encrypt(key.SecretKey, stored.Id);
                await host.Server.Context.Database.Credentials.UpdateAsync(stored, token).ConfigureAwait(false);
                host.Server.Context.Authorization.Invalidate();
                using (HttpClient signed = new HttpClient())
                {
                    string date = DateTime.UtcNow.ToString("R", System.Globalization.CultureInfo.InvariantCulture);
                    using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, host.BaseUrl + "/v1.0/token/details"))
                    {
                        request.Headers.Add("x-access-key", key.AccessKey);
                        request.Headers.Add("x-signature", "00");
                        request.Headers.Add("x-date", date);
                        request.Headers.Add("x-nonce", Guid.NewGuid().ToString("N"));
                        HttpResponseMessage response = await signed.SendAsync(request, token).ConfigureAwait(false);
                        Assert.Equal(401, (int)response.StatusCode, "Unreadable credential secret");
                    }
                }

                // Failed key attempts are rate limited per source address (limit 3 per minute here; one failure is counted above).
                using (HttpClient wrong = new HttpClient())
                {
                    wrong.BaseAddress = new Uri(host.BaseUrl);
                    wrong.DefaultRequestHeaders.Add("x-api-key", "not-the-key");
                    List<int> statuses = new List<int>();
                    for (int i = 0; i < 4; i++) statuses.Add((await HttpTestHelpers.SendAsync(wrong, HttpMethod.Get, "/v1.0/api/tenants", null, token).ConfigureAwait(false)).StatusCode);
                    Assert.True(statuses.Take(2).All(s => s == 401), "First failures answer 401: " + String.Join(",", statuses));
                    Assert.Equal(429, statuses.Last(), "Later failures are rate limited: " + String.Join(",", statuses));
                    Assert.Equal(429, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants", null, token).ConfigureAwait(false)).StatusCode, "The address is throttled for the rest of the minute, even with the right key");
                }
            }
        }

        private static async Task FakeMcpAsync(TcpListener listener, CancellationToken token)
        {
            // Completes the MCP handshake, then answers tools/list with a JSON-RPC error whose text names an internal host.
            try
            {
                for (int i = 0; i < 16; i++)
                {
                    using (TcpClient client = await listener.AcceptTcpClientAsync(token).ConfigureAwait(false))
                    using (NetworkStream stream = client.GetStream())
                    {
                        byte[] buffer = new byte[65536];
                        int read = await stream.ReadAsync(buffer, token).ConfigureAwait(false);
                        string request = Encoding.UTF8.GetString(buffer, 0, read);
                        string status = "200 OK";
                        string body;
                        if (request.StartsWith("GET", StringComparison.Ordinal))
                        {
                            status = "405 Method Not Allowed";
                            body = String.Empty;
                        }
                        else if (request.Contains("\"initialize\"", StringComparison.Ordinal))
                        {
                            body = "{\"jsonrpc\":\"2.0\",\"id\":" + IdOf(request) + ",\"result\":{\"protocolVersion\":\"2025-03-26\",\"capabilities\":{\"tools\":{}},\"serverInfo\":{\"name\":\"internal\",\"version\":\"1\"}}}";
                        }
                        else if (request.Contains("notifications/", StringComparison.Ordinal))
                        {
                            status = "202 Accepted";
                            body = String.Empty;
                        }
                        else
                        {
                            body = "{\"jsonrpc\":\"2.0\",\"id\":" + IdOf(request) + ",\"error\":{\"code\":-32000,\"message\":\"INTERNAL-DETAIL db-7.internal:5432\"}}";
                        }
                        byte[] reply = Encoding.UTF8.GetBytes("HTTP/1.1 " + status + "\r\nContent-Type: application/json\r\nMcp-Session-Id: s1\r\nContent-Length: " + Encoding.UTF8.GetByteCount(body) + "\r\nConnection: close\r\n\r\n" + body);
                        await stream.WriteAsync(reply, token).ConfigureAwait(false);
                    }
                }
            }
            catch (Exception e) when (e is SocketException || e is ObjectDisposedException || e is OperationCanceledException || e is IOException)
            {
            }
        }

        private static string IdOf(string request)
        {
            int at = request.IndexOf("\"id\":", StringComparison.Ordinal);
            if (at < 0) return "1";
            int start = at + 5;
            int end = start;
            while (end < request.Length && request[end] != ',' && request[end] != '}') end++;
            return request.Substring(start, end - start).Trim();
        }

        private static async Task<string> LoginAsync(TestServerHost host, string email, string password, CancellationToken token)
        {
            using (HttpClient anonymous = new HttpClient())
            {
                string body = Serializer.Serialize(new { tenantId = host.TenantId, email, password });
                HttpResponseMessage response = await anonymous.PostAsync(host.BaseUrl + "/v1.0/token", new StringContent(body, Encoding.UTF8, "application/json"), token).ConfigureAwait(false);
                string text = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                if (response.StatusCode != HttpStatusCode.OK) throw new TestAssertionException("Login failed for " + email + ": " + text);
                return (Serializer.Deserialize<TokenResponse>(text) ?? throw new TestAssertionException("Empty token response.")).Token;
            }
        }

        private static HttpClient Bearer(TestServerHost host, string bearer)
        {
            HttpClient client = new HttpClient();
            client.BaseAddress = new Uri(host.BaseUrl);
            client.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearer);
            return client;
        }

        private static async Task SendTextAsync(ClientWebSocket socket, string text, CancellationToken token)
        {
            await socket.SendAsync(Encoding.UTF8.GetBytes(text), WebSocketMessageType.Text, true, token).ConfigureAwait(false);
        }

        private static async Task<string> ReceiveUntilAsync(ClientWebSocket socket, string marker, CancellationToken token)
        {
            using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                timeout.CancelAfter(TimeSpan.FromSeconds(15));
                byte[] buffer = new byte[65536];
                while (true)
                {
                    StringBuilder message = new StringBuilder();
                    WebSocketReceiveResult result;
                    do
                    {
                        result = await socket.ReceiveAsync(buffer, timeout.Token).ConfigureAwait(false);
                        message.Append(Encoding.UTF8.GetString(buffer, 0, result.Count));
                    }
                    while (!result.EndOfMessage);
                    string text = message.ToString();
                    if (text.Contains(marker, StringComparison.Ordinal)) return text;
                }
            }
        }

        #endregion
    }
}
