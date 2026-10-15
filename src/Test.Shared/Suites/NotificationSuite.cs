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
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Notifications;
    using Garrison.Core.Requests;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.ProviderHarness;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Notifications (plan P12.14, D-054): the SSRF rules, endpoint validation and CRUD, tenant isolation, delivery of
    /// signed notifications to a local receiver on 127.0.0.1 (with Notifications.AllowPrivateDestinations turned on for
    /// that test only), payload contents and the opt-in result text, filters, retries with backoff and give-up rules, the
    /// delivery log, test sends, blocked destinations (loopback, link-local metadata, private ranges, rebinding names,
    /// redirects) with the setting off, single delivery across two replicas, manifests, and the MCP tools.
    /// </summary>
    public static class NotificationSuite
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
            unit.Add(new TestCaseDescriptor("notification-unit", "ssrf-rules", "Destination rules: schemes, user information, localhost, loopback, private, carrier-grade NAT, link-local metadata, multicast, reserved, IPv4-mapped and NAT64 IPv6, and what AllowPrivateDestinations changes", SsrfRulesAsync));
            suites.Add(new TestSuiteDescriptor("notification-unit", "Notifications (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "notifications-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "crud-validation", "CRUD by id and name, signing secret shown once, URL and event validation, filters, reference guards, RBAC, and tenant isolation (" + provider + ")", ct => CrudValidationAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delivery", "Run events reach a local receiver signed, with the documented headers and payload; result text only on opt-in; filters, inactive endpoints, and endpoints created later get nothing; the delivery log and test send (" + provider + ")", ct => DeliveryAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "retries", "Retries: 500 and 429 back off and succeed with the same body and delivery id, 410 and 302 fail at once, attempts run out, and backoff doubles up to the cap (" + provider + ")", ct => RetriesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "ssrf", "With private destinations off: loopback, 169.254.169.254, private ranges, a public name that resolves to loopback or link-local, and redirects are never reached (" + provider + ")", ct => SsrfAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "pipelines-replicas", "Pipeline events, and two replicas sweeping and dispatching at once deliver each notification once (" + provider + ")", ct => PipelinesReplicasAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifests-mcp", "Manifest kind NotificationEndpoint (apply, unchanged, export without secrets) and the management MCP tools (" + provider + ")", ct => ManifestsMcpAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "Notifications (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static string T(TestServerHost host)
        {
            return "/v1.0/api/tenants/" + host.TenantId;
        }

        private static void Code(TestResponse response, int status, string code, string what)
        {
            Assert.Equal(status, response.StatusCode, what + " status (" + response.Body + ")");
            Assert.True(response.Body.Contains(code, StringComparison.Ordinal), what + " answers " + code + ": " + response.Body);
        }

        private static NotificationEndpoint Endpoint(string name, string url, params NotificationEventEnum[] events)
        {
            NotificationEndpoint endpoint = new NotificationEndpoint();
            endpoint.Name = name;
            endpoint.Url = url;
            endpoint.Events = events.ToList();
            return endpoint;
        }

        private static Task<NotificationEndpoint> CreateAsync(TestServerHost host, NotificationEndpoint endpoint, CancellationToken token)
        {
            return HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", endpoint, 201, token);
        }

        private static async Task<TestCluster> ClusterAsync(DatabaseTypeEnum provider, bool allowPrivate, CancellationToken token)
        {
            TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false);
            TestServerHost host = cluster.Server;
            // The tests drive the sweep and the dispatcher themselves.
            host.Server.Context.Get<MaintenanceService>().Notifications = null;
            NotificationService notifications = host.Server.Context.Get<NotificationService>();
            await notifications.StopAsync().ConfigureAwait(false);
            notifications.Options.AllowPrivateDestinations = allowPrivate;
            notifications.Options.InitialBackoffSeconds = 1;
            notifications.Options.MaxBackoffSeconds = 2;
            notifications.Options.TimeoutSeconds = 5;
            return cluster;
        }

        private static async Task<Run> InvokeAsync(TestServerHost host, Agent agent, string input, CancellationToken token)
        {
            InvokeRequest request = new InvokeRequest();
            request.Input = input;
            request.Wait = true;
            request.WaitSeconds = 60;
            Run run = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Post, T(host) + "/agents/" + agent.Id + "/invoke", request, 200, token).ConfigureAwait(false);
            Assert.True(RunService.IsTerminal(run.Status), "Run " + run.Id + " finished (" + run.Status + ")");
            return run;
        }

        private static async Task SweepAndDispatchAsync(TestServerHost host, CancellationToken token)
        {
            NotificationService notifications = host.Server.Context.Get<NotificationService>();
            await notifications.SweepAsync(token).ConfigureAwait(false);
            await notifications.DispatchOnceAsync(token).ConfigureAwait(false);
        }

        private static async Task<List<NotificationDelivery>> DeliveriesAsync(TestServerHost host, NotificationEndpoint endpoint, CancellationToken token)
        {
            return (await HttpTestHelpers.SendAsync<EnumerationResult<NotificationDelivery>>(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + endpoint.Id + "/deliveries?maxResults=100", null, 200, token).ConfigureAwait(false)).Objects;
        }

        private static async Task<NotificationDelivery> WaitDeliveryAsync(TestServerHost host, NotificationEndpoint endpoint, Func<NotificationDelivery, bool> done, string what, CancellationToken token, int seconds = 30)
        {
            DateTime deadline = DateTime.UtcNow.AddSeconds(seconds);
            while (true)
            {
                await SweepAndDispatchAsync(host, token).ConfigureAwait(false);
                NotificationDelivery? match = (await DeliveriesAsync(host, endpoint, token).ConfigureAwait(false)).FirstOrDefault(done);
                if (match != null) return match;
                if (DateTime.UtcNow > deadline) throw new TestAssertionException("No delivery to " + endpoint.Name + " reached " + what + " in time.");
                await Task.Delay(200, token).ConfigureAwait(false);
            }
        }

        private static Task SsrfRulesAsync(CancellationToken token)
        {
            Dictionary<string, DestinationBlockReasonEnum> off = new Dictionary<string, DestinationBlockReasonEnum>
            {
                { "https://hooks.example.com/garrison", DestinationBlockReasonEnum.None },
                { "http://203.0.113.10:8080/x", DestinationBlockReasonEnum.None },
                { "https://[2001:db8::1]/x", DestinationBlockReasonEnum.None },
                { "ftp://example.com/x", DestinationBlockReasonEnum.Scheme },
                { "file:///etc/passwd", DestinationBlockReasonEnum.Scheme },
                { "https://user:pass@example.com/x", DestinationBlockReasonEnum.InvalidUrl },
                { "/relative", DestinationBlockReasonEnum.InvalidUrl },
                { "example.com/hook", DestinationBlockReasonEnum.InvalidUrl },
                { "", DestinationBlockReasonEnum.InvalidUrl },
                { "http://localhost:8700/x", DestinationBlockReasonEnum.Loopback },
                { "http://api.localhost/x", DestinationBlockReasonEnum.Loopback },
                { "http://127.0.0.1/x", DestinationBlockReasonEnum.Loopback },
                { "http://127.8.9.10/x", DestinationBlockReasonEnum.Loopback },
                { "http://[::1]/x", DestinationBlockReasonEnum.Loopback },
                { "http://169.254.169.254/latest/meta-data/", DestinationBlockReasonEnum.LinkLocal },
                { "http://[fe80::1]/x", DestinationBlockReasonEnum.LinkLocal },
                { "http://10.1.2.3/x", DestinationBlockReasonEnum.Private },
                { "http://172.16.0.1/x", DestinationBlockReasonEnum.Private },
                { "http://172.31.255.255/x", DestinationBlockReasonEnum.Private },
                { "http://172.32.0.1/x", DestinationBlockReasonEnum.None },
                { "http://192.168.1.1/x", DestinationBlockReasonEnum.Private },
                { "http://100.64.0.1/x", DestinationBlockReasonEnum.Private },
                { "http://[fd00::1]/x", DestinationBlockReasonEnum.Private },
                { "http://[::ffff:127.0.0.1]/x", DestinationBlockReasonEnum.Loopback },
                { "http://[::ffff:169.254.169.254]/x", DestinationBlockReasonEnum.LinkLocal },
                { "http://[64:ff9b::a9fe:a9fe]/x", DestinationBlockReasonEnum.LinkLocal },
                { "http://0.0.0.0/x", DestinationBlockReasonEnum.Reserved },
                { "http://224.0.0.1/x", DestinationBlockReasonEnum.Reserved },
                { "http://255.255.255.255/x", DestinationBlockReasonEnum.Reserved },
                { "http://[ff02::1]/x", DestinationBlockReasonEnum.Reserved },
                { "http://[::]/x", DestinationBlockReasonEnum.Reserved }
            };
            foreach (KeyValuePair<string, DestinationBlockReasonEnum> pair in off)
            {
                Assert.Equal(pair.Value, DestinationGuard.CheckUrl(pair.Key, false, out Uri? _), "Private off: " + pair.Key);
            }
            Assert.Equal(DestinationBlockReasonEnum.None, DestinationGuard.CheckUrl("http://127.0.0.1:9000/x", true, out Uri? _), "Private on allows loopback");
            Assert.Equal(DestinationBlockReasonEnum.None, DestinationGuard.CheckUrl("http://localhost/x", true, out Uri? _), "Private on allows localhost");
            Assert.Equal(DestinationBlockReasonEnum.None, DestinationGuard.CheckUrl("http://10.0.0.5/x", true, out Uri? _), "Private on allows private ranges");
            Assert.Equal(DestinationBlockReasonEnum.LinkLocal, DestinationGuard.CheckUrl("http://169.254.169.254/x", true, out Uri? _), "Link-local stays refused with private on");
            Assert.Equal(DestinationBlockReasonEnum.Reserved, DestinationGuard.CheckUrl("http://0.0.0.0/x", true, out Uri? _), "Reserved stays refused with private on");
            Assert.Equal(DestinationBlockReasonEnum.LinkLocal, DestinationGuard.CheckAddress(IPAddress.Parse("169.254.169.254"), true), "Resolved metadata address");
            Assert.Equal(DestinationBlockReasonEnum.None, DestinationGuard.CheckAddress(IPAddress.Parse("8.8.8.8"), false), "Public address");
            return Task.CompletedTask;
        }

        private static async Task CrudValidationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, false, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("notif-crud", "builtin/fake", null, token).ConfigureAwait(false);
                Agent other = await cluster.CreateAgentAsync("notif-crud-other", "builtin/fake", null, token).ConfigureAwait(false);
                Deployment otherDeployment = (await host.Server.Context.Database.Deployments.ListByAgentAsync(host.TenantId, other.Id, token).ConfigureAwait(false)).Single();

                NotificationEndpoint draft = Endpoint("ops-hook", "https://hooks.example.com/garrison", NotificationEventEnum.RunFailed, NotificationEventEnum.RunFailed, NotificationEventEnum.PipelineFailed);
                draft.Id = "nep_ignored";
                draft.AgentId = agent.Name;
                NotificationEndpoint created = await CreateAsync(host, draft, token).ConfigureAwait(false);
                Assert.True(created.Id.StartsWith(Constants.NotificationEndpointIdPrefix, StringComparison.Ordinal) && created.Id != "nep_ignored", "Identifier assigned");
                Assert.True(created.SigningSecret != null && created.SigningSecret.StartsWith("whsec_", StringComparison.Ordinal) && created.SigningSecretLast4 == created.SigningSecret.Substring(created.SigningSecret.Length - 4), "The secret is returned once");
                Assert.True(created.Events.Count == 2 && created.AgentId == agent.Id, "Duplicate events are removed and the agent name resolved");
                TestResponse read = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Name, null, token).ConfigureAwait(false);
                Assert.True(read.StatusCode == 200 && !read.Body.Contains(created.SigningSecret!, StringComparison.Ordinal) && !read.Body.Contains("signingSecret\"", StringComparison.Ordinal) && !read.Body.Contains("secretEncrypted", StringComparison.OrdinalIgnoreCase), "Reads never return the secret: " + read.Body);

                // Validation with private destinations off.
                foreach (string blocked in new List<string> { "http://127.0.0.1:8080/hook", "http://localhost/hook", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.8/hook", "http://192.168.0.2/hook", "http://[::1]/hook" })
                {
                    Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("blocked-" + Math.Abs(blocked.GetHashCode()), blocked, NotificationEventEnum.RunFailed), token).ConfigureAwait(false), 400, "DestinationBlocked", blocked);
                }
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("ftp-hook", "ftp://example.com/x", NotificationEventEnum.RunFailed), token).ConfigureAwait(false), 400, "InvalidUrl", "ftp scheme");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("no-events", "https://example.com/x"), token).ConfigureAwait(false), 400, "EventsRequired", "No events");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("test-event", "https://example.com/x", NotificationEventEnum.Test), token).ConfigureAwait(false), 400, "InvalidEvent", "Test is not subscribable");
                NotificationEndpoint missingAgent = Endpoint("missing-agent", "https://example.com/x", NotificationEventEnum.RunFailed);
                missingAgent.AgentId = "agt_missing";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", missingAgent, token).ConfigureAwait(false), 400, "ReferenceNotFound", "Unknown agent filter");
                NotificationEndpoint mismatch = Endpoint("mismatch", "https://example.com/x", NotificationEventEnum.RunFailed);
                mismatch.AgentId = agent.Id;
                mismatch.DeploymentId = otherDeployment.Id;
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", mismatch, token).ConfigureAwait(false), 400, "DeploymentAgentMismatch", "Deployment of another agent");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("ops-hook", "https://example.com/x", NotificationEventEnum.RunFailed), token).ConfigureAwait(false), 409, "NameConflict", "Duplicate name");

                // Update keeps the secret; rotation replaces it.
                NotificationEndpoint edit = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Id, null, 200, token).ConfigureAwait(false);
                edit.Url = "https://hooks.example.org/v2";
                edit.ResultTextMaxChars = 99999;
                NotificationEndpoint updated = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Put, T(host) + "/notification-endpoints/" + created.Id, edit, 200, token).ConfigureAwait(false);
                Assert.True(updated.Url == "https://hooks.example.org/v2" && updated.SigningSecretLast4 == created.SigningSecretLast4 && updated.SigningSecret == null && updated.ResultTextMaxChars == 16000, "Update keeps the secret and clamps resultTextMaxChars");
                edit.Url = "http://127.0.0.1/x";
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, T(host) + "/notification-endpoints/" + created.Id, edit, token).ConfigureAwait(false), 400, "DestinationBlocked", "Update to a blocked URL");
                NotificationEndpoint rotated = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + created.Id + "/rotate-secret", null, 200, token).ConfigureAwait(false);
                Assert.True(rotated.SigningSecret != null && rotated.SigningSecret != created.SigningSecret, "Rotation returns a new secret once");

                // Filters guard their agent and deployment.
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + agent.Id, null, token).ConfigureAwait(false), 409, "ReferencedByNotificationEndpoint", "Deleting a filtered agent");
                NotificationEndpoint byDeployment = Endpoint("by-deployment", "https://example.com/x", NotificationEventEnum.RunSucceeded);
                byDeployment.DeploymentId = otherDeployment.Name;
                NotificationEndpoint byDeploymentCreated = await CreateAsync(host, byDeployment, token).ConfigureAwait(false);
                Assert.Equal(otherDeployment.Id, byDeploymentCreated.DeploymentId, "Deployment filter given as a name");
                Code(await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/agents/" + other.Id, null, token).ConfigureAwait(false), 409, "ReferencedByNotificationEndpoint", "Deleting the agent of a filtered deployment");

                // RBAC and isolation.
                User viewer = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, T(host) + "/users", new UserRequest { Email = "notif-viewer@example.com", Password = "password123" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, T(host) + "/user-role-assignments", new AssignmentRequest { UserId = viewer.Id, RoleName = "Viewer" }, 201, token).ConfigureAwait(false);
                using (HttpClient client = await host.UserClientAsync("notif-viewer@example.com", "password123", host.TenantId, token).ConfigureAwait(false))
                {
                    await HttpTestHelpers.SendAsync<NotificationEndpoint>(client, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Id, null, 200, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<EnumerationResult<NotificationDelivery>>(client, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Id + "/deliveries", null, 200, token).ConfigureAwait(false);
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/notification-endpoints", Endpoint("viewer-made", "https://example.com/x", NotificationEventEnum.RunFailed), token).ConfigureAwait(false)).StatusCode, "Viewers cannot create");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Post, T(host) + "/notification-endpoints/" + created.Id + "/test", null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot send tests");
                    Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Delete, T(host) + "/notification-endpoints/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Viewers cannot delete");
                }
                Tenant otherTenant = await HttpTestHelpers.SendAsync<Tenant>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants", new TenantRequest { Name = "Notifications Other" }, 201, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/users", new UserRequest { Email = "notif-outsider@example.com", Password = "password123", IsTenantAdmin = true }, 201, token).ConfigureAwait(false);
                using (HttpClient outsider = await host.UserClientAsync("notif-outsider@example.com", "password123", otherTenant.Id, token).ConfigureAwait(false))
                {
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's endpoint by its path");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/notification-endpoints/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Another tenant's endpoint through their own tenant");
                    Assert.Equal(404, (await HttpTestHelpers.SendAsync(outsider, HttpMethod.Post, "/v1.0/api/tenants/" + otherTenant.Id + "/notification-endpoints/" + created.Id + "/test", null, token).ConfigureAwait(false)).StatusCode, "Cannot test another tenant's endpoint");
                    Assert.Equal(0, (await HttpTestHelpers.SendAsync<EnumerationResult<NotificationEndpoint>>(outsider, HttpMethod.Get, "/v1.0/api/tenants/" + otherTenant.Id + "/notification-endpoints", null, 200, token).ConfigureAwait(false)).Objects.Count, "Other tenants list none");
                }

                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/notification-endpoints/" + created.Name, null, token).ConfigureAwait(false)).StatusCode, "Delete by name");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Deleted");
                List<AuditRecord> audit = (await host.Server.Context.Database.Audit.EnumerateAsync(host.TenantId, new EnumerationQuery { MaxResults = 1000 }, token).ConfigureAwait(false)).Objects;
                Assert.True(audit.Any(a => a.ResourceType == "NotificationEndpoint" && a.ResourceId == created.Id && a.EventType == AuditEventTypeEnum.SigningSecretRotated), "Rotation is audited");
                Assert.True(audit.Any(a => a.ResourceType == "NotificationEndpoint" && a.ResourceId == created.Id && a.Description != null && a.Description.StartsWith("Deleted", StringComparison.Ordinal)), "Deletion is audited");
            }
        }

        private static async Task DeliveryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestCluster cluster = await ClusterAsync(provider, true, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                Agent agent = await cluster.CreateAgentAsync("notif-runs", "builtin/fake", null, token).ConfigureAwait(false);
                Agent failing = await cluster.CreateAgentAsync("notif-fails", "builtin/fake", null, token, d => d.Parameters.Add(new DeploymentParameter { Name = "fail", Value = "true" })).ConfigureAwait(false);
                Agent quiet = await cluster.CreateAgentAsync("notif-quiet", "builtin/fake", null, token).ConfigureAwait(false);

                NotificationEndpoint all = await CreateAsync(host, Endpoint("all-runs", receiver.BaseUrl + "/all", NotificationEventEnum.RunSucceeded, NotificationEventEnum.RunFailed), token).ConfigureAwait(false);
                NotificationEndpoint withText = Endpoint("with-text", receiver.BaseUrl + "/text", NotificationEventEnum.RunSucceeded);
                withText.IncludeResultText = true;
                withText.ResultTextMaxChars = 10;
                withText.AgentId = agent.Id;
                withText = await CreateAsync(host, withText, token).ConfigureAwait(false);
                NotificationEndpoint failuresOnly = await CreateAsync(host, Endpoint("failures-only", receiver.BaseUrl + "/failures", NotificationEventEnum.RunFailed), token).ConfigureAwait(false);
                NotificationEndpoint inactive = Endpoint("inactive", receiver.BaseUrl + "/inactive", NotificationEventEnum.RunSucceeded, NotificationEventEnum.RunFailed);
                inactive.Active = false;
                inactive = await CreateAsync(host, inactive, token).ConfigureAwait(false);

                Run succeeded = await InvokeAsync(host, agent, "Say something long enough to be cut short", token).ConfigureAwait(false);
                Run failed = await InvokeAsync(host, failing, "Fail please", token).ConfigureAwait(false);
                Run otherAgent = await InvokeAsync(host, quiet, "Quiet run", token).ConfigureAwait(false);
                Assert.True(succeeded.Status == RunStatusEnum.Succeeded && failed.Status == RunStatusEnum.Failed && otherAgent.Status == RunStatusEnum.Succeeded, "Run outcomes (" + succeeded.Status + ", " + failed.Status + ")");

                List<WebhookReceipt> received = new List<WebhookReceipt>();
                DateTime deadline = DateTime.UtcNow.AddSeconds(30);
                while (receiver.For("/all").Count < 3 || receiver.For("/text").Count < 1 || receiver.For("/failures").Count < 1)
                {
                    if (DateTime.UtcNow > deadline) throw new TestAssertionException("Notifications did not arrive: all " + receiver.For("/all").Count + ", text " + receiver.For("/text").Count + ", failures " + receiver.For("/failures").Count);
                    await SweepAndDispatchAsync(host, token).ConfigureAwait(false);
                    await Task.Delay(200, token).ConfigureAwait(false);
                }
                await SweepAndDispatchAsync(host, token).ConfigureAwait(false);

                List<WebhookReceipt> allReceipts = receiver.For("/all");
                Assert.Equal(3, allReceipts.Count, "The unfiltered endpoint got the three runs once each");
                foreach (WebhookReceipt receipt in allReceipts)
                {
                    Assert.Equal(WebhookSignatureResultEnum.Valid, WebhookSigner.Verify(receipt.Signature, all.SigningSecret, receipt.Body, DateTime.UtcNow, 300), "The notification is signed with the endpoint secret");
                    Assert.True(receipt.ContentType != null && receipt.ContentType.StartsWith("application/json", StringComparison.Ordinal), "JSON body");
                    NotificationPayload payload = Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receipt.Body))!;
                    Assert.True(payload.Id == receipt.Delivery && payload.Event.ToString() == receipt.Event && payload.EndpointId == all.Id && payload.TenantId == host.TenantId && payload.Run != null, "Headers and payload agree");
                    Assert.True(payload.Run!.ResultText == null && payload.Link != null && payload.Link.EndsWith("/runs/" + payload.Run.Id, StringComparison.Ordinal), "No result text by default, and a link");
                    string text = Encoding.UTF8.GetString(receipt.Body);
                    Assert.True(!text.Contains("inputText", StringComparison.Ordinal) && !text.Contains("Say something", StringComparison.Ordinal) && !text.Contains("Echo", StringComparison.Ordinal), "No input or output in the payload: " + text);
                }
                NotificationPayload failedPayload = allReceipts.Select(r => Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(r.Body))!).Single(p => p.Run!.Id == failed.Id);
                Assert.True(failedPayload.Event == NotificationEventEnum.RunFailed && failedPayload.Run!.Status == RunStatusEnum.Failed && failedPayload.Run.AgentName == failing.Name, "RunFailed carries the failed run");

                WebhookReceipt textReceipt = receiver.For("/text").Single();
                NotificationPayload textPayload = Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(textReceipt.Body))!;
                Assert.True(textPayload.Run!.Id == succeeded.Id && textPayload.Run.ResultText != null && textPayload.Run.ResultText.Length == 10 && textPayload.Run.ResultTruncated == true, "Opt-in result text is cut to resultTextMaxChars");
                Assert.Equal(failed.Id, Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(receiver.For("/failures").Single().Body))!.Run!.Id, "The RunFailed endpoint got only the failure");
                Assert.Equal(0, receiver.For("/inactive").Count, "Inactive endpoints get nothing");

                // The delivery log.
                List<NotificationDelivery> log = await DeliveriesAsync(host, all, token).ConfigureAwait(false);
                Assert.True(log.Count == 3 && log.All(d => d.Status == NotificationDeliveryStatusEnum.Succeeded && d.Attempts == 1 && d.LastStatusCode == 200 && d.DeliveredUtc.HasValue && !d.NextAttemptUtc.HasValue), "Delivery log entries succeeded");
                NotificationDelivery one = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + all.Id + "/deliveries/" + log[0].Id, null, 200, token).ConfigureAwait(false);
                Assert.True(one.Payload.Contains(log[0].Id, StringComparison.Ordinal), "A delivery carries its payload");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + withText.Id + "/deliveries/" + log[0].Id, null, token).ConfigureAwait(false)).StatusCode, "A delivery is read through its own endpoint");
                Assert.Equal(1, (await HttpTestHelpers.SendAsync<EnumerationResult<NotificationDelivery>>(host.AdminClient, HttpMethod.Get, T(host) + "/notification-endpoints/" + failuresOnly.Id + "/deliveries?status=Succeeded", null, 200, token).ConfigureAwait(false)).Objects.Count, "Status filter");

                // An endpoint created now never receives events from before it existed.
                NotificationEndpoint late = await CreateAsync(host, Endpoint("late", receiver.BaseUrl + "/late", NotificationEventEnum.RunSucceeded, NotificationEventEnum.RunFailed), token).ConfigureAwait(false);
                await SweepAndDispatchAsync(host, token).ConfigureAwait(false);
                Assert.Equal(0, receiver.For("/late").Count, "Late endpoints get no history");

                // Test send.
                NotificationDelivery test = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + late.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(test.Event == NotificationEventEnum.Test && test.Status == NotificationDeliveryStatusEnum.Succeeded && test.LastStatusCode == 200, "Test send succeeded (" + test.Status + ": " + test.LastError + ")");
                WebhookReceipt testReceipt = receiver.For("/late").Single();
                Assert.True(testReceipt.Event == "Test" && WebhookSigner.Verify(testReceipt.Signature, late.SigningSecret, testReceipt.Body, DateTime.UtcNow, 300) == WebhookSignatureResultEnum.Valid, "The test notification is signed");
                NotificationDelivery inactiveTest = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + inactive.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.Equal(NotificationDeliveryStatusEnum.Succeeded, inactiveTest.Status, "Tests reach inactive endpoints too");

                // Rotation: later deliveries are signed with the new secret.
                NotificationEndpoint rotated = await HttpTestHelpers.SendAsync<NotificationEndpoint>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + late.Id + "/rotate-secret", null, 200, token).ConfigureAwait(false);
                await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + late.Id + "/test", null, 200, token).ConfigureAwait(false);
                WebhookReceipt afterRotation = receiver.For("/late").Last();
                Assert.True(WebhookSigner.Verify(afterRotation.Signature, rotated.SigningSecret, afterRotation.Body, DateTime.UtcNow, 300) == WebhookSignatureResultEnum.Valid && WebhookSigner.Verify(afterRotation.Signature, late.SigningSecret, afterRotation.Body, DateTime.UtcNow, 300) == WebhookSignatureResultEnum.Mismatch, "Signed with the new secret only");

                // Deleting an endpoint drops its log.
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, T(host) + "/notification-endpoints/" + all.Id, null, token).ConfigureAwait(false)).StatusCode, "Delete");
                Assert.True(await host.Server.Context.Database.NotificationDeliveries.ReadAsync(host.TenantId, log[0].Id, token).ConfigureAwait(false) == null, "Deliveries of a deleted endpoint are gone");
            }
        }

        private static async Task RetriesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestCluster cluster = await ClusterAsync(provider, true, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                notifications.Options.InitialBackoffSeconds = 10;
                notifications.Options.MaxBackoffSeconds = 25;
                Assert.Equal(TimeSpan.FromSeconds(10), notifications.Backoff(1), "First backoff");
                Assert.Equal(TimeSpan.FromSeconds(20), notifications.Backoff(2), "Doubles");
                Assert.Equal(TimeSpan.FromSeconds(25), notifications.Backoff(3), "Capped");
                notifications.Options.InitialBackoffSeconds = 1;
                notifications.Options.MaxBackoffSeconds = 1;

                // 500 and 429 are retried; the same body and delivery identifier arrive every time.
                receiver.Script("/flaky", 500, 429);
                NotificationEndpoint flaky = await CreateAsync(host, Endpoint("flaky", receiver.BaseUrl + "/flaky", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery first = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + flaky.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(first.Status == NotificationDeliveryStatusEnum.Pending && first.Attempts == 1 && first.LastStatusCode == 500 && first.NextAttemptUtc.HasValue, "A 500 is retried later (" + first.Status + ")");
                NotificationDelivery done = await WaitDeliveryAsync(host, flaky, d => d.Id == first.Id && d.Status == NotificationDeliveryStatusEnum.Succeeded, "Succeeded", token).ConfigureAwait(false);
                Assert.True(done.Attempts == 3 && done.LastStatusCode == 200 && done.LastError == null, "Succeeded on the third attempt (" + done.Attempts + ")");
                List<WebhookReceipt> attempts = receiver.For("/flaky");
                Assert.True(attempts.Count == 3 && attempts.All(a => a.Delivery == first.Id) && attempts.Select(a => Encoding.UTF8.GetString(a.Body)).Distinct().Count() == 1, "Every attempt sends the same delivery");
                Assert.True(attempts.Select(a => a.Signature).Distinct().Count() >= 1 && attempts.All(a => WebhookSigner.Verify(a.Signature, flaky.SigningSecret, a.Body, DateTime.UtcNow, 300) == WebhookSignatureResultEnum.Valid), "Every attempt is signed");

                // A 4xx other than 408 and 429 fails at once; so does a redirect, which is not followed.
                receiver.Script("/gone", 410);
                NotificationEndpoint gone = await CreateAsync(host, Endpoint("gone", receiver.BaseUrl + "/gone", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery goneDelivery = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + gone.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(goneDelivery.Status == NotificationDeliveryStatusEnum.Failed && goneDelivery.Attempts == 1 && goneDelivery.LastStatusCode == 410 && goneDelivery.LastError != null, "410 is not retried");
                NotificationEndpoint redirect = await CreateAsync(host, Endpoint("redirect", receiver.BaseUrl + "/redirect", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery redirected = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + redirect.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(redirected.Status == NotificationDeliveryStatusEnum.Failed && redirected.LastStatusCode == 302 && redirected.LastError!.Contains("redirect", StringComparison.Ordinal), "A redirect fails (" + redirected.LastError + ")");
                Assert.Equal(0, receiver.For("/redirect-target").Count, "The redirect target is never reached");

                // Attempts run out.
                notifications.Options.MaxAttempts = 2;
                receiver.Script("/down", 503, 503, 503);
                NotificationEndpoint down = await CreateAsync(host, Endpoint("down", receiver.BaseUrl + "/down", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery downFirst = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + down.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.Equal(2, downFirst.MaxAttempts, "MaxAttempts is fixed when queued");
                NotificationDelivery gaveUp = await WaitDeliveryAsync(host, down, d => d.Id == downFirst.Id && d.Status == NotificationDeliveryStatusEnum.Failed, "Failed", token).ConfigureAwait(false);
                Assert.True(gaveUp.Attempts == 2 && gaveUp.LastStatusCode == 503 && gaveUp.LastError!.Contains("Gave up", StringComparison.Ordinal) && !gaveUp.NextAttemptUtc.HasValue, "Gave up after MaxAttempts (" + gaveUp.LastError + ")");
                Assert.Equal(2, receiver.For("/down").Count, "Exactly MaxAttempts attempts");

                // A connection that is refused is retried.
                int closedPort = TestServerHost.FreePort();
                NotificationEndpoint refused = await CreateAsync(host, Endpoint("refused", "http://127.0.0.1:" + closedPort + "/x", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery refusedDelivery = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + refused.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(refusedDelivery.Status == NotificationDeliveryStatusEnum.Pending && refusedDelivery.LastStatusCode == null && refusedDelivery.LastError != null, "A refused connection is retried (" + refusedDelivery.LastError + ")");
            }
        }

        private static async Task SsrfAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestCluster cluster = await ClusterAsync(provider, true, token).ConfigureAwait(false))
            {
                TestServerHost host = cluster.Server;
                NotificationService notifications = host.Server.Context.Get<NotificationService>();
                // Saved while private destinations were allowed, then the operator turns them off.
                NotificationEndpoint loopback = await CreateAsync(host, Endpoint("loopback", receiver.BaseUrl + "/loopback", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationEndpoint named = await CreateAsync(host, Endpoint("localhost-name", "http://localhost:" + receiver.Port + "/named", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                notifications.Options.AllowPrivateDestinations = false;

                foreach (NotificationEndpoint endpoint in new List<NotificationEndpoint> { loopback, named })
                {
                    NotificationDelivery delivery = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + endpoint.Id + "/test", null, 200, token).ConfigureAwait(false);
                    Assert.True(delivery.Status == NotificationDeliveryStatusEnum.Failed && delivery.LastStatusCode == null && delivery.LastError!.Contains("Loopback", StringComparison.Ordinal), endpoint.Name + " is refused (" + delivery.LastError + ")");
                }

                // DNS rebinding: a public-looking name that resolves to a refused address is refused at connect time.
                Dictionary<string, IPAddress> dns = new Dictionary<string, IPAddress>(StringComparer.OrdinalIgnoreCase)
                {
                    { "rebind-loopback.example", IPAddress.Loopback },
                    { "rebind-metadata.example", IPAddress.Parse("169.254.169.254") },
                    { "rebind-private.example", IPAddress.Parse("10.20.30.40") }
                };
                notifications.Resolver = (host2, ct) => Task.FromResult(dns.TryGetValue(host2, out IPAddress? address) ? new IPAddress[] { address } : Array.Empty<IPAddress>());
                foreach (KeyValuePair<string, IPAddress> entry in dns)
                {
                    NotificationEndpoint endpoint = await CreateAsync(host, Endpoint(entry.Key.Replace(".", "-", StringComparison.Ordinal), "http://" + entry.Key + ":" + receiver.Port + "/rebind", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                    NotificationDelivery delivery = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + endpoint.Id + "/test", null, 200, token).ConfigureAwait(false);
                    Assert.True(delivery.Status == NotificationDeliveryStatusEnum.Failed && delivery.LastError!.Contains("refused", StringComparison.Ordinal), entry.Key + " resolving to " + entry.Value + " is refused at connect time (" + delivery.Status + ": " + delivery.LastError + ")");
                }
                NotificationEndpoint unresolved = await CreateAsync(host, Endpoint("unresolved", "http://nowhere.example:" + receiver.Port + "/x", NotificationEventEnum.RunSucceeded), token).ConfigureAwait(false);
                NotificationDelivery unresolvedDelivery = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + unresolved.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(unresolvedDelivery.Status == NotificationDeliveryStatusEnum.Pending && unresolvedDelivery.LastError!.Contains("did not resolve", StringComparison.Ordinal), "A name that does not resolve is retried (" + unresolvedDelivery.LastError + ")");

                // With the setting back on, the same rebinding name to loopback is delivered; metadata stays refused.
                notifications.Options.AllowPrivateDestinations = true;
                NotificationEndpoint rebindAllowed = (await host.Server.Context.Database.NotificationEndpoints.ReadByNameAsync(host.TenantId, "rebind-loopback-example", token).ConfigureAwait(false))!;
                NotificationDelivery allowed = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + rebindAllowed.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(allowed.Status == NotificationDeliveryStatusEnum.Succeeded, "Loopback through a name is delivered when private destinations are allowed (" + allowed.LastError + ")");
                NotificationEndpoint metadata = (await host.Server.Context.Database.NotificationEndpoints.ReadByNameAsync(host.TenantId, "rebind-metadata-example", token).ConfigureAwait(false))!;
                NotificationDelivery stillBlocked = await HttpTestHelpers.SendAsync<NotificationDelivery>(host.AdminClient, HttpMethod.Post, T(host) + "/notification-endpoints/" + metadata.Id + "/test", null, 200, token).ConfigureAwait(false);
                Assert.True(stillBlocked.Status == NotificationDeliveryStatusEnum.Failed && stillBlocked.LastError!.Contains("LinkLocal", StringComparison.Ordinal), "Metadata addresses stay refused (" + stillBlocked.LastError + ")");
                notifications.Resolver = null!;

                Assert.Equal(1, receiver.For("/rebind").Count, "Only the allowed delivery reached the receiver");
                Assert.Equal(0, receiver.For("/loopback").Count + receiver.For("/named").Count, "Refused destinations were never reached");
            }
        }

        private static async Task PipelinesReplicasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (FakeWebhookReceiver receiver = new FakeWebhookReceiver())
            await using (TestReplicaCluster cluster = await TestReplicaCluster.StartAsync(provider, 2, Garrison.Server.Backplane.BackplaneModeEnum.Auto, null, token).ConfigureAwait(false))
            {
                foreach (TestServerHost replica in cluster.Replicas)
                {
                    replica.Server.Context.Get<MaintenanceService>().Notifications = null;
                    NotificationService service = replica.Server.Context.Get<NotificationService>();
                    await service.StopAsync().ConfigureAwait(false);
                    service.Options.AllowPrivateDestinations = true;
                }
                await cluster.AddWorkerAsync(0, null, token).ConfigureAwait(false);
                TestServerHost a = cluster.Replicas[0];
                TestServerHost b = cluster.Replicas[1];
                string t = "/v1.0/api/tenants/" + cluster.TenantId;
                Agent agent = await cluster.CreateAgentAsync(0, "notif-replicas", null, token).ConfigureAwait(false);
                NotificationEndpoint endpoint = await HttpTestHelpers.SendAsync<NotificationEndpoint>(a.AdminClient, HttpMethod.Post, t + "/notification-endpoints", Endpoint("replicated", receiver.BaseUrl + "/replicated", NotificationEventEnum.RunSucceeded, NotificationEventEnum.PipelineCompleted, NotificationEventEnum.PipelineFailed), 201, token).ConfigureAwait(false);
                NotificationEndpoint filtered = Endpoint("filtered", receiver.BaseUrl + "/filtered", NotificationEventEnum.PipelineCompleted, NotificationEventEnum.RunSucceeded);
                filtered.AgentId = agent.Id;
                filtered = await HttpTestHelpers.SendAsync<NotificationEndpoint>(a.AdminClient, HttpMethod.Post, t + "/notification-endpoints", filtered, 201, token).ConfigureAwait(false);

                Pipeline pipeline = new Pipeline { Name = "notif-pipeline" };
                pipeline.Stages.Add(new PipelineStage { Name = "only", AgentId = agent.Id });
                Pipeline created = await HttpTestHelpers.SendAsync<Pipeline>(a.AdminClient, HttpMethod.Post, t + "/pipelines", pipeline, 201, token).ConfigureAwait(false);
                PipelineRun run = await HttpTestHelpers.SendAsync<PipelineRun>(a.AdminClient, HttpMethod.Post, t + "/pipelines/" + created.Id + "/start", new PipelineStartRequest { Input = "Notify me", Wait = true, WaitSeconds = 60 }, 201, token).ConfigureAwait(false);
                Assert.Equal(PipelineRunStatusEnum.Succeeded, run.Status, "The pipeline run succeeded");

                // Both replicas sweep and dispatch at the same time, repeatedly.
                for (int i = 0; i < 4; i++)
                {
                    List<Task> work = new List<Task>();
                    foreach (TestServerHost replica in cluster.Replicas)
                    {
                        NotificationService service = replica.Server.Context.Get<NotificationService>();
                        work.Add(service.SweepAsync(token));
                    }
                    await Task.WhenAll(work).ConfigureAwait(false);
                    work.Clear();
                    foreach (TestServerHost replica in cluster.Replicas)
                    {
                        NotificationService service = replica.Server.Context.Get<NotificationService>();
                        work.Add(service.DispatchOnceAsync(token));
                        work.Add(service.DispatchOnceAsync(token));
                    }
                    await Task.WhenAll(work).ConfigureAwait(false);
                }

                List<WebhookReceipt> received = await receiver.WaitForAsync("/replicated", 2, 30, token).ConfigureAwait(false);
                await Task.Delay(500, token).ConfigureAwait(false);
                received = receiver.For("/replicated");
                List<NotificationPayload> payloads = received.Select(r => Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(r.Body))!).ToList();
                Assert.Equal(2, received.Count, "One stage run notification and one pipeline notification, each once (" + String.Join(", ", payloads.Select(p => p.Event)) + ")");
                Assert.Equal(received.Count, received.Select(r => r.Delivery).Distinct().Count(), "No delivery was sent twice");
                NotificationPayload completed = payloads.Single(p => p.Event == NotificationEventEnum.PipelineCompleted);
                Assert.True(completed.PipelineRun != null && completed.PipelineRun.Id == run.Id && completed.PipelineRun.PipelineName == "notif-pipeline" && completed.Link!.EndsWith("/pipeline-runs/" + run.Id, StringComparison.Ordinal), "PipelineCompleted payload");
                Assert.True(payloads.Single(p => p.Event == NotificationEventEnum.RunSucceeded).Run!.PipelineRunId == run.Id, "The stage run notification names its pipeline run");

                List<NotificationPayload> filteredPayloads = receiver.For("/filtered").Select(r => Serializer.Deserialize<NotificationPayload>(Encoding.UTF8.GetString(r.Body))!).ToList();
                Assert.True(filteredPayloads.Count == 1 && filteredPayloads[0].Event == NotificationEventEnum.RunSucceeded, "A filtered endpoint gets its agent's run but no pipeline event");
            }
        }

        private static async Task ManifestsMcpAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await ClusterAsync(provider, false, token).ConfigureAwait(false))
            using (TestMcpClient client = new TestMcpClient())
            {
                TestServerHost host = cluster.Server;
                await cluster.CreateAgentAsync("manifest-notified", "builtin/fake", null, token).ConfigureAwait(false);
                string secret = "whsec_endpoint_secret_9876543210";
                string yaml = String.Join("\n",
                    "apiVersion: garrison/v1",
                    "kind: NotificationEndpoint",
                    "metadata:",
                    "  name: manifest-endpoint",
                    "spec:",
                    "  url: https://hooks.example.com/garrison",
                    "  events: [RunFailed, PipelineFailed]",
                    "  agent: manifest-notified",
                    "  includeResultText: true",
                    "  signingSecret: " + secret);
                ManifestApply applied = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", yaml, 200, token).ConfigureAwait(false);
                Assert.Equal(1, applied.CreatedCount, "Apply creates the endpoint");
                NotificationEndpoint stored = (await host.Server.Context.Database.NotificationEndpoints.ReadByNameAsync(host.TenantId, "manifest-endpoint", token).ConfigureAwait(false))!;
                Assert.True(stored.Events.Count == 2 && stored.IncludeResultText && stored.SigningSecretLast4 == "3210" && SigningSecrets.Read(stored, host.Server.Context.Cipher) == secret, "Endpoint from the manifest with its secret");
                ManifestApply again = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", yaml, 200, token).ConfigureAwait(false);
                Assert.Equal(1, again.UnchangedCount, "Re-apply is unchanged");
                string blocked = yaml.Replace("https://hooks.example.com/garrison", "http://169.254.169.254/latest", StringComparison.Ordinal);
                TestResponse refused = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, T(host) + "/manifests/apply?allowSecretValues=true", blocked, token).ConfigureAwait(false);
                Assert.True(refused.StatusCode == 400 && refused.Body.Contains("refused URL (LinkLocal)", StringComparison.Ordinal) && refused.Body.Contains("spec.url", StringComparison.Ordinal), "Manifests are checked against the SSRF rules: " + refused.Body);
                TestResponse export = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, T(host) + "/manifests/export", null, token).ConfigureAwait(false);
                Assert.True(export.Body.Contains("kind: NotificationEndpoint", StringComparison.Ordinal) && export.Body.Contains("manifest-endpoint", StringComparison.Ordinal) && !export.Body.Contains(secret, StringComparison.Ordinal) && !export.Body.Contains("signingSecret", StringComparison.Ordinal), "Export carries the endpoint without its secret");

                await client.ConnectAsync(host, null, token).ConfigureAwait(false);
                List<string> names = new List<string> { "garrison_list_notification_endpoints", "garrison_get_notification_endpoint", "garrison_create_notification_endpoint", "garrison_update_notification_endpoint", "garrison_delete_notification_endpoint", "garrison_list_notification_deliveries", "garrison_rotate_notification_endpoint_secret", "garrison_test_notification_endpoint" };
                ProviderToolPage listed = await client.ToolsAsync(token).ConfigureAwait(false);
                foreach (string name in names)
                {
                    McpToolDefinition? tool = McpToolCatalog.All().FirstOrDefault(t => t.Name == name);
                    Assert.True(tool != null && tool.UserOnly && tool.ManagementTool, name + " is a management tool");
                    Assert.True(host.Server.Context.Scopes.Find("MCP", name) != null, name + " scope is registered");
                    Assert.True(listed.Tools.Any(t => t.Name == name), "Administrator sees " + name);
                }
                NotificationEndpoint mcpCreated = await client.CallAsync<NotificationEndpoint>("garrison_create_notification_endpoint", new { configuration = Endpoint("mcp-endpoint", "https://hooks.example.net/x", NotificationEventEnum.RunSucceeded) }, token).ConfigureAwait(false);
                Assert.True(mcpCreated.SigningSecret != null && mcpCreated.Id.StartsWith(Constants.NotificationEndpointIdPrefix, StringComparison.Ordinal), "Creation through MCP returns the secret once");
                await client.ExpectErrorAsync("garrison_create_notification_endpoint", new { configuration = Endpoint("mcp-blocked", "http://127.0.0.1/x", NotificationEventEnum.RunSucceeded) }, "ValidationFailed", token).ConfigureAwait(false);
                NotificationEndpoint rotatedEndpoint = await client.CallAsync<NotificationEndpoint>("garrison_rotate_notification_endpoint_secret", new { endpoint = mcpCreated.Name }, token).ConfigureAwait(false);
                Assert.True(rotatedEndpoint.SigningSecret != null && rotatedEndpoint.SigningSecret != mcpCreated.SigningSecret, "Rotation through MCP returns a new secret once");
                NotificationDelivery testDelivery = await client.CallAsync<NotificationDelivery>("garrison_test_notification_endpoint", new { endpoint = mcpCreated.Id }, token).ConfigureAwait(false);
                Assert.True(testDelivery.EndpointId == mcpCreated.Id, "A test send through MCP returns its delivery");
                NotificationEndpoint read = await client.CallAsync<NotificationEndpoint>("garrison_get_notification_endpoint", new { endpoint = "mcp-endpoint" }, token).ConfigureAwait(false);
                Assert.True(read.SigningSecret == null && read.Id == mcpCreated.Id, "Reads never return the secret");
                read.Active = false;
                NotificationEndpoint updated = await client.CallAsync<NotificationEndpoint>("garrison_update_notification_endpoint", new { endpoint = read.Id, configuration = read }, token).ConfigureAwait(false);
                Assert.True(!updated.Active, "Update through MCP");
                EnumerationResult<NotificationEndpoint> all = await client.CallAsync<EnumerationResult<NotificationEndpoint>>("garrison_list_notification_endpoints", new { search = "endpoint" }, token).ConfigureAwait(false);
                Assert.True(all.Objects.Count == 2, "List through MCP");
                EnumerationResult<NotificationDelivery> deliveries = await client.CallAsync<EnumerationResult<NotificationDelivery>>("garrison_list_notification_deliveries", new { endpoint = mcpCreated.Id, status = "Failed" }, token).ConfigureAwait(false);
                Assert.Equal(0, deliveries.Objects.Count, "Deliveries through MCP");
                await client.ExpectErrorAsync("garrison_list_notification_deliveries", new { endpoint = mcpCreated.Id, status = "Lost" }, "ValidationFailed", token).ConfigureAwait(false);
                McpConfigurationDeletion deleted = await client.CallAsync<McpConfigurationDeletion>("garrison_delete_notification_endpoint", new { endpoint = mcpCreated.Name }, token).ConfigureAwait(false);
                Assert.True(deleted.Deleted, "Delete through MCP");
                await client.ExpectErrorAsync("garrison_get_notification_endpoint", new { endpoint = mcpCreated.Id }, "NotFound", token).ConfigureAwait(false);
            }
        }

        #endregion
    }
}
