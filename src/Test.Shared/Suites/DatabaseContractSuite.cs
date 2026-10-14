namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>
    /// Shared database contract tests run against every selected provider.
    /// </summary>
    public static class DatabaseContractSuite
    {
        /// <summary>
        /// Build the suite for one provider.
        /// </summary>
        /// <param name="provider">Provider.</param>
        /// <returns>Suite.</returns>
        public static TestSuiteDescriptor Build(DatabaseTypeEnum provider)
        {
            string suiteId = "db-" + provider.ToString().ToLowerInvariant();
            List<TestCaseDescriptor> cases = new List<TestCaseDescriptor>();
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-twice", "Migrations are idempotent (" + provider + ")", ct => MigrateTwiceAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v1-upgrade", "A version 1 database upgrades to the latest version and keeps its runs (" + provider + ")", ct => UpgradeFromVersion1Async(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v12-approvals", "A conversation database upgrades from version 12 to approvals without losing its session (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v13-pricing", "An approvals database upgrades to an empty configurable price table (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 13)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v15-optin", "Existing active quotas upgrade from schema 15 with enforcement disabled (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 15)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v17-warm", "Existing executor reports upgrade with warm support disabled (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 17)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v16-capabilities", "Legacy executor names upgrade without inventing capability promises (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 16)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v20-pipelines", "A version 20 database upgrades to pipelines: runs gain empty pipeline columns and pipeline tables work (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 20)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v21-child-waits", "A version 21 database upgrades to delegation capacity: nodes report no child reserve until they register again, and wait records work (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 21)));
            cases.Add(new TestCaseDescriptor(suiteId, "migrate-v22-trust", "A version 22 database upgrades to trust levels: existing deployments and runs read back Trusted and tenants do not require Untrusted (" + provider + ")", ct => UpgradeConversationsAsync(provider, ct, 22)));
            cases.Add(new TestCaseDescriptor(suiteId, "child-waits", "Delegation waits: the node waiter cap, a parent's parallel waits, the queue depth, finished children, pruning, and waiting ancestors left out of a deployment's limit (" + provider + ")", ct => ChildWaitsAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "pipeline-cas", "Pipelines: definition children round-trip in order, tenant reads are isolated, stage claims, links, pipeline run transitions, and review decisions are compare-and-set, one review per stage execution, idempotent pipeline run creation (" + provider + ")", ct => PipelineCasAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "run-telemetry-roundtrip", "Run timing telemetry round-trips through create, complete, and update (" + provider + ")", ct => RunTelemetryRoundTripAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "tenant-crud", "Tenant create, read, update, enumerate, delete (" + provider + ")", ct => TenantCrudAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "children-roundtrip", "Harness profile child rows round-trip in order (" + provider + ")", ct => ChildrenRoundTripAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "scalar-children-order", "Scalar child lists keep insertion order (" + provider + ")", ct => ScalarChildrenOrderAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "tenant-isolation", "Tenant-scoped reads do not leak across tenants (" + provider + ")", ct => TenantIsolationAsync(provider, ct)));
            cases.Add(new TestCaseDescriptor(suiteId, "builtin-visibility", "Built-in records are visible to every tenant and tenant records win by name (" + provider + ")", ct => BuiltInVisibilityAsync(provider, ct)));
            return new TestSuiteDescriptor(suiteId, "Database contract (" + provider + ")", cases);
        }

        private static async Task MigrateTwiceAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            int firstVersion = 0;
            using (DatabaseDriverBase first = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.True(await first.PingAsync(token).ConfigureAwait(false), "Ping failed after first initialization.");
                firstVersion = first.SchemaVersion;
                Assert.Equal(SchemaBuilder.LatestVersion, firstVersion, "Schema version after first initialization");
            }
            using (DatabaseDriverBase second = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.True(await second.PingAsync(token).ConfigureAwait(false), "Ping failed after second initialization.");
                Assert.Equal(firstVersion, second.SchemaVersion, "Schema version after second initialization");
            }
        }

        private static async Task UpgradeConversationsAsync(DatabaseTypeEnum provider, CancellationToken token, int fromVersion = 12)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            Conversation conversation = new Conversation();
            conversation.Id = "cnv_upgrade";
            conversation.TenantId = "ten_upgrade";
            conversation.AgentId = "agt_upgrade";
            conversation.AgentName = "upgrade";
            conversation.HarnessType = HarnessTypeEnum.ClaudeCode;
            conversation.SessionId = "session-before-approvals";
            conversation.TurnCount = 2;
            using (DatabaseDriverBase raw = DatabaseDriverFactory.Create(settings))
            {
                AdoDatabaseDriver ado = (AdoDatabaseDriver)raw;
                if (!String.IsNullOrEmpty(ado.Catalog.Schema))
                {
                    string? createSchema = ado.Dialect.CreateSchemaStatement(ado.Catalog.Schema!);
                    if (createSchema != null) await ado.NonQueryAsync(createSchema, null, token).ConfigureAwait(false);
                }
                await ado.NonQueryAsync(SchemaBuilder.MigrationsTableDdl(ado.Catalog, ado.Dialect), null, token).ConfigureAwait(false);
                foreach (SchemaMigration migration in SchemaBuilder.Build(ado.Catalog, ado.Dialect).Where(m => m.Version <= fromVersion))
                {
                    foreach (SchemaColumnAddition column in migration.Columns)
                    {
                        await ado.NonQueryAsync(ado.Dialect.AddColumn(ado.Catalog.Schema, ado.Catalog.RawName(column.Table), column.Column, column.Definition), null, token).ConfigureAwait(false);
                    }
                    foreach (string statement in migration.Statements) await ado.NonQueryAsync(statement, null, token).ConfigureAwait(false);
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("schema_migrations") + " (version, description, appliedutc) VALUES (@v, @d, @t);", c =>
                    {
                        AdoDatabaseDriver.Add(c, "v", migration.Version);
                        AdoDatabaseDriver.Add(c, "d", migration.Description);
                        AdoDatabaseDriver.Add(c, "t", DateTime.UtcNow);
                    }, token).ConfigureAwait(false);
                }
                if (fromVersion == 15)
                {
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("usage_quotas") + " (id, tenantid, name, scope, resourceid, dailyrunlimit, active, isprotected, createdutc, lastupdateutc) VALUES ('uqt_upgrade', 'ten_upgrade', 'upgrade-quota', 'Tenant', 'ten_upgrade', 0, " + ado.Dialect.BooleanLiteral(true) + ", " + ado.Dialect.BooleanLiteral(false) + ", @now, @now);", c => AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow), token).ConfigureAwait(false);
                }
                if (fromVersion == 21)
                {
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("nodes") + " (id, name, status, maxconcurrentruns, activeruns, active, isprotected, supportsmcptests, createdutc, lastupdateutc) VALUES ('nod_upgrade', 'upgrade-node', 'Ready', 3, 0, "
                        + ado.Dialect.BooleanLiteral(true) + ", " + ado.Dialect.BooleanLiteral(false) + ", " + ado.Dialect.BooleanLiteral(false) + ", @now, @now);", c => AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow), token).ConfigureAwait(false);
                }
                if (fromVersion == 22)
                {
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("tenants") + " (id, name, active, isprotected, createdutc, lastupdateutc) VALUES ('ten_trust', 'trust-upgrade', "
                        + ado.Dialect.BooleanLiteral(true) + ", " + ado.Dialect.BooleanLiteral(false) + ", @now, @now);", c => AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow), token).ConfigureAwait(false);
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("deployments") + " (id, tenantid, agentid, name, harnessprofileid, maxconcurrentruns, maxattempts, retryonnodeloss, weight, configversion, active, isprotected, createdutc, lastupdateutc) VALUES ('dep_trust', 'ten_trust', 'agt_trust', 'legacy', 'hpf_trust', 0, 1, "
                        + ado.Dialect.BooleanLiteral(false) + ", 100, 1, " + ado.Dialect.BooleanLiteral(true) + ", " + ado.Dialect.BooleanLiteral(false) + ", @now, @now);", c => AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow), token).ConfigureAwait(false);
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("runs") + " (id, tenantid, agentid, agentname, deploymentid, deploymentversion, harnesstype, kind, status, outcome, priority, callertype, depth, attempt, maxattempts, leaseepoch, "
                        + "queuedutc, cancelrequested, inputtokens, outputtokens, cachedtokens, costestimated, lasteventsequence, active, isprotected, createdutc, lastupdateutc) VALUES "
                        + "('run_trust', 'ten_trust', 'agt_trust', 'legacy', 'dep_trust', 1, 'Generic', 'Invoke', 'Queued', 'None', 0, 'User', 0, 1, 1, 0, @now, @false, 0, 0, 0, @false, 0, @true, @false, @now, @now);", c =>
                        {
                            AdoDatabaseDriver.Add(c, "now", DateTime.UtcNow);
                            AdoDatabaseDriver.Add(c, "false", false);
                            AdoDatabaseDriver.Add(c, "true", true);
                        }, token).ConfigureAwait(false);
                }
                if (fromVersion == 16 || fromVersion == 17)
                {
                    await ado.NonQueryAsync("INSERT INTO " + ado.Table("node_executors") + " (id, nodeid, executor) VALUES ('exe_legacy', 'nod_legacy', 'KubernetesJob');", null, token).ConfigureAwait(false);
                    if (fromVersion == 17)
                        await ado.NonQueryAsync("UPDATE " + ado.Table("node_executors") + " SET capreported = " + ado.Dialect.BooleanLiteral(true) + ", capisolation = 1, capcoldstartclass = 'Cold' WHERE id = 'exe_legacy';", null, token).ConfigureAwait(false);
                }
                await raw.Conversations.CreateAsync(conversation, token).ConfigureAwait(false);
            }
            using (DatabaseDriverBase upgraded = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(SchemaBuilder.LatestVersion, upgraded.SchemaVersion, "Approvals migration applies after conversations");
                Assert.Equal(SchemaBuilder.Build(((AdoDatabaseDriver)upgraded).Catalog, ((AdoDatabaseDriver)upgraded).Dialect).Count(m => m.Version > fromVersion), upgraded.MigrationsApplied, "Only migrations after version 12 apply");
                if (fromVersion == 15)
                {
                    UsageQuota quota = Assert.NotNull(await upgraded.UsageQuotas.ReadAsync("ten_upgrade", "uqt_upgrade", token).ConfigureAwait(false), "Existing quota survives upgrade");
                    Assert.True(!quota.EnforcementEnabled && quota.DailyRunLimit == 0 && quota.Active, "Existing active zero quota becomes monitor-only");
                }
                if (fromVersion == 16 || fromVersion == 17)
                {
                    AdoDatabaseDriver ado = (AdoDatabaseDriver)upgraded;
                    List<bool> legacy = await ado.QueryAsync("SELECT * FROM " + ado.Table("node_executors") + " WHERE id = 'exe_legacy';", null,
                        reader => !AdoConverters.Bool(reader, "capwarmstart") && (fromVersion == 17
                            ? AdoConverters.Bool(reader, "capreported") && ExecutorCapabilitySql.Read(reader).ColdStartClass == ExecutorColdStartEnum.Cold
                            : !AdoConverters.Bool(reader, "capreported") && !ExecutorCapabilityRules.RequiresReport(ExecutorCapabilitySql.Read(reader))), token).ConfigureAwait(false);
                    Assert.True(legacy.Count == 1 && legacy[0], "Legacy executor names survive without advanced capability promises");
                }
                if (fromVersion == 21)
                {
                    Node node = Assert.NotNull(await upgraded.Nodes.ReadAsync("nod_upgrade", token).ConfigureAwait(false), "Node after upgrade");
                    Assert.True(node.ChildReserveSlots == 0 && node.MaxResidentWaiters == 0 && node.MaxConcurrentRuns == 3, "An upgraded node has no child reserve until it registers again");
                    Assert.Equal(2, DelegationCapacity.MaxWaiters(node), "Without a reserve, one slot stays free of waiting runs");
                    Run parent = await upgraded.Runs.CreateAsync(new Run { TenantId = "ten_upgrade", AgentId = "agt_upgrade", DeploymentId = "dep_upgrade", Status = RunStatusEnum.Running, LeaseNodeId = "nod_upgrade" }, token).ConfigureAwait(false);
                    ChildWaitAdmission admitted = await upgraded.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_upgrade", ParentRunId = parent.Id, ChildRunId = IdGenerator.NewRunId() }, token).ConfigureAwait(false);
                    Assert.True(admitted.Admitted && admitted.NodeId == "nod_upgrade", "A wait is recorded after the upgrade");
                    Assert.Equal(1L, await upgraded.Runs.CountWaitingOnNodeAsync("nod_upgrade", token).ConfigureAwait(false), "The waiting parent counts on its node");
                }
                if (fromVersion == 22)
                {
                    Deployment legacy = Assert.NotNull(await upgraded.Deployments.ReadAsync("dep_trust", token).ConfigureAwait(false), "Deployment after upgrade");
                    Assert.Equal(DeploymentTrustLevelEnum.Trusted, legacy.TrustLevel, "Existing deployments stay Trusted");
                    Run queuedRun = Assert.NotNull(await upgraded.Runs.ReadAsync("run_trust", token).ConfigureAwait(false), "Run after upgrade");
                    Assert.True(queuedRun.TrustLevel == DeploymentTrustLevelEnum.Trusted && queuedRun.RequiredCapabilities.Isolation == ExecutorIsolationEnum.Process, "Queued runs keep Process placement");
                    Tenant tenant = Assert.NotNull(await upgraded.Tenants.ReadAsync("ten_trust", token).ConfigureAwait(false), "Tenant after upgrade");
                    Assert.True(!tenant.RequireUntrustedDeployments, "Tenants do not require Untrusted after upgrade");
                    legacy.TrustLevel = DeploymentTrustLevelEnum.Untrusted;
                    await upgraded.Deployments.UpdateAsync(legacy, token).ConfigureAwait(false);
                    Assert.Equal(DeploymentTrustLevelEnum.Untrusted, Assert.NotNull(await upgraded.Deployments.ReadAsync("dep_trust", token).ConfigureAwait(false), "Updated deployment").TrustLevel, "Trust level writes after upgrade");
                    tenant.RequireUntrustedDeployments = true;
                    await upgraded.Tenants.UpdateAsync(tenant, token).ConfigureAwait(false);
                    Assert.True(Assert.NotNull(await upgraded.Tenants.ReadAsync("ten_trust", token).ConfigureAwait(false), "Updated tenant").RequireUntrustedDeployments, "Tenant policy writes after upgrade");
                }
                if (fromVersion == 20)
                {
                    Run plain = await upgraded.Runs.CreateAsync(new Run { TenantId = "ten_upgrade", AgentId = "agt_upgrade", DeploymentId = "dep_upgrade", Status = RunStatusEnum.Queued }, token).ConfigureAwait(false);
                    Run stored = Assert.NotNull(await upgraded.Runs.ReadAsync("ten_upgrade", plain.Id, token).ConfigureAwait(false), "Run after upgrade");
                    Assert.True(stored.PipelineRunId == null && stored.PipelinePosition == 0 && stored.PipelineExecution == 0, "Runs outside pipelines have empty pipeline columns");
                    Pipeline pipeline = new Pipeline { TenantId = "ten_upgrade", Name = "upgraded" };
                    pipeline.Stages.Add(new PipelineStage { Name = "only", AgentId = "agt_upgrade" });
                    await upgraded.Pipelines.CreateAsync(pipeline, token).ConfigureAwait(false);
                    Pipeline read = Assert.NotNull(await upgraded.Pipelines.ReadByNameAsync("ten_upgrade", "upgraded", token).ConfigureAwait(false), "Pipeline after upgrade");
                    Assert.Equal(1, read.Stages.Count, "Pipeline stages after upgrade");
                }
                Conversation saved = Assert.NotNull(await upgraded.Conversations.ReadAsync(conversation.TenantId, conversation.Id, token).ConfigureAwait(false), "Conversation survives upgrade");
                Assert.Equal(conversation.SessionId, saved.SessionId, "Harness session survives upgrade");
                Assert.Equal(2, saved.TurnCount, "Turn history survives upgrade");
                Approval approval = new Approval();
                approval.Id = "apr_upgrade";
                approval.TenantId = conversation.TenantId;
                approval.RunId = "run_upgrade";
                approval.AgentId = conversation.AgentId;
                approval.AgentName = conversation.AgentName;
                approval.DeploymentId = "dep_upgrade";
                approval.ToolName = "Bash";
                await upgraded.Approvals.CreateAsync(approval, token).ConfigureAwait(false);
                Assert.NotNull(await upgraded.Approvals.ReadAsync(approval.Id, token).ConfigureAwait(false), "New approval storage works after upgrade");
                EnumerationResult<ModelPrice> prices = await upgraded.ModelPrices.EnumerateAsync(conversation.TenantId, new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.Equal(0L, prices.TotalRecords, "Upgrade seeds no prices");
                ModelPrice price = await upgraded.ModelPrices.CreateAsync(new ModelPrice { TenantId = conversation.TenantId, Name = "upgrade-price", Model = "upgrade-model", InputUsdPerMillion = 0.5 }, token).ConfigureAwait(false);
                Assert.Equal(0.5, Assert.NotNull(await upgraded.ModelPrices.ReadAsync(conversation.TenantId, price.Id, token).ConfigureAwait(false), "Price storage after upgrade").InputUsdPerMillion, "Rate preserved");
            }
            using (DatabaseDriverBase again = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(0, again.MigrationsApplied, "Restart does not reapply either migration");
            }
        }

        private static async Task UpgradeFromVersion1Async(DatabaseTypeEnum provider, CancellationToken token)
        {
            DatabaseSettings settings = TestEnvironment.IsolatedSettings(provider);
            DateTime queued = new DateTime(2026, 1, 5, 10, 0, 0, DateTimeKind.Utc);

            // Build a database exactly as migration 1 left it, with one finished run in it.
            using (DatabaseDriverBase raw = DatabaseDriverFactory.Create(settings))
            {
                AdoDatabaseDriver ado = (AdoDatabaseDriver)raw;
                if (!String.IsNullOrEmpty(ado.Catalog.Schema))
                {
                    string? createSchema = ado.Dialect.CreateSchemaStatement(ado.Catalog.Schema!);
                    if (createSchema != null) await ado.NonQueryAsync(createSchema, null, token).ConfigureAwait(false);
                }
                await ado.NonQueryAsync(SchemaBuilder.MigrationsTableDdl(ado.Catalog, ado.Dialect), null, token).ConfigureAwait(false);
                SchemaMigration v1 = SchemaBuilder.Build(ado.Catalog, ado.Dialect).First(m => m.Version == 1);
                foreach (string statement in v1.Statements) await ado.NonQueryAsync(statement, null, token).ConfigureAwait(false);
                await ado.NonQueryAsync("INSERT INTO " + ado.Table("schema_migrations") + " (version, description, appliedutc) VALUES (1, 'Initial schema', @t);", c => AdoDatabaseDriver.Add(c, "t", DateTime.UtcNow), token).ConfigureAwait(false);
                await ado.NonQueryAsync(
                    "INSERT INTO " + ado.Table("runs") + " (id, tenantid, agentid, agentname, deploymentid, deploymentversion, harnesstype, kind, status, outcome, priority, callertype, depth, attempt, maxattempts, leaseepoch, " +
                    "queuedutc, leasedutc, completedutc, cancelrequested, inputtokens, outputtokens, cachedtokens, costestimated, lasteventsequence, active, isprotected, createdutc, lastupdateutc) VALUES " +
                    "('run_legacy', 'ten_a', 'agt_a', 'alpha', 'dep_a', 1, 'Generic', 'Invoke', 'Succeeded', 'Succeeded', 0, 'User', 0, 1, 1, 1, @queued, @leased, @completed, @false, 10, 20, 0, @false, 0, @true, @false, @queued, @queued);",
                    c =>
                    {
                        AdoDatabaseDriver.Add(c, "queued", queued);
                        AdoDatabaseDriver.Add(c, "leased", queued.AddMilliseconds(250));
                        AdoDatabaseDriver.Add(c, "completed", queued.AddMilliseconds(4250));
                        AdoDatabaseDriver.Add(c, "false", false);
                        AdoDatabaseDriver.Add(c, "true", true);
                    },
                    token).ConfigureAwait(false);
            }

            using (DatabaseDriverBase upgraded = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(SchemaBuilder.LatestVersion, upgraded.SchemaVersion, "Schema version after upgrade");
                Run legacy = Assert.NotNull(await upgraded.Runs.ReadAsync("run_legacy", token).ConfigureAwait(false), "Legacy run");
                Assert.Equal(20L, legacy.OutputTokens, "Existing columns survive");
                Assert.Equal(0L, legacy.ReasoningTokens, "Reasoning tokens default to 0");
                Assert.Equal(0, legacy.ToolCallCount, "Tool call count defaults to 0");
                Assert.True(legacy.OutputSchemaValid == null && legacy.SchemaValidationErrors == null, "Schema validation fields are null for legacy runs.");
                Assert.Equal(0, legacy.RepairAttempts, "Repair attempts default to 0");
                Assert.True(legacy.TraceId == null && legacy.TraceParent == null, "Trace fields are null for legacy runs.");
                Assert.True(legacy.TimeToFirstTokenMs == null && legacy.StreamingMs == null && legacy.ExecutionMs == null, "Worker timings are null for legacy runs.");
                Assert.Equal(250L, legacy.QueueMs ?? -1, "Queue time derived from server timestamps");
                Assert.Equal(4250L, legacy.TotalMs ?? -1, "Total time derived from server timestamps");
                UsageQuota quota = await upgraded.UsageQuotas.CreateAsync(new UsageQuota { TenantId = legacy.TenantId, Name = "upgrade-quota", Scope = UsageQuotaScopeEnum.Tenant, ResourceId = legacy.TenantId }, token).ConfigureAwait(false);
                UsageQuotaUsage usage = await upgraded.UsageQuotas.ReadUsageAsync(quota, queued, token).ConfigureAwait(false);
                Assert.Equal(1L, usage.RunsUsed, "Migration backfills existing admissions");
                Assert.Equal(30L, usage.TokensUsed, "Migration backfills historical token usage");
                Assert.True(!usage.CostAccountingComplete, "Migration preserves unknown historical cost");

                legacy.ToolCallCount = 3;
                legacy.OutputSchemaValid = false;
                legacy.SchemaValidationErrors = "(root): example (required)";
                legacy.RepairAttempts = 1;
                legacy.StreamingMs = 1500;
                await upgraded.Runs.UpdateAsync(legacy, token).ConfigureAwait(false);
                Run updated = Assert.NotNull(await upgraded.Runs.ReadAsync("run_legacy", token).ConfigureAwait(false), "Updated legacy run");
                Assert.Equal(3, updated.ToolCallCount, "New column writes after upgrade");
                Assert.True(updated.OutputSchemaValid == false, "outputSchemaValid writes after upgrade");
                Assert.Equal("(root): example (required)", updated.SchemaValidationErrors, "schemaValidationErrors writes after upgrade");
                Assert.Equal(1, updated.RepairAttempts, "repairAttempts writes after upgrade");
                Assert.Equal(1500L, updated.StreamingMs ?? -1, "Streaming after upgrade");
            }

            using (DatabaseDriverBase again = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.Equal(SchemaBuilder.LatestVersion, again.SchemaVersion, "Schema version after a second upgrade pass");
            }
        }

        private static async Task RunTelemetryRoundTripAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Run run = new Run();
                run.TenantId = "ten_a";
                run.AgentId = "agt_a";
                run.AgentName = "alpha";
                run.DeploymentId = "dep_a";
                run.Status = RunStatusEnum.Queued;
                run.QueuedUtc = DateTime.UtcNow.AddSeconds(-5);
                run.TraceId = "4BF92F3577B34DA6A3CE929D0E0E4736";
                run.TraceParent = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";
                run = await db.Runs.CreateAsync(run, token).ConfigureAwait(false);
                Run fresh = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Fresh run");
                Assert.Equal("4bf92f3577b34da6a3ce929d0e0e4736", fresh.TraceId, "Trace ID round-trips in lowercase");
                Assert.Equal("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01", fresh.TraceParent, "Trace parent round-trips");
                Assert.True(fresh.QueueMs == null && fresh.TotalMs == null && fresh.TimeToFirstTokenMs == null, "Timings are null before the run is leased.");
                Assert.True(fresh.OutputTokensPerSecond == null, "Tokens per second is null without streaming time.");

                long epoch = (await db.Runs.TryClaimAsync(run.Id, "nod_1", "w1", DateTime.UtcNow.AddSeconds(30), token).ConfigureAwait(false)) ?? throw new TestAssertionException("Claim failed.");
                DateTime first = new DateTime(2026, 1, 5, 10, 0, 1, 500, DateTimeKind.Utc);
                Run result = new Run();
                result.Id = run.Id;
                result.Status = RunStatusEnum.Succeeded;
                result.Outcome = RunOutcomeEnum.Succeeded;
                result.OutputTokens = 300;
                result.ReasoningTokens = 40;
                result.ToolCallCount = 4;
                result.FirstTokenUtc = first;
                result.LastTokenUtc = first.AddMilliseconds(1500);
                result.TimeToFirstTokenMs = 1200;
                result.StreamingMs = 1500;
                result.ExecutionMs = 3100;
                result.QueueMs = 700;
                result.TotalMs = 5000;
                result.DelegationWaitMs = 800;
                result.TimeToFirstTokenExcludingDelegationMs = 400;
                Assert.True(await db.Runs.CompleteAsync(result, "nod_1", epoch, token).ConfigureAwait(false), "Complete");

                Run read = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Completed run");
                Assert.Equal(40L, read.ReasoningTokens, "Reasoning tokens");
                Assert.Equal(4, read.ToolCallCount, "Tool calls");
                Assert.Equal(first, read.FirstTokenUtc ?? DateTime.MinValue, "First token");
                Assert.Equal(first.AddMilliseconds(1500), read.LastTokenUtc ?? DateTime.MinValue, "Last token");
                Assert.Equal(1200L, read.TimeToFirstTokenMs ?? -1, "TTFT");
                Assert.Equal(1500L, read.StreamingMs ?? -1, "Streaming");
                Assert.Equal(3100L, read.ExecutionMs ?? -1, "Execution");
                Assert.Equal(700L, read.QueueMs ?? -1, "Queue");
                Assert.Equal(5000L, read.TotalMs ?? -1, "Total");
                Assert.Equal(200.0, read.OutputTokensPerSecond ?? -1, "Tokens per second");
                Assert.Equal(800L, read.DelegationWaitMs ?? -1, "Delegation wait");
                Assert.Equal(400L, read.TimeToFirstTokenExcludingDelegationMs ?? -1, "TTFT excluding delegation");

                RunFilter filter = new RunFilter();
                filter.TenantId = "ten_a";
                List<Run> rows = await db.Runs.ListForAnalyticsAsync(filter, 10, token).ConfigureAwait(false);
                Assert.Equal(1, rows.Count, "Analytics rows");
                Assert.Equal(1200L, rows[0].TimeToFirstTokenMs ?? -1, "Analytics TTFT");
                Assert.Equal(800L, rows[0].DelegationWaitMs ?? -1, "Analytics delegation wait");
                filter.TenantId = "ten_b";
                Assert.Equal(0, (await db.Runs.ListForAnalyticsAsync(filter, 10, token).ConfigureAwait(false)).Count, "Analytics rows for another tenant");
            }
        }

        private static async Task TenantCrudAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Tenant tenant = new Tenant();
                tenant.Name = "Acme Platform";
                tenant.Description = "Contract test tenant";
                await db.Tenants.CreateAsync(tenant, token).ConfigureAwait(false);

                Tenant read = Assert.NotNull(await db.Tenants.ReadAsync(tenant.Id, token).ConfigureAwait(false), "Tenant");
                Assert.Equal("Acme Platform", read.Name, "Name");
                Assert.True(read.Active, "Tenant should be active by default.");
                Assert.Equal(DateTimeKind.Utc, read.CreatedUtc.Kind, "CreatedUtc kind");

                read.Name = "Acme Renamed";
                await db.Tenants.UpdateAsync(read, token).ConfigureAwait(false);
                Tenant byName = Assert.NotNull(await db.Tenants.ReadByNameAsync("Acme Renamed", token).ConfigureAwait(false), "Tenant by name");
                Assert.Equal(tenant.Id, byName.Id, "Id");

                EnumerationQuery query = new EnumerationQuery();
                query.Search = "renamed";
                EnumerationResult<Tenant> page = await db.Tenants.EnumerateAsync(query, token).ConfigureAwait(false);
                Assert.Equal(1L, page.TotalRecords, "Search total");

                Assert.True(await db.Tenants.DeleteAsync(tenant.Id, token).ConfigureAwait(false), "Delete returned false.");
                Assert.True(!await db.Tenants.ExistsAsync(tenant.Id, token).ConfigureAwait(false), "Tenant still exists after delete.");
            }
        }

        private static async Task ChildrenRoundTripAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                HarnessProfile profile = new HarnessProfile();
                profile.TenantId = "ten_test";
                profile.Name = "custom-claude";
                profile.HarnessType = HarnessTypeEnum.ClaudeCode;
                profile.Executable = "claude";
                profile.OutputParser = OutputParserEnum.ClaudeStreamJson;
                for (int i = 0; i < 5; i++)
                {
                    HarnessArgument argument = new HarnessArgument();
                    argument.Template = "--arg" + i;
                    profile.Arguments.Add(argument);
                }
                HarnessEnvironmentVariable variable = new HarnessEnvironmentVariable();
                variable.Name = "ANTHROPIC_API_KEY";
                variable.ValueTemplate = "{{secret.anthropic}}";
                variable.IsSecret = true;
                profile.Environment.Add(variable);
                profile.SuccessExitCodes.Add(0);
                profile.ProbeArguments.Add("--version");
                await db.HarnessProfiles.CreateAsync(profile, token).ConfigureAwait(false);

                HarnessProfile read = Assert.NotNull(await db.HarnessProfiles.ReadAsync("ten_test", profile.Id, token).ConfigureAwait(false), "Profile");
                Assert.Equal(5, read.Arguments.Count, "Argument count");
                for (int i = 0; i < 5; i++) Assert.Equal("--arg" + i, read.Arguments[i].Template, "Argument " + i);
                Assert.Equal(1, read.Environment.Count, "Environment count");
                Assert.True(read.Environment[0].IsSecret, "IsSecret");
                Assert.Equal(0, read.SuccessExitCodes[0], "Exit code");
                Assert.Equal("--version", read.ProbeArguments[0], "Probe argument");
                Assert.Equal(OutputParserEnum.ClaudeStreamJson, read.OutputParser, "Parser");

                read.Arguments.RemoveAt(0);
                await db.HarnessProfiles.UpdateAsync(read, token).ConfigureAwait(false);
                HarnessProfile updated = Assert.NotNull(await db.HarnessProfiles.ReadAsync(profile.Id, token).ConfigureAwait(false), "Updated profile");
                Assert.Equal(4, updated.Arguments.Count, "Argument count after update");
                Assert.Equal("--arg1", updated.Arguments[0].Template, "First argument after update");

                await db.HarnessProfiles.DeleteAsync(profile.Id, token).ConfigureAwait(false);
                Assert.True(!await db.HarnessProfiles.ExistsAsync(profile.Id, token).ConfigureAwait(false), "Profile still exists.");
            }
        }

        private static async Task ScalarChildrenOrderAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Permission permission = new Permission();
                permission.TenantId = "ten_test";
                permission.Name = "ordered-permission";
                for (int i = 0; i < 25; i++) permission.ResourceTypes.Add("type-" + (char)('z' - i));
                permission.OperationTypes.Add("Update");
                permission.OperationTypes.Add("Read");
                permission.OperationTypes.Add("Create");
                await db.Permissions.CreateAsync(permission, token).ConfigureAwait(false);

                Permission read = Assert.NotNull(await db.Permissions.ReadAsync("ten_test", permission.Id, token).ConfigureAwait(false), "Permission");
                Assert.Equal(25, read.ResourceTypes.Count, "Resource type count");
                for (int i = 0; i < 25; i++) Assert.Equal("type-" + (char)('z' - i), read.ResourceTypes[i], "Resource type " + i);
                Assert.Equal("Update", read.OperationTypes[0], "First operation");
                Assert.Equal("Create", read.OperationTypes[2], "Last operation");

                await db.Permissions.DeleteAsync(permission.Id, token).ConfigureAwait(false);
            }
        }

        private static async Task TenantIsolationAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Agent agent = new Agent();
                agent.TenantId = "ten_a";
                agent.Name = "helper";
                agent.Tags.Add("demo");
                await db.Agents.CreateAsync(agent, token).ConfigureAwait(false);

                Assert.True(await db.Agents.ReadAsync("ten_b", agent.Id, token).ConfigureAwait(false) == null, "Agent leaked to tenant B.");
                Assert.True(await db.Agents.ReadByNameAsync("ten_b", "helper", token).ConfigureAwait(false) == null, "Agent name leaked to tenant B.");
                EnumerationResult<Agent> page = await db.Agents.EnumerateAsync("ten_b", new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.Equal(0L, page.TotalRecords, "Tenant B enumeration");
                EnumerationResult<Agent> own = await db.Agents.EnumerateAsync("ten_a", new EnumerationQuery(), token).ConfigureAwait(false);
                Assert.Equal(1L, own.TotalRecords, "Tenant A enumeration");
                Assert.Equal("demo", own.Objects[0].Tags[0], "Tag");
            }
        }

        private static async Task BuiltInVisibilityAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                PromptTemplate builtIn = new PromptTemplate();
                builtIn.TenantId = null;
                builtIn.Name = "builtin/default-system";
                builtIn.Content = "built-in";
                builtIn.IsBuiltIn = true;
                await db.PromptTemplates.CreateAsync(builtIn, token).ConfigureAwait(false);

                PromptTemplate visible = Assert.NotNull(await db.PromptTemplates.ReadAsync("ten_a", builtIn.Id, token).ConfigureAwait(false), "Built-in via tenant");
                Assert.Equal("built-in", visible.Content, "Content");

                PromptTemplate own = new PromptTemplate();
                own.TenantId = "ten_a";
                own.Name = "builtin/default-system";
                own.Content = "tenant";
                await db.PromptTemplates.CreateAsync(own, token).ConfigureAwait(false);

                PromptTemplate resolved = Assert.NotNull(await db.PromptTemplates.ReadByNameAsync("ten_a", "builtin/default-system", token).ConfigureAwait(false), "Resolved");
                Assert.Equal("tenant", resolved.Content, "Tenant record should win");
                PromptTemplate other = Assert.NotNull(await db.PromptTemplates.ReadByNameAsync("ten_b", "builtin/default-system", token).ConfigureAwait(false), "Other tenant");
                Assert.Equal("built-in", other.Content, "Other tenant sees built-in");
            }
        }

        private static async Task ChildWaitsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                // Two regular slots and one reserve slot: at most two runs may wait at once (2 + 1 - 1).
                Node node = await db.Nodes.CreateAsync(new Node { Name = "waits-" + Guid.NewGuid().ToString("N").Substring(0, 6), MaxConcurrentRuns = 2, ChildReserveSlots = 1 }, token).ConfigureAwait(false);
                Assert.Equal(2, DelegationCapacity.MaxWaiters(node), "Waiter cap");
                string deployment = "dep_waits";
                Run a = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Running, LeaseNodeId = node.Id }, token).ConfigureAwait(false);
                Run b = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Running, LeaseNodeId = node.Id }, token).ConfigureAwait(false);
                Run c = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Running, LeaseNodeId = node.Id }, token).ConfigureAwait(false);

                // The wait is recorded before the child exists and counts at once.
                string childA = IdGenerator.NewRunId();
                ChildWaitAdmission waitA = await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = a.Id, ChildRunId = childA }, token).ConfigureAwait(false);
                Assert.True(waitA.Admitted, "First wait admitted");
                Assert.Equal(1L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "A waits before its child exists");
                ChildWaitAdmission parallel = await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = a.Id, ChildRunId = IdGenerator.NewRunId() }, token).ConfigureAwait(false);
                Assert.True(parallel.Admitted, "A parent already waiting takes no new place");
                Assert.True((await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = b.Id, ChildRunId = IdGenerator.NewRunId() }, token).ConfigureAwait(false)).Admitted, "Second waiter admitted");
                ChildWaitAdmission refused = await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = c.Id, ChildRunId = IdGenerator.NewRunId() }, token).ConfigureAwait(false);
                Assert.True(!refused.Admitted && refused.Limit == DelegationCapacityLimitEnum.ResidentWaiters && refused.Used == 2 && refused.Maximum == 2 && refused.NodeId == node.Id, "Third waiter refused by the node cap");
                Assert.Equal(2L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "Two runs wait on the node");

                // Waiting ancestors in the same deployment are left out of its active count and its claim limit.
                Run child = await db.Runs.CreateAsync(new Run { Id = childA, TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Queued, ParentRunId = a.Id, RootRunId = a.Id, Depth = 1, Kind = RunKindEnum.Delegated }, token).ConfigureAwait(false);
                Assert.Equal(3L, await db.Runs.CountActiveByDeploymentAsync(deployment, token).ConfigureAwait(false), "Every active run counts without ancestors");
                Assert.Equal(2L, await db.Runs.CountActiveByDeploymentAsync(deployment, new List<string> { a.Id }, token).ConfigureAwait(false), "The waiting ancestor is left out");
                Assert.Equal(3L, await db.Runs.CountActiveByDeploymentAsync(deployment, new List<string> { c.Id }, token).ConfigureAwait(false), "An ancestor that is not waiting still counts");
                ClaimResult blocked = await db.Runs.TryClaimWithinLimitAsync(child.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), deployment, 3, token).ConfigureAwait(false);
                Assert.True(!blocked.Claimed && blocked.LimitReached, "Without ancestors the deployment is full");
                ClaimResult claimed = await db.Runs.TryClaimWithinLimitAsync(child.Id, node.Id, node.Name, DateTime.UtcNow.AddMinutes(1), deployment, 3, new List<string> { a.Id }, token).ConfigureAwait(false);
                Assert.True(claimed.Claimed, "The child claims within the limit once its waiting parent is left out");

                // Candidates: only waited children for the reserve, only delegated runs for the delegated window.
                Run waited = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Queued, HarnessType = HarnessTypeEnum.Generic, ParentRunId = b.Id, Kind = RunKindEnum.Delegated }, token).ConfigureAwait(false);
                Run loose = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Queued, HarnessType = HarnessTypeEnum.Generic, ParentRunId = c.Id, Kind = RunKindEnum.Delegated }, token).ConfigureAwait(false);
                Run top = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = deployment, Status = RunStatusEnum.Queued, HarnessType = HarnessTypeEnum.Generic }, token).ConfigureAwait(false);
                string waitB = (await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = b.Id, ChildRunId = IdGenerator.NewRunId() }, token).ConfigureAwait(false)).WaitId ?? throw new TestAssertionException("B's second wait");
                Assert.True(await db.Runs.UpdateChildWaitAsync(waitB, waited.Id, token).ConfigureAwait(false), "A wait can point at the run an idempotent retry returned");
                ClaimCandidateFilter reserve = new ClaimCandidateFilter { HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, IgnoreNodePool = true, WaitedChildrenOnly = true, Limit = 50 };
                List<Run> reserveCandidates = await db.Runs.ListClaimCandidatesAsync(reserve, token).ConfigureAwait(false);
                Assert.True(reserveCandidates.Count == 1 && reserveCandidates[0].Id == waited.Id, "The reserve only sees a child its parent waits on: " + String.Join(", ", reserveCandidates.Select(r => r.Id)));
                ClaimCandidateFilter delegatedOnly = new ClaimCandidateFilter { HarnessTypes = new List<HarnessTypeEnum> { HarnessTypeEnum.Generic }, IgnoreNodePool = true, DelegatedOnly = true, Limit = 50 };
                List<Run> delegatedCandidates = await db.Runs.ListClaimCandidatesAsync(delegatedOnly, token).ConfigureAwait(false);
                Assert.True(delegatedCandidates.Any(r => r.Id == waited.Id) && delegatedCandidates.Any(r => r.Id == loose.Id) && !delegatedCandidates.Any(r => r.Id == top.Id), "The delegated window has no top-level runs");

                // The queue depth counts queued children whose parent waits on them.
                Assert.Equal(1L, await db.Runs.CountQueuedWaitedChildrenAsync(token).ConfigureAwait(false), "One waited child is queued");
                Node roomy = await db.Nodes.CreateAsync(new Node { Name = "roomy-" + Guid.NewGuid().ToString("N").Substring(0, 6), MaxConcurrentRuns = 8, ChildReserveSlots = 2 }, token).ConfigureAwait(false);
                Run d = await db.Runs.CreateAsync(new Run { TenantId = "ten_w", AgentId = "agt_w", DeploymentId = "dep_other", Status = RunStatusEnum.Running, LeaseNodeId = roomy.Id }, token).ConfigureAwait(false);
                ChildWaitAdmission deep = await db.Runs.BeginChildWaitAsync(new ChildWaitRequest { TenantId = "ten_w", ParentRunId = d.Id, ChildRunId = IdGenerator.NewRunId(), ChildQueueDepth = 1 }, token).ConfigureAwait(false);
                Assert.True(!deep.Admitted && deep.Limit == DelegationCapacityLimitEnum.ChildQueueDepth && deep.Used == 1 && deep.Maximum == 1, "The child queue depth refuses a new wait");

                // A finished child stops its wait from counting, and the pruner removes it along with orphans.
                await db.Runs.TransitionAsync(new RunTransition { RunId = child.Id, FromStatuses = new List<RunStatusEnum> { RunStatusEnum.Leased }, ToStatus = RunStatusEnum.Succeeded, SetCompleted = true, ClearLease = true }, token).ConfigureAwait(false);
                Assert.Equal(2L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "A still waits on its second (not yet created) child, B on its own");
                Assert.True(await db.Runs.EndChildWaitAsync(waitA.WaitId!, token).ConfigureAwait(false), "A wait ends");
                Assert.True(!await db.Runs.EndChildWaitAsync(waitA.WaitId!, token).ConfigureAwait(false), "Ending twice does nothing");
                int pruned = await db.Runs.PruneChildWaitsAsync(DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false);
                Assert.Equal(2, pruned, "Orphaned waits (children never created) are pruned after the cutoff; B's wait on its queued child is kept");
                Assert.Equal(1L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "Only B's live wait is left");
                await db.Runs.TransitionAsync(new RunTransition { RunId = b.Id, FromStatuses = new List<RunStatusEnum> { RunStatusEnum.Running }, ToStatus = RunStatusEnum.Failed, SetCompleted = true, ClearLease = true }, token).ConfigureAwait(false);
                Assert.Equal(0L, await db.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false), "A finished parent no longer waits");
                Assert.Equal(1, await db.Runs.PruneChildWaitsAsync(DateTime.UtcNow.AddMinutes(-1), token).ConfigureAwait(false), "The finished parent's wait is pruned");
            }
        }

        private static async Task PipelineCasAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            using (DatabaseDriverBase db = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                Pipeline pipeline = new Pipeline { TenantId = "ten_pa", Name = "flow", MaxDurationSeconds = 60 };
                for (int i = 0; i < 3; i++)
                {
                    PipelineStage stage = new PipelineStage { Name = "stage-" + i, AgentId = "agt_" + i, RequiresReview = i == 1, ReviewTimeoutAction = PipelineReviewDecisionEnum.Approve };
                    stage.Parameters.Add(new PipelineStageParameter { Name = "b" + i, Value = "2" });
                    stage.Parameters.Add(new PipelineStageParameter { Name = "a" + i, Value = "1" });
                    pipeline.Stages.Add(stage);
                }
                await db.Pipelines.CreateAsync(pipeline, token).ConfigureAwait(false);
                Pipeline read = Assert.NotNull(await db.Pipelines.ReadAsync("ten_pa", pipeline.Id, token).ConfigureAwait(false), "Pipeline");
                Assert.Equal("stage-0,stage-1,stage-2", String.Join(",", read.Stages.Select(s => s.Name)), "Stage order");
                Assert.Equal("1,2,3", String.Join(",", read.Stages.Select(s => s.Position)), "Stage positions");
                Assert.Equal("b1,a1", String.Join(",", read.Stages[1].Parameters.Select(p => p.Name)), "Parameter order");
                Assert.True(read.Stages[1].RequiresReview && read.Stages[1].ReviewTimeoutAction == PipelineReviewDecisionEnum.Approve, "Stage settings round-trip");
                Assert.True(await db.Pipelines.ReadAsync("ten_other", pipeline.Id, token).ConfigureAwait(false) == null, "Other tenants cannot read the pipeline");
                Assert.Equal("flow", String.Join(",", await db.Pipelines.NamesByAgentAsync("ten_pa", "agt_2", token).ConfigureAwait(false)), "Pipelines by agent");
                Assert.Equal(0, (await db.Pipelines.NamesByAgentAsync("ten_other", "agt_2", token).ConfigureAwait(false)).Count, "Agent references are tenant scoped");
                read.Stages.RemoveAt(2);
                read.Version = 2;
                await db.Pipelines.UpdateAsync(read, token).ConfigureAwait(false);
                Assert.Equal(2, (await db.Pipelines.ReadAsync("ten_pa", pipeline.Id, token).ConfigureAwait(false))!.Stages.Count, "Update replaces stages");

                PipelineRun run = new PipelineRun { TenantId = "ten_pa", PipelineId = pipeline.Id, PipelineName = "flow", StageCount = 2, InputText = "go", IdempotencyKey = "key-1", CallerId = "usr_1" };
                run.Stages.Add(new PipelineRunStage { Position = 1, Name = "stage-0", AgentId = "agt_0", AgentName = "a0" });
                run.Stages.Add(new PipelineRunStage { Position = 2, Name = "stage-1", AgentId = "agt_1", AgentName = "a1", RequiresReview = true });
                run.Stages[0].Parameters.Add(new PipelineRunStageParameter { Name = "a0", Value = "1" });
                PipelineRun created = await db.PipelineRuns.CreateAsync(run, token).ConfigureAwait(false);
                Assert.Equal(run.Id, created.Id, "Created");
                PipelineRun again = await db.PipelineRuns.CreateAsync(new PipelineRun { TenantId = "ten_pa", PipelineId = pipeline.Id, PipelineName = "flow", StageCount = 2, InputText = "go", IdempotencyKey = "key-1", CallerId = "usr_1" }, token).ConfigureAwait(false);
                Assert.Equal(run.Id, again.Id, "A repeated idempotency key returns the existing pipeline run");
                Assert.Equal(2, again.Stages.Count, "with its stages");
                Assert.Equal(1L, (await db.PipelineRuns.EnumerateAsync(new PipelineRunFilter { TenantId = "ten_pa" }, token).ConfigureAwait(false)).TotalRecords, "One pipeline run");
                Assert.True(await db.PipelineRuns.ReadAsync("ten_other", run.Id, token).ConfigureAwait(false) == null, "Other tenants cannot read the pipeline run");

                string stageId = created.Stages[0].Id;
                Assert.True(await db.PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = stageId, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "First claim");
                Assert.True(!await db.PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = stageId, ExpectedExecutions = 0, Attempts = 1 }, token).ConfigureAwait(false), "A second claim of the same execution loses");
                Assert.True(await db.PipelineRuns.LinkRunAsync(stageId, 1, "run_a", token).ConfigureAwait(false), "Link");
                Assert.True(!await db.PipelineRuns.LinkRunAsync(stageId, 1, "run_b", token).ConfigureAwait(false), "A second link loses");
                Assert.True(!await db.PipelineRuns.BlockAsync(stageId, 1, "QuotaExceeded", DateTime.UtcNow, token).ConfigureAwait(false), "A linked execution cannot be blocked");
                Assert.True(await db.PipelineRuns.ClaimExecutionAsync(new PipelineStageClaim { RunStageId = stageId, ExpectedExecutions = 1, Attempts = 2 }, token).ConfigureAwait(false), "Retry claim");
                PipelineRunStage claimed = (await db.PipelineRuns.ReadAsync("ten_pa", run.Id, token).ConfigureAwait(false))!.Stages[0];
                Assert.True(claimed.Executions == 2 && claimed.Attempts == 2 && claimed.CurrentRunId == null && claimed.LastRunId == "run_a" && claimed.Status == PipelineStageStatusEnum.Running, "Retry claim moves the run to lastRunId");
                Assert.Equal("a0", claimed.Parameters.Single().Name, "Stage parameter snapshot");

                PipelineRun current = (await db.PipelineRuns.ReadAsync("ten_pa", run.Id, token).ConfigureAwait(false))!;
                PipelineRunTransition move = new PipelineRunTransition { PipelineRunId = run.Id, ExpectedCasVersion = current.CasVersion, ToStatus = PipelineRunStatusEnum.AwaitingReview, CurrentPosition = 2 };
                move.FromStatuses.Add(PipelineRunStatusEnum.Running);
                Assert.True(await db.PipelineRuns.TransitionAsync(move, token).ConfigureAwait(false), "Transition with the current casVersion");
                Assert.True(!await db.PipelineRuns.TransitionAsync(move, token).ConfigureAwait(false), "The same transition with a stale casVersion loses");
                PipelineRun moved = (await db.PipelineRuns.ReadAsync("ten_pa", run.Id, token).ConfigureAwait(false))!;
                Assert.True(moved.Status == PipelineRunStatusEnum.AwaitingReview && moved.CurrentPosition == 2 && moved.CasVersion == current.CasVersion + 1, "Transition applied once");
                Assert.Equal(1L, await db.PipelineRuns.CountActiveAsync("ten_pa", pipeline.Id, token).ConfigureAwait(false), "Active pipeline runs");

                PipelineReview review = new PipelineReview { TenantId = "ten_pa", PipelineRunId = run.Id, PipelineId = pipeline.Id, PipelineName = "flow", RunStageId = created.Stages[1].Id, Position = 2, StageName = "stage-1", RunId = "run_c", Execution = 1, ExpiresUtc = DateTime.UtcNow.AddSeconds(-1) };
                Assert.True(await db.PipelineReviews.CreateIfAbsentAsync(review, token).ConfigureAwait(false), "Review created");
                Assert.True(!await db.PipelineReviews.CreateIfAbsentAsync(new PipelineReview { TenantId = "ten_pa", PipelineRunId = run.Id, PipelineId = pipeline.Id, PipelineName = "flow", RunStageId = created.Stages[1].Id, Position = 2, StageName = "stage-1", RunId = "run_c", Execution = 1 }, token).ConfigureAwait(false), "One review per stage execution");
                Assert.Equal(1, (await db.PipelineReviews.ListExpiredAsync(DateTime.UtcNow, 10, token).ConfigureAwait(false)).Count(r => r.Id == review.Id), "Expired pending review listed");
                Assert.Equal(1L, await db.PipelineReviews.CountPendingAsync("ten_pa", token).ConfigureAwait(false), "Pending reviews");
                Assert.True(await db.PipelineReviews.ReadAsync("ten_other", review.Id, token).ConfigureAwait(false) == null, "Other tenants cannot read the review");
                PipelineReviewResolution approve = new PipelineReviewResolution { ReviewId = review.Id, Status = PipelineReviewStatusEnum.Approved, Decision = PipelineReviewDecisionEnum.Approve, Comment = "ok" };
                Assert.True(await db.PipelineReviews.ResolveAsync(approve, token).ConfigureAwait(false), "Decision");
                Assert.True(!await db.PipelineReviews.ResolveAsync(new PipelineReviewResolution { ReviewId = review.Id, Status = PipelineReviewStatusEnum.Rejected, Decision = PipelineReviewDecisionEnum.Reject }, token).ConfigureAwait(false), "A second decision loses");
                Assert.Equal(PipelineReviewStatusEnum.Approved, (await db.PipelineReviews.ReadByExecutionAsync(created.Stages[1].Id, 1, token).ConfigureAwait(false))!.Status, "First decision kept");

                PipelineRunTransition finish = new PipelineRunTransition { PipelineRunId = run.Id, ToStatus = PipelineRunStatusEnum.Succeeded, Outcome = PipelineRunOutcomeEnum.Succeeded, SetCompleted = true };
                finish.FromStatuses.Add(PipelineRunStatusEnum.AwaitingReview);
                Assert.True(await db.PipelineRuns.TransitionAsync(finish, token).ConfigureAwait(false), "Finish");
                Assert.Equal(0, await db.PipelineRuns.PruneFinishedAsync(DateTime.UtcNow.AddDays(-1), token).ConfigureAwait(false), "Recent pipeline runs are kept");
                Assert.Equal(1, await db.PipelineRuns.PruneFinishedAsync(DateTime.UtcNow.AddMinutes(1), token).ConfigureAwait(false), "Old finished pipeline runs are pruned");
                Assert.True(await db.PipelineRuns.ReadAsync("ten_pa", run.Id, token).ConfigureAwait(false) == null && (await db.PipelineReviews.ListByPipelineRunAsync(run.Id, token).ConfigureAwait(false)).Count == 0, "Pruned with its reviews");
                Assert.True(await db.Pipelines.DeleteAsync("ten_pa", pipeline.Id, token).ConfigureAwait(false), "Delete pipeline");
            }
        }
    }
}
