namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
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
                Assert.True(firstVersion > 0, "Schema version was not recorded.");
            }
            using (DatabaseDriverBase second = await DatabaseDriverFactory.CreateAndInitializeAsync(settings, token).ConfigureAwait(false))
            {
                Assert.True(await second.PingAsync(token).ConfigureAwait(false), "Ping failed after second initialization.");
                Assert.Equal(firstVersion, second.SchemaVersion, "Schema version after second initialization");
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
