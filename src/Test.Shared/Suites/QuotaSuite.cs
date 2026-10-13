namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Daily quota configuration, concurrent enforcement, retention, and compiler budgets.</summary>
    public static class QuotaSuite
    {
        /// <summary>Build provider suites.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "quotas-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Daily quotas (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "configuration", "Scoped quota CRUD rejects invalid targets and limits; only administrators write", ct => ConfigurationAsync(provider, ct)),
                    new TestCaseDescriptor(id, "admission-race", "Concurrent admissions never exceed any scope's run limit; idempotent retries and deletion retain accounting", ct => AdmissionsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "claim-race", "Active concurrency is exact across parallel claims and accounting days", ct => ClaimsAsync(provider, ct)),
                    new TestCaseDescriptor(id, "meters-and-reset", "Completion-day tokens/cost, unknown-cost coverage, deletion, and UTC windows stay accurate", ct => MetersAsync(provider, ct)),
                    new TestCaseDescriptor(id, "budget", "The smallest remaining allowance reaches Claude arguments without raising deployment limits", ct => BudgetAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static Run Fixture(string tenantId, string agentId = "agt_quota", string deploymentId = "dep_quota")
        {
            return new Run { TenantId = tenantId, AgentId = agentId, AgentName = "quota", DeploymentId = deploymentId, Status = RunStatusEnum.Queued, QueuedUtc = DateTime.UtcNow, HarnessType = HarnessTypeEnum.Generic };
        }

        private static UsageQuota Quota(string tenantId, UsageQuotaScopeEnum scope, string resourceId)
        {
            return new UsageQuota { TenantId = tenantId, Name = "quota-" + scope.ToString().ToLowerInvariant(), Scope = scope, ResourceId = resourceId };
        }

        private static async Task ConfigurationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, token: token).ConfigureAwait(false))
            {
                string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                string path = tenantPath + "/usage-quotas";
                UsageQuota quota = Quota("spoofed", UsageQuotaScopeEnum.Tenant, String.Empty);
                quota.DailyRunLimit = 0;
                quota.DailyCostUsdLimit = 0.25;
                UsageQuota created = await HttpTestHelpers.SendAsync<UsageQuota>(host.AdminClient, HttpMethod.Post, path, quota, 201, token).ConfigureAwait(false);
                Assert.Equal(host.TenantId, created.TenantId, "Owning tenant");
                Assert.Equal(host.TenantId, created.ResourceId, "Default tenant target");
                Assert.True(created.Id.StartsWith("uqt_", StringComparison.Ordinal), "Quota prefix");
                UsageQuotaUsage usage = await HttpTestHelpers.SendAsync<UsageQuotaUsage>(host.AdminClient, HttpMethod.Get, path + "/" + created.Id + "/usage", null, 200, token).ConfigureAwait(false);
                Assert.True(usage.CostAccountingComplete && usage.RunsUsed == 0 && usage.WindowStartUtc.Hour == 0 && usage.WindowEndUtc - usage.WindowStartUtc == TimeSpan.FromDays(1), "Empty UTC day");
                HarnessProfile fake = Assert.NotNull(await host.Server.Context.Database.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/fake", token).ConfigureAwait(false), "Fake profile");
                Agent agent = await host.Server.Context.Database.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "quota-refused" }, token).ConfigureAwait(false);
                await host.Server.Context.Database.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, Name = "quota-refused-fake", AgentId = agent.Id, HarnessProfileId = fake.Id }, token).ConfigureAwait(false);
                TestResponse denied = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, tenantPath + "/agents/" + agent.Id + "/invoke", new InvokeRequest { Input = "refused", Wait = false }, token).ConfigureAwait(false);
                Assert.Equal(429, denied.StatusCode, "Admission refusal is 429");
                Assert.True(denied.Body.Contains("QuotaExceeded", StringComparison.Ordinal) && denied.Body.Contains("dailyRunLimit", StringComparison.Ordinal), "Refusal names the limit");
                using (HttpResponseMessage retry = await host.AdminClient.PostAsync(tenantPath + "/agents/" + agent.Id + "/invoke", new StringContent("{\"input\":\"refused\",\"wait\":false}", System.Text.Encoding.UTF8, "application/json"), token).ConfigureAwait(false))
                {
                    Assert.True(retry.Headers.RetryAfter != null, "Refusal gives Retry-After");
                }
                created.DailyRunLimit = null;
                created.MaxConcurrentRuns = 2;
                UsageQuota updated = await HttpTestHelpers.SendAsync<UsageQuota>(host.AdminClient, HttpMethod.Put, path + "/" + created.Id, created, 200, token).ConfigureAwait(false);
                Assert.True(updated.DailyRunLimit == null && updated.MaxConcurrentRuns == 2, "Nullable and integer limits round trip");
                UsageQuota duplicate = Quota(host.TenantId, UsageQuotaScopeEnum.Tenant, host.TenantId);
                duplicate.Name = "duplicate-target";
                Assert.Equal(409, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, duplicate, token).ConfigureAwait(false)).StatusCode, "Duplicate target");
                Assert.Equal(400, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, "{\"name\":\"bad\",\"dailyRunLimit\":-1}", token).ConfigureAwait(false)).StatusCode, "Invalid limit");
                UsageQuota invalid = Quota(host.TenantId, UsageQuotaScopeEnum.Agent, "agt_not_in_this_tenant");
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, invalid, token).ConfigureAwait(false)).StatusCode, "Target existence does not leak");
                Tenant other = await host.Server.Context.Database.Tenants.CreateAsync(new Tenant { Name = "quota-other" }, token).ConfigureAwait(false);
                Assert.Equal(404, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/usage-quotas/" + created.Id + "/usage", null, token).ConfigureAwait(false)).StatusCode, "Usage is isolated");
                foreach (string role in new[] { "Viewer", "Editor", "AgentOperator" })
                {
                    string email = role.ToLowerInvariant() + "@quota.example";
                    User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, tenantPath + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, tenantPath + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = role }, 201, token).ConfigureAwait(false);
                    using (HttpClient client = await host.UserClientAsync(email, "password123", token: token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, path + "/" + created.Id + "/usage", null, token).ConfigureAwait(false)).StatusCode, role + " can inspect usage");
                        Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Put, path + "/" + created.Id, created, token).ConfigureAwait(false)).StatusCode, role + " cannot raise limits");
                    }
                }
                Assert.Equal(204, (await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, path + "/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, "Delete quota");
            }
        }

        private static async Task AdmissionsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            foreach (UsageQuotaScopeEnum scope in Enum.GetValues<UsageQuotaScopeEnum>())
            {
                DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
                using (DatabaseDriverBase db = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
                using (DatabaseDriverBase replica = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
                {
                    string target = scope == UsageQuotaScopeEnum.Tenant ? "ten_quota" : scope == UsageQuotaScopeEnum.Agent ? "agt_quota" : "dep_quota";
                    UsageQuota quota = Quota("ten_quota", scope, target);
                    quota.DailyRunLimit = 5;
                    quota = await db.UsageQuotas.CreateAsync(quota, token).ConfigureAwait(false);
                    Task<Run?>[] tasks = Enumerable.Range(0, 20).Select(i => AdmitAsync(i % 2 == 0 ? db : replica, Fixture("ten_quota"), token)).ToArray();
                    Run?[] runs = await Task.WhenAll(tasks).ConfigureAwait(false);
                    Assert.Equal(5, runs.Count(r => r != null), "Exactly five admissions across replicas: " + scope);
                    UsageQuotaUsage usage = await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false);
                    Assert.Equal(5L, usage.RunsUsed, "Distinct admissions counted");
                    foreach (Run? run in runs.Where(r => r != null)) await db.Runs.DeleteAsync(run!.Id, token).ConfigureAwait(false);
                    Assert.True(await AdmitAsync(db, Fixture("ten_quota"), token).ConfigureAwait(false) == null, "Deleting runs does not reset quota");
                    Run outside = Fixture(scope == UsageQuotaScopeEnum.Tenant ? "ten_other" : "ten_quota", "agt_other", "dep_other");
                    Assert.NotNull(await AdmitAsync(db, outside, token).ConfigureAwait(false), "Other scope admitted");
                    // A request queued before midnight but admitted after the tenant lock counts in the admission day.
                    quota.DailyRunLimit = 6;
                    await db.UsageQuotas.UpdateAsync(quota, token).ConfigureAwait(false);
                    Run keyed = Fixture("ten_quota");
                    keyed.QueuedUtc = DateTime.UtcNow.AddDays(-1);
                    keyed.IdempotencyKey = "quota-key";
                    keyed.CallerId = "usr_quota";
                    Run accepted = await db.Runs.CreateAsync(keyed, token).ConfigureAwait(false);
                    Run again = Fixture("ten_quota");
                    again.IdempotencyKey = keyed.IdempotencyKey;
                    again.CallerId = keyed.CallerId;
                    Run replay = await replica.Runs.CreateAsync(again, token).ConfigureAwait(false);
                    Assert.Equal(accepted.Id, replay.Id, "Replay at exhausted quota returns existing run");
                    Assert.Equal(6L, (await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false)).RunsUsed, "Replay not charged twice");
                }
            }
        }

        private static async Task<Run?> AdmitAsync(DatabaseDriverBase db, Run run, CancellationToken token)
        {
            try { return await db.Runs.CreateAsync(run, token).ConfigureAwait(false); }
            catch (QuotaExceededException e)
            {
                Assert.Equal("QuotaExceeded", e.Code, "Typed rejection");
                Assert.Equal("dailyRunLimit", e.LimitName, "Limit named");
                return null;
            }
        }

        private static async Task ClaimsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            foreach (UsageQuotaScopeEnum scope in Enum.GetValues<UsageQuotaScopeEnum>())
            {
                DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
                using (DatabaseDriverBase db = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
                using (DatabaseDriverBase replica = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
                {
                    List<Run> runs = new List<Run>();
                    for (int i = 0; i < 12; i++) runs.Add(await db.Runs.CreateAsync(Fixture("ten_quota"), token).ConfigureAwait(false));
                    string target = scope == UsageQuotaScopeEnum.Tenant ? "ten_quota" : scope == UsageQuotaScopeEnum.Agent ? "agt_quota" : "dep_quota";
                    UsageQuota quota = Quota("ten_quota", scope, target);
                    quota.MaxConcurrentRuns = 2;
                    quota = await db.UsageQuotas.CreateAsync(quota, token).ConfigureAwait(false);
                    Task<long?>[] claims = runs.Select((run, i) => (i % 2 == 0 ? db : replica).Runs.TryClaimAsync(run.Id, "nod_" + i, "node", DateTime.UtcNow.AddMinutes(5), token)).ToArray();
                    long?[] epochs = await Task.WhenAll(claims).ConfigureAwait(false);
                    Assert.Equal(2, epochs.Count(e => e.HasValue), "Exactly two active claims: " + scope);
                    UsageQuotaUsage historical = await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow.AddDays(-1), token).ConfigureAwait(false);
                    Assert.Equal(2L, historical.ActiveRuns, "Concurrency ignores accounting day");
                    int first = Array.FindIndex(epochs, e => e.HasValue);
                    Run active = Assert.NotNull(await db.Runs.ReadAsync(runs[first].Id, token).ConfigureAwait(false), "Active fixture");
                    active.Status = RunStatusEnum.Succeeded;
                    active.CompletedUtc = DateTime.UtcNow;
                    active.CostUsd = 0;
                    Assert.True(await db.Runs.CompleteAsync(active, "nod_" + first, epochs[first]!.Value, token).ConfigureAwait(false), "Release active slot");
                    Run queued = runs[Array.FindIndex(epochs, e => !e.HasValue)];
                    Assert.True((await db.Runs.TryClaimAsync(queued.Id, "nod_next", "node", DateTime.UtcNow.AddMinutes(5), token).ConfigureAwait(false)).HasValue, "Another claim fits after completion");
                }
            }
        }

        private static async Task MetersAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                UsageQuota quota = Quota("ten_quota", UsageQuotaScopeEnum.Tenant, "ten_quota");
                quota.DailyCostUsdLimit = 1;
                quota = await db.UsageQuotas.CreateAsync(quota, token).ConfigureAwait(false);
                Run previous = Fixture("ten_quota");
                previous.QueuedUtc = DateTime.UtcNow.Date.AddDays(-1).AddHours(23);
                previous.CompletedUtc = DateTime.UtcNow;
                previous.Status = RunStatusEnum.Succeeded;
                previous.InputTokens = 100;
                previous.OutputTokens = 10;
                previous.CachedTokens = 20;
                previous.HarnessType = HarnessTypeEnum.ClaudeCode;
                previous.CostUsd = 0.25;
                previous = await db.Runs.CreateAsync(previous, token).ConfigureAwait(false);
                // Simulate a run created by an older replica after the schema backfill, before its rollout finishes.
                AdoDatabaseDriver ado = (AdoDatabaseDriver)db;
                await ado.NonQueryAsync("DELETE FROM " + ado.Table("run_usage") + " WHERE runid = @id;", c => AdoDatabaseDriver.Add(c, "id", previous.Id), token).ConfigureAwait(false);
                Run unknown = Fixture("ten_quota");
                unknown.CompletedUtc = DateTime.UtcNow;
                unknown.Status = RunStatusEnum.Succeeded;
                unknown.InputTokens = 50;
                unknown.CostUsd = null;
                unknown = await db.Runs.CreateAsync(unknown, token).ConfigureAwait(false);
                UsageQuotaUsage today = await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false);
                Assert.Equal(1L, today.RunsUsed, "Runs count admission day");
                Assert.Equal(180L, today.TokensUsed, "Tokens count completion day including separate cache");
                Assert.Equal(0.25, today.CostUsd, "Known cost");
                Assert.True(!today.CostAccountingComplete && today.UnknownCostRuns == 1, "Unknown cost is visible");
                Assert.NotNull(await db.Runs.CreateAsync(Fixture("ten_quota"), token).ConfigureAwait(false), "Unknown cost permits admission");
                await db.Runs.DeleteAsync(previous.Id, token).ConfigureAwait(false);
                await db.Runs.PurgeAsync(unknown.Id, token).ConfigureAwait(false);
                UsageQuotaUsage retained = await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false);
                Assert.Equal(today.TokensUsed, retained.TokensUsed, "Delete and retention keep token usage");
                Assert.Equal(today.CostUsd, retained.CostUsd, "Delete keeps cost usage");
                Assert.Equal(today.UnknownCostRuns, retained.UnknownCostRuns, "Unknown cost survives deletion");
                UsageQuotaUsage tomorrow = await db.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow.AddDays(1), token).ConfigureAwait(false);
                Assert.True(tomorrow.RunsUsed == 0 && tomorrow.TokensUsed == 0 && tomorrow.CostUsd == 0 && tomorrow.CostAccountingComplete, "Next UTC day resets meters");
                quota.DailyTokenLimit = 180;
                await db.UsageQuotas.UpdateAsync(quota, token).ConfigureAwait(false);
                bool refused = false;
                try { await db.Runs.CreateAsync(Fixture("ten_quota"), token).ConfigureAwait(false); }
                catch (QuotaExceededException e) { refused = e.LimitName == "dailyTokenLimit"; }
                Assert.True(refused, "Token limit enforced even with unknown cost");
                quota.DailyTokenLimit = null;
                quota.DailyCostUsdLimit = 0.25;
                await db.UsageQuotas.UpdateAsync(quota, token).ConfigureAwait(false);
                refused = false;
                try { await db.Runs.CreateAsync(Fixture("ten_quota"), token).ConfigureAwait(false); }
                catch (QuotaExceededException e) { refused = e.LimitName == "dailyCostUsdLimit"; }
                Assert.True(refused, "Known cost limit enforced");
            }
        }

        private static async Task BudgetAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, token: token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                HarnessProfile profile = Assert.NotNull(await db.HarnessProfiles.ReadByNameAsync(host.TenantId, "builtin/claude-code", token).ConfigureAwait(false), "Claude profile");
                Agent agent = await db.Agents.CreateAsync(new Agent { TenantId = host.TenantId, Name = "quota-agent" }, token).ConfigureAwait(false);
                Deployment deployment = await db.Deployments.CreateAsync(new Deployment { TenantId = host.TenantId, AgentId = agent.Id, Name = "quota-deployment", HarnessProfileId = profile.Id, MaxBudgetUsd = 10 }, token).ConfigureAwait(false);
                UsageQuota tenant = Quota(host.TenantId, UsageQuotaScopeEnum.Tenant, host.TenantId);
                tenant.DailyCostUsdLimit = 5;
                await db.UsageQuotas.CreateAsync(tenant, token).ConfigureAwait(false);
                UsageQuota agentQuota = Quota(host.TenantId, UsageQuotaScopeEnum.Agent, agent.Id);
                agentQuota.DailyCostUsdLimit = 2;
                await db.UsageQuotas.CreateAsync(agentQuota, token).ConfigureAwait(false);
                CompilationResult compiled = await host.Server.Context.Get<InvocationCompiler>().PreviewAsync(host.TenantId, deployment.Id, "sample", null, token).ConfigureAwait(false);
                int budgetIndex = compiled.Spec.Arguments.IndexOf("--max-budget-usd");
                Assert.True(budgetIndex >= 0 && compiled.Spec.Arguments[budgetIndex + 1] == "2", "Smallest allowance in Claude CLI arguments");
                Assert.Equal(10.0, Assert.NotNull(await db.Deployments.ReadAsync(host.TenantId, deployment.Id, token).ConfigureAwait(false), "Saved deployment").MaxBudgetUsd!.Value, "Compilation never rewrites configuration");
                Run repair = Fixture(host.TenantId, agent.Id, deployment.Id);
                repair.CostUsd = 0.5;
                Deployment copy = new Deployment { MaxBudgetUsd = 1 };
                await new UsageQuotaPolicy(db).ApplyBudgetAsync(copy, repair, token).ConfigureAwait(false);
                Assert.Equal(1.0, copy.MaxBudgetUsd!.Value, "A quota never raises the deployment cap");
                copy.MaxBudgetUsd = null;
                await new UsageQuotaPolicy(db).ApplyBudgetAsync(copy, repair, token).ConfigureAwait(false);
                Assert.Equal(1.5, copy.MaxBudgetUsd!.Value, "Prior repair cost deducted");
            }
        }
    }
}
