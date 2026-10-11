namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Server.Protocols;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Regression suites for the M1 simulated user session findings (plan P9.17, docs/testing/M1_SESSION.md):
    /// settings validation, tenant existence, secret expiry, manifest changes, delegation wait, A2A messageId reuse,
    /// parameter errors, MCP error text, served model, missing deployments, retry of deleted agents, and event codes.
    /// </summary>
    public static class FindingsSuite
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
            unit.Add(new TestCaseDescriptor("findings-unit", "delegation-calculator", "Delegation wait merges overlapping children, clips to the window, and never makes TTFT negative (M1-08)", ct => CalculatorAsync()));
            suites.Add(new TestSuiteDescriptor("findings-unit", "M1 findings (unit)", unit));

            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "findings-" + provider.ToString().ToLowerInvariant();
                List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
                cases.Add(new TestCaseDescriptor(id, "settings-validation", "Out-of-range and invalid settings return 400 with errors and codes keyed by path; nothing is saved (M1-01, " + provider + ")", ct => SettingsAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "tenant-not-found", "A nonexistent tenant in a tenant-scoped path returns 404 for system administrators (M1-13, " + provider + ")", ct => TenantNotFoundAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "secret-expiry", "A secret expiry in the past is rejected on create, update, and manifest apply (M1-27, " + provider + ")", ct => SecretExpiryAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "manifest-changes", "Dry runs and applies report planned results and per-field changes (M1-14, " + provider + ")", ct => ManifestChangesAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "delegation-wait", "A finishing run records the time spent waiting on its child runs, and analytics average it (M1-08, " + provider + ")", ct => DelegationWaitAsync(provider, ct)));
                cases.Add(new TestCaseDescriptor(id, "runs-and-protocols", "messageId reuse, parameter errors, MCP error text, servedModel, missing deployments, retry of deleted agents, and event codes (M1-10, 12, 16, 22, 24, 26, 30, " + provider + ")", ct => RunsAndProtocolsAsync(provider, ct)));
                suites.Add(new TestSuiteDescriptor(id, "M1 findings (" + provider + ")", cases));
            }
            return suites;
        }

        #endregion

        #region Private-Methods

        private static Task CalculatorAsync()
        {
            DateTime start = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            DateTime end = start.AddSeconds(20);

            DelegationWaitResult none = DelegationWaitCalculator.Compute(start, end, 1500, new List<Run>());
            Assert.Equal(0L, none.DelegationWaitMs, "No children, no wait");
            Assert.Equal(1500L, none.TimeToFirstTokenExcludingDelegationMs ?? -1, "No children: TTFT unchanged");

            List<Run> children = new List<Run>
            {
                Child(start.AddSeconds(1), start.AddSeconds(4)),
                Child(start.AddSeconds(3), start.AddSeconds(5)),
                Child(start.AddSeconds(-5), start.AddSeconds(-1)),
                Child(start.AddSeconds(18), start.AddSeconds(30))
            };
            DelegationWaitResult result = DelegationWaitCalculator.Compute(start, end, 6000, children);
            Assert.Equal(6000L, result.DelegationWaitMs, "Overlap counted once (4 s) plus the tail clipped at the window end (2 s)");
            Assert.Equal(4000L, result.DelegationWaitBeforeFirstTokenMs, "Wait before the first token");
            Assert.Equal(2000L, result.TimeToFirstTokenExcludingDelegationMs ?? -1, "TTFT minus the wait before it");

            DelegationWaitResult early = DelegationWaitCalculator.Compute(start, end, 2000, children);
            Assert.Equal(1000L, early.TimeToFirstTokenExcludingDelegationMs ?? -1, "Only the wait before the first token counts");

            Run running = new Run();
            running.CreatedUtc = start.AddSeconds(10);
            running.Status = RunStatusEnum.Running;
            DelegationWaitResult open = DelegationWaitCalculator.Compute(start, end, null, new List<Run> { running });
            Assert.Equal(10000L, open.DelegationWaitMs, "A child still running counts until the parent finishes");
            Assert.True(!open.TimeToFirstTokenExcludingDelegationMs.HasValue, "No TTFT, no excluded TTFT");
            return Task.CompletedTask;
        }

        private static Run Child(DateTime created, DateTime finished)
        {
            Run child = new Run();
            child.CreatedUtc = created;
            child.QueuedUtc = created;
            child.TotalMs = (long)(finished - created).TotalMilliseconds;
            child.Status = RunStatusEnum.Succeeded;
            return child;
        }

        private static async Task SettingsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                SettingsView before = await HttpTestHelpers.SendAsync<SettingsView>(host.AdminClient, HttpMethod.Get, "/v1.0/api/settings", null, 200, token).ConfigureAwait(false);
                string? retention = before.Fields.First(f => f.Path == "Audit.RetentionDays").Value;

                SettingsUpdateRequest bad = new SettingsUpdateRequest();
                bad.Values.Add(new SettingValue { Path = "Audit.RetentionDays", Value = "-5" });
                bad.Values.Add(new SettingValue { Path = "Runs.RetentionDays", Value = "ten" });
                bad.Values.Add(new SettingValue { Path = "RequestHistory.Enabled", Value = "maybe" });
                bad.Values.Add(new SettingValue { Path = "Logging.MinimumSeverity", Value = "9" });
                bad.Values.Add(new SettingValue { Path = "No.Such", Value = "1" });
                bad.Values.Add(new SettingValue { Path = "Audit.RetentionDays", Value = "-5" });
                TestResponse response = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", bad, token).ConfigureAwait(false);
                Assert.Equal(400, response.StatusCode, "Invalid settings status (" + response.Body + ")");
                ErrorResponse error = Serializer.Deserialize<ErrorResponse>(response.Body) ?? throw new TestAssertionException("Empty error.");
                Dictionary<string, string> errors = Assert.NotNull(error.Errors, "errors object");
                Dictionary<string, string> codes = Assert.NotNull(error.FieldCodes, "fieldCodes object");
                Assert.True(errors["Audit.RetentionDays"].Contains("between 1 and 3650", StringComparison.Ordinal), "Range named: " + errors["Audit.RetentionDays"]);
                Assert.Equal("OutOfRange", codes["Audit.RetentionDays"], "Out of range code");
                Assert.Equal("NotAnInteger", codes["Runs.RetentionDays"], "Integer code");
                Assert.Equal("NotABoolean", codes["RequestHistory.Enabled"], "Boolean code");
                Assert.True(codes["Logging.MinimumSeverity"] == "SettingsFileReadOnly" || codes["Logging.MinimumSeverity"] == "OutOfRange", "File setting rejected: " + codes["Logging.MinimumSeverity"]);
                Assert.Equal("UnknownSetting", codes["No.Such"], "Unknown setting code");

                SettingsView after = await HttpTestHelpers.SendAsync<SettingsView>(host.AdminClient, HttpMethod.Get, "/v1.0/api/settings", null, 200, token).ConfigureAwait(false);
                Assert.Equal(retention, after.Fields.First(f => f.Path == "Audit.RetentionDays").Value, "Nothing saved or clamped");

                SettingsUpdateRequest mixed = new SettingsUpdateRequest();
                mixed.Values.Add(new SettingValue { Path = "Audit.RetentionDays", Value = "400" });
                mixed.Values.Add(new SettingValue { Path = "Runs.RetentionDays", Value = "0" });
                TestResponse partial = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", mixed, token).ConfigureAwait(false);
                Assert.Equal(400, partial.StatusCode, "One invalid value rejects the whole update");
                SettingsView unchanged = await HttpTestHelpers.SendAsync<SettingsView>(host.AdminClient, HttpMethod.Get, "/v1.0/api/settings", null, 200, token).ConfigureAwait(false);
                Assert.Equal(retention, unchanged.Fields.First(f => f.Path == "Audit.RetentionDays").Value, "The valid value in a rejected update is not saved");

                SettingsUpdateRequest good = new SettingsUpdateRequest();
                good.Values.Add(new SettingValue { Path = "Audit.RetentionDays", Value = "400" });
                SettingsSaveResponse saved = await HttpTestHelpers.SendAsync<SettingsSaveResponse>(host.AdminClient, HttpMethod.Put, "/v1.0/api/settings", good, 200, token).ConfigureAwait(false);
                Assert.Equal("400", saved.Settings.Fields.First(f => f.Path == "Audit.RetentionDays").Value, "A valid value saves");
            }
        }

        private static async Task TenantNotFoundAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                foreach (string path in new string[] { "/agents", "/runs", "/deployments", "/secrets", "/analytics/runs", "/manifests/applies" })
                {
                    TestResponse missing = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/nope" + path, null, token).ConfigureAwait(false);
                    Assert.Equal(404, missing.StatusCode, "GET /tenants/nope" + path + " (" + missing.Body + ")");
                    ErrorResponse error = Serializer.Deserialize<ErrorResponse>(missing.Body) ?? throw new TestAssertionException("Empty error.");
                    Assert.Equal("TenantNotFound", error.Code, "Code for " + path);
                }
                TestResponse create = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/nope/agents", new Agent { Name = "ghost" }, token).ConfigureAwait(false);
                Assert.Equal(404, create.StatusCode, "Writes to a nonexistent tenant are refused too");

                TestResponse ok = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/agents", null, token).ConfigureAwait(false);
                Assert.Equal(200, ok.StatusCode, "An existing tenant still works");
            }
        }

        private static async Task SecretExpiryAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string secrets = "/v1.0/api/tenants/" + host.TenantId + "/secrets";
                SecretRequest past = new SecretRequest { Name = "expired-key", Value = "abc", ExpiresUtc = DateTime.UtcNow.AddDays(-1) };
                TestResponse rejected = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, secrets, past, token).ConfigureAwait(false);
                Assert.Equal(400, rejected.StatusCode, "Past expiry on create (" + rejected.Body + ")");
                ErrorResponse error = Serializer.Deserialize<ErrorResponse>(rejected.Body) ?? throw new TestAssertionException("Empty error.");
                Assert.Equal("ExpiryInPast", Assert.NotNull(error.FieldCodes, "fieldCodes")["expiresUtc"], "Expiry code");

                SecretRequest future = new SecretRequest { Name = "fresh-key", Value = "abc", ExpiresUtc = DateTime.UtcNow.AddDays(30) };
                Secret created = await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, secrets, future, 201, token).ConfigureAwait(false);
                SecretRequest none = new SecretRequest { Name = "no-expiry" };
                await HttpTestHelpers.SendAsync<Secret>(host.AdminClient, HttpMethod.Post, secrets, none, 201, token).ConfigureAwait(false);

                future.ExpiresUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                future.Value = null;
                TestResponse update = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Put, secrets + "/" + created.Id, future, token).ConfigureAwait(false);
                Assert.Equal(400, update.StatusCode, "Past expiry on update (" + update.Body + ")");

                string yaml = "apiVersion: garrison/v1\nkind: Secret\nmetadata:\n  name: manifest-expired\nspec:\n  kind: GenericEnv\n  expiresUtc: 2020-01-01T00:00:00Z\n";
                ManifestApply apply = await ApplyManifestAsync(host, yaml, String.Empty, token, 400).ConfigureAwait(false);
                Assert.Equal(ManifestApplyResultEnum.Failed, apply.Items[0].Result, "Manifest secret with a past expiry fails");
                Assert.True((apply.Items[0].Message ?? String.Empty).Contains("in the past", StringComparison.Ordinal), "Manifest message: " + apply.Items[0].Message);
            }
        }

        private static async Task ManifestChangesAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string first = Manifest("Be brief.", "First description.");
                ManifestApply dryNew = await ApplyManifestAsync(host, first, "?dryRun=true", token).ConfigureAwait(false);
                Assert.True(dryNew.Items.All(i => i.Result == ManifestApplyResultEnum.Validated && i.PlannedResult == ManifestApplyResultEnum.Created), "Dry run of new documents plans Created");
                Assert.True(dryNew.Items.All(i => i.ResourceId == null), "No resource ID for records that do not exist yet");
                Assert.Equal(2, dryNew.CreatedCount, "Dry run counts what would be created");

                ManifestApply applied = await ApplyManifestAsync(host, first, String.Empty, token).ConfigureAwait(false);
                Assert.Equal(2, applied.CreatedCount, "Created");

                ManifestApply drySame = await ApplyManifestAsync(host, first, "?dryRun=true", token).ConfigureAwait(false);
                Assert.True(drySame.Items.All(i => i.PlannedResult == ManifestApplyResultEnum.Unchanged && i.Changes.Count == 0), "Dry run of an applied manifest plans Unchanged");
                Assert.Equal(2, drySame.UnchangedCount, "Dry run unchanged count");

                string longContent = new string('x', 300);
                string second = Manifest(longContent, "Second description.");
                ManifestApply dryChanged = await ApplyManifestAsync(host, second, "?dryRun=true", token).ConfigureAwait(false);
                ManifestApplyItem prompt = dryChanged.Items.First(i => i.Kind == "PromptTemplate");
                Assert.Equal(ManifestApplyResultEnum.Updated, prompt.PlannedResult ?? ManifestApplyResultEnum.Failed, "Prompt planned Updated");
                ManifestFieldChange content = Assert.NotNull(prompt.Changes.FirstOrDefault(c => c.Field == "content"), "content change");
                Assert.Equal("Be brief.", content.Before, "Before value");
                Assert.Equal(200, (content.After ?? String.Empty).Length, "After value truncated to 200 characters");
                ManifestApplyItem agent = dryChanged.Items.First(i => i.Kind == "Agent");
                ManifestFieldChange description = Assert.NotNull(agent.Changes.FirstOrDefault(c => c.Field == "description"), "description change");
                Assert.Equal("First description.", description.Before, "Agent before");
                Assert.Equal("Second description.", description.After, "Agent after");
                Assert.True(agent.Changes.All(c => c.Field != "lastUpdateUtc" && c.Field != "id"), "Only spec fields: " + String.Join(", ", agent.Changes.Select(c => c.Field)));

                ManifestApply appliedChange = await ApplyManifestAsync(host, second, String.Empty, token).ConfigureAwait(false);
                ManifestApplyItem updated = appliedChange.Items.First(i => i.Kind == "Agent");
                Assert.Equal(ManifestApplyResultEnum.Updated, updated.Result, "Apply reports Updated");
                Assert.True(updated.Changes.Any(c => c.Field == "description"), "Apply reports the changes");

                ManifestApply reread = await HttpTestHelpers.SendAsync<ManifestApply>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/manifests/applies/" + appliedChange.Id, null, 200, token).ConfigureAwait(false);
                ManifestApplyItem stored = reread.Items.First(i => i.Kind == "Agent");
                Assert.True(stored.Changes.Any(c => c.Field == "description" && c.After == "Second description."), "Changes are stored with the apply record");
                Assert.Equal(ManifestApplyResultEnum.Updated, stored.PlannedResult ?? ManifestApplyResultEnum.Failed, "Planned result is stored");
            }
        }

        private static string Manifest(string content, string description)
        {
            return String.Join("\n", new string[]
            {
                "apiVersion: garrison/v1",
                "kind: PromptTemplate",
                "metadata:",
                "  name: m1-system",
                "spec:",
                "  kind: System",
                "  content: \"" + content + "\"",
                "---",
                "apiVersion: garrison/v1",
                "kind: Agent",
                "metadata:",
                "  name: m1-agent",
                "spec:",
                "  description: \"" + description + "\""
            });
        }

        private static async Task<ManifestApply> ApplyManifestAsync(TestServerHost host, string yaml, string query, CancellationToken token, int expectedStatus = 200)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/manifests/apply" + query))
            {
                request.Content = new StringContent(yaml, Encoding.UTF8, "application/yaml");
                using (HttpResponseMessage response = await host.AdminClient.SendAsync(request, token).ConfigureAwait(false))
                {
                    string body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if ((int)response.StatusCode != expectedStatus) throw new TestAssertionException("Manifest apply returned " + (int)response.StatusCode + " (expected " + expectedStatus + "): " + body);
                    return Serializer.Deserialize<ManifestApply>(body) ?? throw new TestAssertionException("Empty apply response.");
                }
            }
        }

        private static async Task DelegationWaitAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                Agent agent = await HttpTestHelpers.SendAsync<Agent>(host.AdminClient, HttpMethod.Post, "/v1.0/api/tenants/" + host.TenantId + "/agents", new Agent { Name = "m1-lead" }, 201, token).ConfigureAwait(false);
                DateTime started = DateTime.UtcNow.AddSeconds(-10);

                Run parent = new Run();
                parent.TenantId = host.TenantId;
                parent.AgentId = agent.Id;
                parent.AgentName = agent.Name;
                parent.DeploymentId = "dep_m1";
                parent.HarnessType = HarnessTypeEnum.ClaudeCode;
                parent.Status = RunStatusEnum.Running;
                parent.LeaseNodeId = "node-m1";
                parent.LeaseEpoch = 1;
                parent.QueuedUtc = started.AddMilliseconds(-50);
                parent.LeasedUtc = started.AddMilliseconds(-10);
                parent.StartedUtc = started;
                parent = await db.Runs.CreateAsync(parent, token).ConfigureAwait(false);

                await ChildAsync(db, parent, started.AddSeconds(1), 3000, token).ConfigureAwait(false);
                await ChildAsync(db, parent, started.AddSeconds(3), 2000, token).ConfigureAwait(false);

                RunCompleteRequest complete = new RunCompleteRequest();
                complete.NodeId = "node-m1";
                complete.Epoch = 1;
                complete.Status = RunStatusEnum.Succeeded;
                complete.Outcome = RunOutcomeEnum.Succeeded;
                complete.ResultText = "done";
                complete.TimeToFirstTokenMs = 6000;
                complete.ExecutionMs = 9000;
                await host.Server.Context.Get<RunEventService>().CompleteAsync(parent.Id, complete, token).ConfigureAwait(false);

                Run finished = await HttpTestHelpers.SendAsync<Run>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/runs/" + parent.Id, null, 200, token).ConfigureAwait(false);
                long wait = finished.DelegationWaitMs ?? -1;
                Assert.True(wait >= 3900 && wait <= 4100, "Delegation wait is the union of the children (about 4000 ms, got " + wait + ")");
                long excluded = finished.TimeToFirstTokenExcludingDelegationMs ?? -1;
                Assert.True(excluded >= 1900 && excluded <= 2100, "TTFT excluding delegation (about 2000 ms, got " + excluded + ")");
                Assert.Equal(6000L, finished.TimeToFirstTokenMs ?? -1, "TTFT itself is unchanged");

                DateTime from = DateTime.UtcNow.AddHours(-1);
                DateTime to = DateTime.UtcNow.AddMinutes(1);
                string range = "from=" + Uri.EscapeDataString(from.ToString("yyyy-MM-ddTHH:mm:ssZ")) + "&to=" + Uri.EscapeDataString(to.ToString("yyyy-MM-ddTHH:mm:ssZ"));
                RunAnalyticsResponse analytics = await HttpTestHelpers.SendAsync<RunAnalyticsResponse>(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + host.TenantId + "/analytics/runs?" + range + "&agentId=" + agent.Id, null, 200, token).ConfigureAwait(false);
                Assert.True(Math.Abs((analytics.Totals.DelegationWaitMsAvg ?? -1) - wait) < 0.5, "Analytics delegation wait average");
                Assert.Equal((double)excluded, analytics.Totals.TimeToFirstTokenExcludingDelegationMsP50 ?? -1, "Analytics excluded TTFT p50");
                Assert.Equal((double)excluded, analytics.Totals.TimeToFirstTokenExcludingDelegationMsP95 ?? -1, "Analytics excluded TTFT p95");
                Assert.True(analytics.Totals.TimeToFirstTokenExcludingDelegationMsAvg.HasValue, "Analytics excluded TTFT average");
            }
        }

        private static async Task ChildAsync(DatabaseDriverBase db, Run parent, DateTime createdUtc, long totalMs, CancellationToken token)
        {
            Run child = new Run();
            child.TenantId = parent.TenantId;
            child.AgentId = parent.AgentId;
            child.AgentName = parent.AgentName;
            child.DeploymentId = parent.DeploymentId;
            child.Status = RunStatusEnum.Succeeded;
            child.Kind = RunKindEnum.Delegated;
            child.ParentRunId = parent.Id;
            child.RootRunId = parent.Id;
            child.Depth = 1;
            child.QueuedUtc = createdUtc;
            child.TotalMs = totalMs;
            child = await db.Runs.CreateAsync(child, token).ConfigureAwait(false);
            AdoDatabaseDriver ado = (AdoDatabaseDriver)db;
            await ado.NonQueryAsync("UPDATE " + ado.Table("runs") + " SET createdutc = @created WHERE id = @id;", command =>
            {
                AdoDatabaseDriver.Add(command, "created", createdUtc);
                AdoDatabaseDriver.Add(command, "id", child.Id);
            }, token).ConfigureAwait(false);
        }

        private static async Task RunsAndProtocolsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestCluster cluster = await TestCluster.StartAsync(provider, 1, token).ConfigureAwait(false))
            {
                string tenant = cluster.Server.TenantId;
                HttpClient admin = cluster.Server.AdminClient;
                Agent echo = await cluster.CreateAgentAsync("m1-echo", "builtin/fake", null, token).ConfigureAwait(false);

                // M1-26: no active deployment is a 409 that says so.
                Agent bare = await HttpTestHelpers.SendAsync<Agent>(admin, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents", new Agent { Name = "m1-bare", ExposeA2A = true }, 201, token).ConfigureAwait(false);
                TestResponse noDeployment = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + bare.Name + "/invoke", new InvokeRequest { Input = "hi" }, token).ConfigureAwait(false);
                Assert.Equal(409, noDeployment.StatusCode, "No deployment status (" + noDeployment.Body + ")");
                ErrorResponse noDeploymentError = Serializer.Deserialize<ErrorResponse>(noDeployment.Body) ?? throw new TestAssertionException("Empty error.");
                Assert.Equal("NoActiveDeployment", noDeploymentError.Code, "No deployment code");
                Assert.True(noDeploymentError.Message.Contains("no active deployment", StringComparison.Ordinal), "Message: " + noDeploymentError.Message);

                // M1-24: server-generated events carry codes; M1-12 baseline: the REST run has a served model.
                Run run = await HttpTestHelpers.SendAsync<Run>(admin, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + echo.Name + "/invoke", new InvokeRequest { Input = "first", WaitSeconds = 60 }, 200, token).ConfigureAwait(false);
                Assert.Equal(RunStatusEnum.Succeeded, run.Status, "Echo run");
                RunEventsResponse events = await HttpTestHelpers.SendAsync<RunEventsResponse>(admin, HttpMethod.Get, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id + "/events", null, 200, token).ConfigureAwait(false);
                Assert.True(events.Events.Any(e => e.Code == "WorkspacePrepared"), "WorkspacePrepared code");
                Assert.True(events.Events.Any(e => e.Code == "HarnessExited"), "HarnessExited code");
                Assert.True(run.DelegationWaitMs == 0 && run.TimeToFirstTokenExcludingDelegationMs == run.TimeToFirstTokenMs, "A run that delegates nothing waits 0 ms");

                // REST idempotency keys follow the same rule as A2A messageIds.
                string key = Guid.NewGuid().ToString("N");
                await InvokeWithKeyAsync(admin, tenant, echo.Name, "same", key, 200, token).ConfigureAwait(false);
                TestResponse keyConflict = await InvokeWithKeyAsync(admin, tenant, echo.Name, "different", key, 409, token).ConfigureAwait(false);
                Assert.True(keyConflict.Body.Contains("IdempotencyKeyConflict", StringComparison.Ordinal), "Idempotency conflict code: " + keyConflict.Body);

                await A2AChecksAsync(cluster, tenant, echo, token).ConfigureAwait(false);
                await McpChecksAsync(cluster, tenant, token).ConfigureAwait(false);

                // M1-22: retrying a run of a deleted agent says the agent was deleted.
                TestResponse deleted = await HttpTestHelpers.SendAsync(admin, HttpMethod.Delete, "/v1.0/api/tenants/" + tenant + "/agents/" + echo.Id, null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "Agent deleted (" + deleted.Body + ")");
                TestResponse retry = await HttpTestHelpers.SendAsync(admin, HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/runs/" + run.Id + "/retry", null, token).ConfigureAwait(false);
                Assert.Equal(409, retry.StatusCode, "Retry of a deleted agent's run (" + retry.Body + ")");
                ErrorResponse retryError = Serializer.Deserialize<ErrorResponse>(retry.Body) ?? throw new TestAssertionException("Empty error.");
                Assert.Equal("AgentDeleted", retryError.Code, "Retry code");
                Assert.True(retryError.Message.Contains("was deleted", StringComparison.Ordinal), "Retry message: " + retryError.Message);
            }
        }

        private static async Task<TestResponse> InvokeWithKeyAsync(HttpClient client, string tenant, string agent, string input, string key, int expected, CancellationToken token)
        {
            using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "/v1.0/api/tenants/" + tenant + "/agents/" + agent + "/invoke"))
            {
                request.Headers.Add("Idempotency-Key", key);
                request.Content = new StringContent(Serializer.Serialize(new InvokeRequest { Input = input, WaitSeconds = 60 }), Encoding.UTF8, "application/json");
                using (HttpResponseMessage response = await client.SendAsync(request, token).ConfigureAwait(false))
                {
                    TestResponse result = new TestResponse();
                    result.StatusCode = (int)response.StatusCode;
                    result.Body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    if (result.StatusCode != expected) throw new TestAssertionException("Invoke with Idempotency-Key returned " + result.StatusCode + " (expected " + expected + "): " + result.Body);
                    return result;
                }
            }
        }

        private static async Task A2AChecksAsync(TestCluster cluster, string tenant, Agent echo, CancellationToken token)
        {
            string url = cluster.Server.BaseUrl + "/v1.0/a2a/" + tenant + "/" + echo.Name;
            string messageId = Guid.NewGuid().ToString("N");

            // M1-10: same messageId and content returns the existing task; different content is a 409.
            TestResponse first = await RpcAsync(cluster, url, SendMessage(messageId, "first", null), token).ConfigureAwait(false);
            Assert.Equal(200, first.StatusCode, "A2A first send (" + first.Body + ")");
            string firstTask = TaskId(first.Body);
            TestResponse again = await RpcAsync(cluster, url, SendMessage(messageId, "first", null), token).ConfigureAwait(false);
            Assert.Equal(firstTask, TaskId(again.Body), "Identical retry returns the existing task");
            Assert.True(again.Body.Contains("garrison.servedModel", StringComparison.Ordinal), "A2A metadata carries servedModel (M1-12): " + again.Body);

            TestResponse conflict = await RpcAsync(cluster, url, SendMessage(messageId, "second", null), token).ConfigureAwait(false);
            Assert.Equal(409, conflict.StatusCode, "Reused messageId with different content (" + conflict.Body + ")");
            using (JsonDocument document = JsonDocument.Parse(conflict.Body))
            {
                JsonElement error = document.RootElement.GetProperty("error");
                string message = error.GetProperty("message").GetString() ?? String.Empty;
                Assert.True(message.Contains(messageId, StringComparison.Ordinal) && message.Contains(firstTask, StringComparison.Ordinal), "Conflict message names the messageId and task: " + message);
                Assert.Equal("MessageIdConflict", error.GetProperty("data").GetProperty("code").GetString(), "Conflict data code");
            }

            // M1-16: parameter errors name the parameter.
            TestResponse parameter = await RpcAsync(cluster, url, SendMessage(Guid.NewGuid().ToString("N"), "with override", "opus"), token).ConfigureAwait(false);
            using (JsonDocument document = JsonDocument.Parse(parameter.Body))
            {
                JsonElement error = document.RootElement.GetProperty("error");
                string message = error.GetProperty("message").GetString() ?? String.Empty;
                Assert.True(message.Contains("model", StringComparison.Ordinal) && message.Contains("parameters.model", StringComparison.Ordinal), "Parameter error names the parameter: " + message);
                Assert.Equal("ParameterNotAllowed", error.GetProperty("data").GetProperty("fieldCodes").GetProperty("parameters.model").GetString(), "Parameter field code");
            }
        }

        private static string SendMessage(string messageId, string text, string? model)
        {
            string metadata = model == null ? String.Empty : ", \"metadata\": { \"garrison.parameter.model\": \"" + model + "\" }";
            return "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"SendMessage\",\"params\":{\"message\":{\"role\":\"ROLE_USER\",\"messageId\":\"" + messageId + "\",\"parts\":[{\"text\":\"" + text + "\"}]}" + metadata + "}}";
        }

        private static string TaskId(string body)
        {
            using (JsonDocument document = JsonDocument.Parse(body))
            {
                JsonElement root = document.RootElement;
                if (root.TryGetProperty("error", out JsonElement error)) throw new TestAssertionException("A2A error: " + error.GetRawText());
                JsonElement result = root.GetProperty("result");
                JsonElement task = result.TryGetProperty("task", out JsonElement wrapped) ? wrapped : result;
                return task.GetProperty("id").GetString() ?? String.Empty;
            }
        }

        private static async Task<TestResponse> RpcAsync(TestCluster cluster, string url, string json, CancellationToken token)
        {
            using (HttpClient http = new HttpClient())
            {
                http.DefaultRequestHeaders.Add("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                http.Timeout = TimeSpan.FromSeconds(120);
                using (HttpResponseMessage response = await http.PostAsync(url, new StringContent(json, Encoding.UTF8, "application/json"), token).ConfigureAwait(false))
                {
                    TestResponse result = new TestResponse();
                    result.StatusCode = (int)response.StatusCode;
                    result.Body = await response.Content.ReadAsStringAsync(token).ConfigureAwait(false);
                    return result;
                }
            }
        }

        private static async Task McpChecksAsync(TestCluster cluster, string tenant, CancellationToken token)
        {
            using (McpHttpClient client = new McpHttpClient())
            {
                client.SetRequestHeader("x-api-key", cluster.Server.Settings.Auth.AdminApiKey);
                client.SetRequestHeader("x-tenant-id", tenant);
                await client.ConnectStreamableAsync(cluster.Server.McpUrl, "/mcp").ConfigureAwait(false);

                // M1-12: servedModel in the MCP run summary.
                string invoked = await ToolAsync(client, "garrison_invoke_agent", new { tenantId = tenant, agent = "m1-echo", input = "Say \"hi\"", waitSeconds = 60 }).ConfigureAwait(false);
                McpRunSummary summary = Serializer.Deserialize<McpRunSummary>(invoked) ?? throw new TestAssertionException("Empty MCP summary.");
                Assert.Equal("fake-model", summary.ServedModel, "MCP servedModel (" + invoked + ")");
                Assert.True(invoked.Contains("\"servedModel\"", StringComparison.Ordinal), "servedModel key present");
                Assert.True(!invoked.Contains("\\u0022", StringComparison.Ordinal), "Quotes are not escaped as \\u0022 (M1-30): " + invoked);
                Assert.Equal(0L, summary.DelegationWaitMs ?? -1, "MCP summary delegation wait");

                // M1-30: every tool error reads "Code: message".
                string notFound = await ToolErrorAsync(client, "garrison_get_run", new { tenantId = tenant, runId = "run_nope" }).ConfigureAwait(false);
                Assert.True(notFound.Contains("NotFound: Run run_nope not found.", StringComparison.Ordinal), "Not found text: " + notFound);
                string finished = await ToolErrorAsync(client, "garrison_cancel_run", new { tenantId = tenant, runId = summary.RunId }).ConfigureAwait(false);
                Assert.True(finished.Contains("RunFinished: ", StringComparison.Ordinal), "Conflict text: " + finished);

                // M1-16 over MCP: the parameter is named.
                string parameter = await ToolErrorAsync(client, "garrison_invoke_agent", new { tenantId = tenant, agent = "m1-echo", input = "x", parameters = new { model = "opus" } }).ConfigureAwait(false);
                Assert.True(parameter.Contains("ValidationFailed: ", StringComparison.Ordinal) && parameter.Contains("parameters.model", StringComparison.Ordinal), "Parameter text: " + parameter);
            }
        }

        private static async Task<string> ToolAsync(McpHttpClient client, string name, object arguments)
        {
            JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name, arguments }, 90000).ConfigureAwait(false);
            if (result.TryGetProperty("isError", out JsonElement isError) && isError.ValueKind == JsonValueKind.True) throw new TestAssertionException("Tool error: " + result.GetRawText());
            return result.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
        }

        private static async Task<string> ToolErrorAsync(McpHttpClient client, string name, object arguments)
        {
            try
            {
                JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name, arguments }, 90000).ConfigureAwait(false);
                if (result.TryGetProperty("isError", out JsonElement isError) && isError.ValueKind == JsonValueKind.True) return result.GetProperty("content")[0].GetProperty("text").GetString() ?? String.Empty;
                throw new TestAssertionException(name + " was expected to fail: " + result.GetRawText());
            }
            catch (Exception e) when (e is not TestAssertionException)
            {
                return e.Message;
            }
        }

        #endregion
    }
}
