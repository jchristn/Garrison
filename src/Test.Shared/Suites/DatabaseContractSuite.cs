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
                Assert.Equal(3, firstVersion, "Schema version after first initialization");
            }
            using (DatabaseDriverBase second = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.True(await second.PingAsync(token).ConfigureAwait(false), "Ping failed after second initialization.");
                Assert.Equal(firstVersion, second.SchemaVersion, "Schema version after second initialization");
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
                Assert.Equal(3, upgraded.SchemaVersion, "Schema version after upgrade");
                Run legacy = Assert.NotNull(await upgraded.Runs.ReadAsync("run_legacy", token).ConfigureAwait(false), "Legacy run");
                Assert.Equal(20L, legacy.OutputTokens, "Existing columns survive");
                Assert.Equal(0L, legacy.ReasoningTokens, "Reasoning tokens default to 0");
                Assert.Equal(0, legacy.ToolCallCount, "Tool call count defaults to 0");
                Assert.True(legacy.OutputSchemaValid == null && legacy.SchemaValidationErrors == null, "Schema validation fields are null for legacy runs.");
                Assert.Equal(0, legacy.RepairAttempts, "Repair attempts default to 0");
                Assert.True(legacy.TimeToFirstTokenMs == null && legacy.StreamingMs == null && legacy.ExecutionMs == null, "Worker timings are null for legacy runs.");
                Assert.Equal(250L, legacy.QueueMs ?? -1, "Queue time derived from server timestamps");
                Assert.Equal(4250L, legacy.TotalMs ?? -1, "Total time derived from server timestamps");

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
                Assert.Equal(3, again.SchemaVersion, "Schema version after a second upgrade pass");
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
                run = await db.Runs.CreateAsync(run, token).ConfigureAwait(false);
                Run fresh = Assert.NotNull(await db.Runs.ReadAsync(run.Id, token).ConfigureAwait(false), "Fresh run");
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

                RunFilter filter = new RunFilter();
                filter.TenantId = "ten_a";
                List<Run> rows = await db.Runs.ListForAnalyticsAsync(filter, 10, token).ConfigureAwait(false);
                Assert.Equal(1, rows.Count, "Analytics rows");
                Assert.Equal(1200L, rows[0].TimeToFirstTokenMs ?? -1, "Analytics TTFT");
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
    }
}
