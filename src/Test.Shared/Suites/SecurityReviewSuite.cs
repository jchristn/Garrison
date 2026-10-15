namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net;
    using System.Net.Http;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Server.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Regression tests for the issues fixed by the P15.1 security review (docs/SECURITY_REVIEW.md): node protocol
    /// access for tenant administrators, credentials and password changes for system administrators, run-token retries,
    /// request body limits, request history redaction, the outbound address policy for MCP server tests and S3
    /// endpoints, and stdio MCP diagnostics in tenants that require Untrusted deployments.
    /// </summary>
    public static class SecurityReviewSuite
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
            unit.Add(new TestCaseDescriptor("security-unit", "history-redaction", "Request history redacts user, manifest apply, and settings bodies, and credential-like query values (SR-07)", ct => RedactionAsync()));
            unit.Add(new TestCaseDescriptor("security-unit", "outbound-address-policy", "Link-local, metadata, unspecified, and multicast addresses are refused in every encoding; loopback and private ranges are allowed (SR-08)", ct => AddressPolicyAsync(ct)));
            suites.Add(new TestSuiteDescriptor("security-unit", "Security review (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "security-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "node-protocol-tenant-admin", "A tenant administrator (user or TenantAdmin credential) cannot register as a worker node or lease runs; the NodeAgent credential still can (SR-01, " + provider + ")", ct => NodeProtocolAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "admin-escalation", "A SecurityAdmin cannot mint or rotate a credential for a system administrator or change their password (SR-02, " + provider + ")", ct => AdminEscalationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "run-token-retry", "A run token cannot retry a run, which would start a top-level run outside the delegation policy (SR-05, " + provider + ")", ct => RunTokenRetryAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "request-body-limit", "A request larger than Rest.MaxRequestBodyBytes is refused with 413 before authentication (SR-03, " + provider + ")", ct => BodyLimitAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "outbound-blocked", "An HTTP MCP server test to a metadata address fails fast without connecting, and an S3 endpoint on a link-local address is rejected (SR-08, " + provider + ")", ct => OutboundBlockedAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "stdio-test-untrusted-tenant", "A tenant that requires Untrusted deployments cannot run stdio MCP diagnostics on a worker host (SR-04, " + provider + ")", ct => StdioUntrustedAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Security review (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task RedactionAsync()
        {
            foreach (string path in new[] { "/v1.0/api/tenants/ten_1/users", "/v1.0/api/tenants/ten_1/users/usr_1", "/v1.0/api/tenants/ten_1/manifests/apply", "/v1.0/api/settings" })
            {
                Assert.True(RequestHistoryCaptureService.IsSecretRoute(path), path + " bodies should be redacted.");
            }
            Assert.True(!RequestHistoryCaptureService.IsSecretRoute("/v1.0/api/tenants/ten_1/agents"), "Agent route redacted.");

            string ws = RequestHistoryCaptureService.RedactQuery("/v1.0/ws?token=abc.def&tenantId=ten_1");
            Assert.Equal("/v1.0/ws?token=" + RequestHistoryCaptureService.Redacted + "&tenantId=ten_1", ws, "WebSocket token redacted, tenant kept");
            string ticket = RequestHistoryCaptureService.RedactQuery("/v1.0/api/artifact-download/art_1?ticket=xyz");
            Assert.Equal("/v1.0/api/artifact-download/art_1?ticket=" + RequestHistoryCaptureService.Redacted, ticket, "Artifact ticket redacted");
            Assert.Equal("/v1.0/api/runs?limit=5", RequestHistoryCaptureService.RedactQuery("/v1.0/api/runs?limit=5"), "Ordinary query kept");
            Assert.Equal("/v1.0/api/health", RequestHistoryCaptureService.RedactQuery("/v1.0/api/health"), "No query");
            return Task.CompletedTask;
        }

        private static async Task AddressPolicyAsync(CancellationToken token)
        {
            foreach (string blocked in new[] { "169.254.169.254", "169.254.1.1", "0.0.0.0", "224.0.0.1", "255.255.255.255", "fe80::1", "fd00:ec2::254", "::", "ff02::1", "::ffff:169.254.169.254" })
            {
                Assert.True(OutboundAddressPolicy.IsAlwaysBlocked(IPAddress.Parse(blocked)), blocked + " should be blocked.");
            }
            foreach (string allowed in new[] { "127.0.0.1", "10.0.0.5", "172.16.0.1", "192.168.1.10", "8.8.8.8", "::1", "fd12:3456::1" })
            {
                Assert.True(!OutboundAddressPolicy.IsAlwaysBlocked(IPAddress.Parse(allowed)), allowed + " should be allowed.");
            }
            foreach (string url in new[] { "http://169.254.169.254/latest/meta-data", "http://2852039166/", "http://0xA9FEA9FE/", "http://[fd00:ec2::254]/", "http://[::ffff:169.254.169.254]/" })
            {
                Assert.True(OutboundAddressPolicy.LiteralBlockedReason(new Uri(url)) != null, url + " should be refused.");
                Assert.True(await OutboundAddressPolicy.BlockedReasonAsync(new Uri(url), token).ConfigureAwait(false) != null, url + " should be refused after resolution.");
            }
            Assert.True(OutboundAddressPolicy.LiteralBlockedReason(new Uri("http://mcp.internal:8080/")) == null, "Names are not refused without resolution.");
            Assert.True(await OutboundAddressPolicy.BlockedReasonAsync(new Uri("http://127.0.0.1:8080/"), token).ConfigureAwait(false) == null, "Loopback allowed.");
            Assert.True(await OutboundAddressPolicy.BlockedReasonAsync(new Uri("http://localhost:8080/"), token).ConfigureAwait(false) == null, "A name resolving to loopback is allowed.");
        }

        private static async Task NodeProtocolAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Tenant other = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "node-other" }, 201, token).ConfigureAwait(false);
                User otherAdmin = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/users", new UserRequest { Email = "admin@other.example", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                CredentialCreateResponse tenantAdminKey = await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + other.Id + "/credentials", new CredentialRequest { Name = "other-admin-key", UserId = otherAdmin.Id, RoleName = BuiltInRoles.TenantAdmin }, 201, token).ConfigureAwait(false);

                NodeRegisterRequest register = new NodeRegisterRequest { Name = "rogue-node", MaxConcurrentRuns = 4 };
                using (HttpClient user = await host.UserClientAsync(otherAdmin.Email, "password123", other.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(user, HttpMethod.Post, "/v1.0/api/node/register", register, token).ConfigureAwait(false)).StatusCode, "Tenant administrator user registering a node");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(user, HttpMethod.Post, "/v1.0/api/node/lease", new NodeLeaseRequest { NodeId = "nod_any" }, token).ConfigureAwait(false)).StatusCode, "Tenant administrator user leasing");
                }
                using (HttpClient key = host.CredentialClient(tenantAdminKey.AccessKey, tenantAdminKey.SecretKey))
                {
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(key, HttpMethod.Post, "/v1.0/api/node/register", register, token).ConfigureAwait(false)).StatusCode, "TenantAdmin credential registering a node");
                }
                Assert.True(await host.Server.Context.Database.Nodes.ReadByNameAsync("rogue-node", token).ConfigureAwait(false) == null, "No node was registered by a tenant administrator.");

                using (HttpClient node = host.CredentialClient("access_garrison_node", "secret_garrison_node_change_me"))
                {
                    NodeRegisterResponse registered = await HttpTestHelpers.SendAsync<NodeRegisterResponse>(node, HttpMethod.Post, "/v1.0/api/node/register", new NodeRegisterRequest { Name = "real-node", MaxConcurrentRuns = 2 }, 200, token).ConfigureAwait(false);
                    Assert.True(!String.IsNullOrEmpty(registered.NodeId), "The NodeAgent credential registers.");
                }
            }
        }

        private static async Task AdminEscalationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                User admin = (await host.Server.Context.Database.Users.ReadByEmailAsync(host.TenantId, "admin@garrison", token).ConfigureAwait(false))!;
                User security = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "security@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, t + "/user-role-assignments", new AssignmentRequest { UserId = security.Id, RoleName = "SecurityAdmin" }, 201, token).ConfigureAwait(false);
                User member = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, t + "/users", new UserRequest { Email = "member@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                Credential adminKey = (await host.Server.Context.Database.Credentials.ListByUserAsync(host.TenantId, admin.Id, token).ConfigureAwait(false)).First();

                using (HttpClient client = await host.UserClientAsync(security.Email, "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    TestResponse mint = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "escalate", UserId = admin.Id, RoleName = BuiltInRoles.TenantAdmin }, token).ConfigureAwait(false);
                    Assert.Equal(400, mint.StatusCode, "Credential for a system administrator: " + mint.Body);
                    Assert.True(mint.Body.Contains("userId", StringComparison.Ordinal), "Error names userId: " + mint.Body);

                    TestResponse password = await HttpTestHelpers.SendAsync(client, HttpMethod.Put, t + "/users/" + admin.Id, new UserRequest { Password = "taken-over-1" }, token).ConfigureAwait(false);
                    Assert.Equal(400, password.StatusCode, "Password of a system administrator: " + password.Body);

                    TestResponse rotate = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, t + "/credentials/" + adminKey.Id + "/rotate", null, token).ConfigureAwait(false);
                    Assert.Equal(400, rotate.StatusCode, "Rotating a system administrator's credential: " + rotate.Body);

                    // Ordinary users are unaffected.
                    await HttpTestHelpers.SendAsync<CredentialCreateResponse>(client, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "member-key", UserId = member.Id }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<User>(client, HttpMethod.Put, t + "/users/" + member.Id, new UserRequest { Password = "new-password-1" }, 200, token).ConfigureAwait(false);
                }
                using (HttpClient login = await host.UserClientAsync("admin@garrison", "password", host.TenantId, token).ConfigureAwait(false))
                {
                    Assert.True(login.DefaultRequestHeaders.Authorization != null, "Administrator password unchanged.");
                }
                await HttpTestHelpers.SendAsync<CredentialCreateResponse>(host.AdminClient, HttpMethod.Post, t + "/credentials", new CredentialRequest { Name = "by-admin", UserId = admin.Id }, 201, token).ConfigureAwait(false);
            }
        }

        private static async Task RunTokenRetryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "retry-origin" }, token).ConfigureAwait(false);
                Deployment deployment = await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "retry-origin", AgentId = agent.Id, HarnessProfileId = "hrn_builtin_fake" }, token).ConfigureAwait(false);
                Run running = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, Status = RunStatusEnum.Running, CallerType = PrincipalTypeEnum.Administrator, LeaseEpoch = 1 }, token).ConfigureAwait(false);
                Run finished = await host.Server.Context.Database.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = agent.Id, AgentName = agent.Name, DeploymentId = deployment.Id, Status = RunStatusEnum.Succeeded, Outcome = RunOutcomeEnum.Succeeded, CallerType = PrincipalTypeEnum.Administrator, InputText = "again" }, token).ConfigureAwait(false);
                string bearer = await host.Server.Context.Authentication.IssueForRunAsync(running, 1, DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false);
                using (HttpClient run = new HttpClient())
                {
                    run.BaseAddress = new Uri(host.BaseUrl);
                    run.DefaultRequestHeaders.Add("Authorization", "Bearer " + bearer);
                    TestResponse retry = await HttpTestHelpers.SendAsync(run, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + finished.Id + "/retry", null, token).ConfigureAwait(false);
                    Assert.Equal(403, retry.StatusCode, "Run token retry: " + retry.Body);
                    Assert.True(retry.Body.Contains("RunTokenRetryNotAllowed", StringComparison.Ordinal), "Error code: " + retry.Body);
                    Assert.Equal(200, (await HttpTestHelpers.SendAsync(run, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + finished.Id, null, token).ConfigureAwait(false)).StatusCode, "The run token still reads runs.");
                }
                Run retried = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + finished.Id + "/retry", null, 201, token).ConfigureAwait(false);
                Assert.Equal(finished.Id, retried.RetryOfRunId, "Administrators still retry.");
            }
        }

        private static async Task BodyLimitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            Assert.Equal(134217728L, new Garrison.Server.Settings.RestSettings().MaxRequestBodyBytes, "Default limit");
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, s => s.Rest.MaxRequestBodyBytes = 1048576, token).ConfigureAwait(false))
            using (HttpClient anonymous = new HttpClient())
            {
                byte[] large = new byte[2 * 1048576];
                for (int i = 0; i < large.Length; i++) large[i] = (byte)'a';
                int status;
                try
                {
                    using (ByteArrayContent content = new ByteArrayContent(large))
                    {
                        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                        HttpResponseMessage response = await anonymous.PostAsync(host.BaseUrl + "/v1.0/token", content, token).ConfigureAwait(false);
                        status = (int)response.StatusCode;
                    }
                }
                catch (HttpRequestException)
                {
                    // The listener may close the connection once it has answered, before the client finishes sending.
                    status = 413;
                }
                Assert.Equal(413, status, "Oversized request");

                using (StringContent small = new StringContent(Serializer.Serialize(new { email = "admin@garrison", password = "password", tenantId = host.TenantId }), Encoding.UTF8, "application/json"))
                {
                    HttpResponseMessage ok = await anonymous.PostAsync(host.BaseUrl + "/v1.0/token", small, token).ConfigureAwait(false);
                    Assert.Equal(200, (int)ok.StatusCode, "A normal request still works");
                }
            }
        }

        private static async Task OutboundBlockedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string t = "/v1.0/api/tenants/" + host.TenantId;
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers", new McpServer { Name = "metadata", Transport = McpTransportEnum.Http, Url = "http://169.254.169.254" }, 201, token).ConfigureAwait(false);
                DateTime started = DateTime.UtcNow;
                McpServerTestResponse result = await HttpTestHelpers.SendAsync<McpServerTestResponse>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers/" + server.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(!result.Success, "Metadata test must fail.");
                Assert.True(result.Error != null && result.Error.Contains("link-local", StringComparison.Ordinal), "Refused by policy, not by a connection attempt: " + result.Error);
                Assert.True(DateTime.UtcNow - started < TimeSpan.FromSeconds(5), "Refused without waiting for a connection.");

                TestResponse store = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "metadata-store", Kind = ArtifactStoreKindEnum.S3, Bucket = "b", Endpoint = "http://169.254.169.254" }, token).ConfigureAwait(false);
                Assert.Equal(400, store.StatusCode, "Link-local S3 endpoint: " + store.Body);
                Assert.True(store.Body.Contains("endpoint", StringComparison.Ordinal), "Error names endpoint: " + store.Body);
                Secret s3 = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, t + "/secrets", new SecretRequest { Name = "minio-credential", Value = "{\"accessKey\":\"a\",\"secretKey\":\"b\"}" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<ArtifactStore>(host.AdminClient, HttpMethod.Post, t + "/artifact-stores", new ArtifactStore { Name = "minio-store", Kind = ArtifactStoreKindEnum.S3, Bucket = "b", Endpoint = "http://10.0.0.5:9000", SecretId = s3.Id }, 201, token).ConfigureAwait(false);
            }
        }

        private static async Task StdioUntrustedAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                Tenant strict = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "strict", RequireUntrustedDeployments = true }, 201, token).ConfigureAwait(false);
                string t = "/v1.0/api/tenants/" + strict.Id;
                McpServer server = await HttpTestHelpers.SendAsync<McpServer>(host.AdminClient, HttpMethod.Post, t + "/mcp-servers", new McpServer { Name = "local-tool", Transport = McpTransportEnum.Stdio, Command = "sh" }, 201, token).ConfigureAwait(false);
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, t + "/mcp-servers/" + server.Id + "/test?nodeId=nod_any", null, token).ConfigureAwait(false);
                Assert.Equal(400, response.StatusCode, "Stdio diagnostic in an Untrusted-only tenant: " + response.Body);
                ErrorResponse error = Serializer.Deserialize<ErrorResponse>(response.Body) ?? throw new TestAssertionException("Empty error body.");
                Assert.True(error.FieldCodes != null && error.FieldCodes.TryGetValue("transport", out string? code) && code == "StdioDiagnosticsRequireTrust", "Field code: " + response.Body);
            }
        }

        #endregion
    }
}
