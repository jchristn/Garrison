namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Operator prices, cost arithmetic, and persisted completion estimates.</summary>
    public static class PricingSuite
    {
        /// <summary>Build suites for selected providers.</summary>
        /// <returns>Suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            suites.Add(new TestSuiteDescriptor("pricing", "Cost arithmetic", new List<TestCaseDescriptor>
            {
                new TestCaseDescriptor("pricing", "token-conventions", "Cache and reasoning counts never double charge included tokens", ArithmeticAsync)
            }));
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "pricing-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Model prices (" + provider + ")", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "configuration", "Prices start empty, round trip, reject invalid/duplicate entries, and isolate tenants", ct => ConfigurationAsync(provider, ct)),
                    new TestCaseDescriptor(id, "completion", "Reported costs win; exact active prices estimate missing cost and repairs accumulate once", ct => CompletionAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static ModelPrice Price(string tenantId)
        {
            return new ModelPrice { TenantId = tenantId, Name = "fixture-price", Model = "fixture-model", HarnessType = HarnessTypeEnum.Generic,
                InputUsdPerMillion = 2, OutputUsdPerMillion = 10, CachedInputUsdPerMillion = 0.5, ReasoningUsdPerMillion = 20 };
        }

        private static Task ArithmeticAsync(CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            ModelPrice price = Price("tenant");
            Assert.Equal(0.0127, RunCostCalculator.Estimate(price, 1000, 1000, 200, 100), "Included token cost");
            price.InputIncludesCachedTokens = false;
            price.OutputIncludesReasoningTokens = false;
            Assert.Equal(0.0141, RunCostCalculator.Estimate(price, 1000, 1000, 200, 100), "Separate token cost");
            price.InputIncludesCachedTokens = true;
            price.OutputIncludesReasoningTokens = true;
            price.CachedInputUsdPerMillion = null;
            price.ReasoningUsdPerMillion = null;
            Assert.Equal(0.012, RunCostCalculator.Estimate(price, 1000, 1000, 200, 100), "Fallback rates");
            Assert.Equal(0.012, RunCostCalculator.Estimate(price, 1000, 1000, 2000, 2000), "Included subtotals capped");
            Assert.Equal(0.0, RunCostCalculator.Estimate(price, -1, -2, -3, -4), "Negative counts clamped");
            price.InputUsdPerMillion = 1000000000;
            Assert.True(Double.IsFinite(RunCostCalculator.Estimate(price, Int64.MaxValue, Int64.MaxValue, 0, 0)), "Large counts stay finite");
            foreach (double invalid in new[] { -1.0, Double.NaN, Double.PositiveInfinity, 1000000001.0 })
            {
                bool rejected = false;
                try { price.InputUsdPerMillion = invalid; }
                catch (ArgumentOutOfRangeException) { rejected = true; }
                Assert.True(rejected, "Invalid rate rejected: " + invalid);
            }
            return Task.CompletedTask;
        }

        private static async Task ConfigurationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                string path = "/v1.0/api/tenants/" + host.TenantId + "/model-prices";
                EnumerationResult<ModelPrice> empty = await HttpTestHelpers.SendAsync<EnumerationResult<ModelPrice>>(host.AdminClient, HttpMethod.Get, path, null, 200, token).ConfigureAwait(false);
                Assert.Equal(0, empty.Objects.Count, "No seeded prices");
                ModelPrice price = Price("spoofed");
                price.Model = " fixture-model ";
                ModelPrice created = await HttpTestHelpers.SendAsync<ModelPrice>(host.AdminClient, HttpMethod.Post, path, price, 201, token).ConfigureAwait(false);
                Assert.Equal(host.TenantId, created.TenantId, "Route owns tenant");
                Assert.True(created.Id.StartsWith("mpr_", StringComparison.Ordinal), "Price prefix");
                ModelPrice read = await HttpTestHelpers.SendAsync<ModelPrice>(host.AdminClient, HttpMethod.Get, path + "/" + created.Id, null, 200, token).ConfigureAwait(false);
                Assert.Equal(0.5, read.CachedInputUsdPerMillion!.Value, "Cache rate persisted");
                Assert.Equal("fixture-model", read.Model, "Model trimmed");
                price.Name = "duplicate-pair";
                TestResponse duplicate = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, price, token).ConfigureAwait(false);
                Assert.Equal(409, duplicate.StatusCode, "Unique tenant/harness/model");
                TestResponse invalid = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Post, path, "{\"name\":\"bad-rate\",\"model\":\"bad\",\"inputUsdPerMillion\":-1}", token).ConfigureAwait(false);
                Assert.Equal(400, invalid.StatusCode, "Invalid rate is a client error");
                created.InputIncludesCachedTokens = false;
                created.OutputIncludesReasoningTokens = false;
                created.CachedInputUsdPerMillion = null;
                created.ReasoningUsdPerMillion = 0;
                ModelPrice updated = await HttpTestHelpers.SendAsync<ModelPrice>(host.AdminClient, HttpMethod.Put, path + "/" + created.Id, created, 200, token).ConfigureAwait(false);
                Assert.True(!updated.InputIncludesCachedTokens && !updated.OutputIncludesReasoningTokens && updated.CachedInputUsdPerMillion == null && updated.ReasoningUsdPerMillion == 0, "Flags and optional zero/null rates round trip");
                foreach (string roleName in new[] { "Viewer", "AgentOperator", "Editor" })
                {
                    string tenantPath = "/v1.0/api/tenants/" + host.TenantId;
                    string email = roleName.ToLowerInvariant() + "@pricing.example";
                    User user = await HttpTestHelpers.SendAsync<User>(host.AdminClient, HttpMethod.Post, tenantPath + "/users", new UserRequest { Email = email, Password = "password123" }, 201, token).ConfigureAwait(false);
                    await HttpTestHelpers.SendAsync<UserRoleAssignment>(host.AdminClient, HttpMethod.Post, tenantPath + "/user-role-assignments", new AssignmentRequest { UserId = user.Id, RoleName = roleName }, 201, token).ConfigureAwait(false);
                    using (HttpClient client = await host.UserClientAsync(email, "password123", token: token).ConfigureAwait(false))
                    {
                        Assert.Equal(200, (await HttpTestHelpers.SendAsync(client, HttpMethod.Get, path, null, token).ConfigureAwait(false)).StatusCode, roleName + " reads prices");
                        ModelPrice entry = Price(host.TenantId);
                        entry.Name = roleName.ToLowerInvariant() + "-price";
                        entry.Model = roleName + "-model";
                        TestResponse write = await HttpTestHelpers.SendAsync(client, HttpMethod.Post, path, entry, token).ConfigureAwait(false);
                        Assert.Equal(roleName == "Editor" ? 201 : 403, write.StatusCode, roleName + " write permission");
                        if (roleName != "Editor")
                        {
                            Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Put, path + "/" + created.Id, created, token).ConfigureAwait(false)).StatusCode, roleName + " cannot update");
                            Assert.Equal(403, (await HttpTestHelpers.SendAsync(client, HttpMethod.Delete, path + "/" + created.Id, null, token).ConfigureAwait(false)).StatusCode, roleName + " cannot delete");
                        }
                    }
                }
                DatabaseDriverBase db = host.Server.Context.Database;
                Tenant other = await db.Tenants.CreateAsync(new Tenant { Name = "other-pricing" }, token).ConfigureAwait(false);
                TestResponse isolated = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Get, "/v1.0/api/tenants/" + other.Id + "/model-prices/" + created.Id, null, token).ConfigureAwait(false);
                Assert.Equal(404, isolated.StatusCode, "Cross-tenant price read");
                Assert.True(await db.ModelPrices.ReadByModelAsync(other.Id, HarnessTypeEnum.Generic, created.Model, token).ConfigureAwait(false) == null, "Cross-tenant model lookup");
                TestResponse deleted = await HttpTestHelpers.SendAsync(host.AdminClient, HttpMethod.Delete, path + "/" + created.Id, null, token).ConfigureAwait(false);
                Assert.Equal(204, deleted.StatusCode, "Delete price");
            }
        }

        private static async Task CompletionAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (TestServerHost host = await TestServerHost.StartAsync(provider, null, token).ConfigureAwait(false))
            {
                DatabaseDriverBase db = host.Server.Context.Database;
                ModelPrice price = await db.ModelPrices.CreateAsync(Price(host.TenantId), token).ConfigureAwait(false);
                RunCostEstimationService estimator = new RunCostEstimationService(db);
                Run probe = new Run { TenantId = host.TenantId, HarnessType = HarnessTypeEnum.Generic };
                foreach (string model in new[] { "unknown-model", "FIXTURE-MODEL", "" })
                {
                    RunCompleteRequest unknown = new RunCompleteRequest { ServedModel = model, InputTokens = 1000 };
                    await estimator.ApplyAsync(probe, unknown, token).ConfigureAwait(false);
                    Assert.True(unknown.CostUsd == null && !unknown.CostEstimated, "Unknown exact model leaves cost unknown");
                }
                probe.HarnessType = HarnessTypeEnum.ClaudeCode;
                RunCompleteRequest wrongHarness = new RunCompleteRequest { ServedModel = price.Model, InputTokens = 1000 };
                await estimator.ApplyAsync(probe, wrongHarness, token).ConfigureAwait(false);
                Assert.True(wrongHarness.CostUsd == null, "Harness mismatch");
                probe.HarnessType = HarnessTypeEnum.Generic;
                price.Active = false;
                await db.ModelPrices.UpdateAsync(price, token).ConfigureAwait(false);
                await estimator.ApplyAsync(probe, wrongHarness, token).ConfigureAwait(false);
                Assert.True(wrongHarness.CostUsd == null, "Disabled price");
                price.Active = true;
                await db.ModelPrices.UpdateAsync(price, token).ConfigureAwait(false);
                foreach (double? reported in new double?[] { null, 0, 1.23 })
                {
                    Run saved = await FinishAsync(host, reported, false, token).ConfigureAwait(false);
                    Assert.Equal(reported ?? 0.0127, saved.CostUsd!.Value, "Persisted completion cost");
                    Assert.Equal(!reported.HasValue, saved.CostEstimated, "Reported cost takes precedence including zero");
                }
                Run repaired = await FinishAsync(host, null, true, token).ConfigureAwait(false);
                Assert.Equal(0.0254, repaired.CostUsd!.Value, "Repair phase added once");
                Assert.Equal(2000L, repaired.InputTokens, "Repair usage accumulation");
                await db.ModelPrices.DeleteAsync(price.Id, token).ConfigureAwait(false);
                Run preserved = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, repaired.Id, token).ConfigureAwait(false), "Saved run");
                Assert.Equal(repaired.CostUsd, preserved.CostUsd, "Deleting a price preserves historical cost");
            }
        }

        private static async Task<Run> FinishAsync(TestServerHost host, double? reported, bool repair, CancellationToken token)
        {
            DatabaseDriverBase db = host.Server.Context.Database;
            Run run = await db.Runs.CreateAsync(new Run { TenantId = host.TenantId, AgentId = "agt_pricing", AgentName = "pricing", DeploymentId = "dep_pricing", HarnessType = HarnessTypeEnum.Generic, Status = RunStatusEnum.Queued }, token).ConfigureAwait(false);
            long? epoch = await db.Runs.TryClaimAsync(run.Id, "nod_pricing", "pricing", DateTime.UtcNow.AddMinutes(10), token).ConfigureAwait(false);
            Assert.True(epoch.HasValue, "Claimed fixture run");
            RunEventService events = host.Server.Context.Get<RunEventService>();
            await events.StartedAsync(run.Id, new RunStartedRequest { NodeId = "nod_pricing", Epoch = epoch!.Value }, token).ConfigureAwait(false);
            if (repair)
            {
                run = Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false), "Running fixture");
                run.RepairAttempts = 1;
                run.InputTokens = 1000;
                run.OutputTokens = 1000;
                run.CostUsd = 0.0127;
                run.CostEstimated = true;
                run.ServedModel = "fixture-model";
                Assert.True(await db.Runs.RecordRepairAsync(run, "nod_pricing", epoch.Value, token).ConfigureAwait(false), "Recorded prior repair usage");
            }
            await events.CompleteAsync(run.Id, new RunCompleteRequest { NodeId = "nod_pricing", Epoch = epoch.Value, Status = RunStatusEnum.Succeeded, ServedModel = repair ? null : "fixture-model", InputTokens = 1000, OutputTokens = 1000, CachedTokens = 200, ReasoningTokens = 100, CostUsd = reported, RepairAttempt = repair ? 1 : 0 }, token).ConfigureAwait(false);
            return Assert.NotNull(await db.Runs.ReadAsync(host.TenantId, run.Id, token).ConfigureAwait(false), "Completed fixture");
        }
    }
}
