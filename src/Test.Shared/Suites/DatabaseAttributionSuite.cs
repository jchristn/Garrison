namespace Test.Shared.Suites
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Ado;
    using Garrison.Core.Database.Telemetry;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Runtime;
    using Test.Shared.Infrastructure;
    using Touchstone.Core;

    /// <summary>Actual provider statement attribution under nesting, concurrent unrelated work and failures.</summary>
    public static class DatabaseAttributionSuite
    {
        /// <summary>Create suites for the configured database providers.</summary>
        /// <returns>Provider suites.</returns>
        public static List<TestSuiteDescriptor> Build()
        {
            List<TestSuiteDescriptor> suites = new List<TestSuiteDescriptor>();
            foreach (DatabaseTypeEnum provider in TestEnvironment.Providers())
            {
                string id = "database-attribution-" + provider.ToString().ToLowerInvariant();
                suites.Add(new TestSuiteDescriptor(id, "Exact run database attribution", new List<TestCaseDescriptor>
                {
                    new TestCaseDescriptor(id, "parallel-and-nested", "Parallel unrelated queries never contaminate exact counts; nested same-run work is counted once and concurrent scopes atomically accumulate", ct => ExactAsync(provider, ct)),
                    new TestCaseDescriptor(id, "errors-and-isolation", "Failed SQL attempts persist without SQL text, other tenants cannot read attribution, and run deletion cleans usage", ct => ErrorsAsync(provider, ct))
                }));
            }
            return suites;
        }

        private static async Task ExactAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (DatabaseDriverBase database = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                AdoDatabaseDriver ado = (AdoDatabaseDriver)database;
                Run first = await database.Runs.CreateAsync(new Run { TenantId = "ten_usage", AgentId = "agt_usage" }, token).ConfigureAwait(false);
                Run second = await database.Runs.CreateAsync(new Run { TenantId = "ten_usage", AgentId = "agt_usage" }, token).ConfigureAwait(false);
                Task unrelated = Task.Run(async () =>
                {
                    for (int i = 0; i < 37; i++) await ado.ScalarAsync("SELECT 1;", null, token).ConfigureAwait(false);
                }, token);
                Task one = RunDatabaseTelemetry.MeasureAsync(database, first.TenantId, first.Id, "test_parallel", async ct =>
                {
                    List<Task> queries = new List<Task>();
                    for (int i = 0; i < 20; i++) queries.Add(ado.ScalarAsync("SELECT 1;", null, ct));
                    await Task.WhenAll(queries).ConfigureAwait(false);
                    await RunDatabaseTelemetry.MeasureAsync(database, first.TenantId, first.Id, "nested", inner => ado.ScalarAsync("SELECT 2;", null, inner), ct).ConfigureAwait(false);
                }, token);
                Task two = RunDatabaseTelemetry.MeasureAsync(database, second.TenantId, second.Id, "test_other_run", async ct =>
                {
                    for (int i = 0; i < 7; i++) await ado.ScalarAsync("SELECT 3;", null, ct).ConfigureAwait(false);
                }, token);
                await Task.WhenAll(unrelated, one, two).ConfigureAwait(false);
                RunDatabaseUsage usage = (await database.RunDatabaseUsage.ListAsync(first.TenantId, first.Id, token).ConfigureAwait(false)).Single();
                Assert.Equal(21L, usage.Statements, "Twenty parallel queries plus one nested query, no unrelated or telemetry writes");
                Assert.Equal(21L, usage.Reads, "All attributed statements are reads");
                Assert.Equal(0L, usage.Writes, "Telemetry persistence does not count itself");
                Assert.Equal(7L, (await database.RunDatabaseUsage.ListAsync(second.TenantId, second.Id, token).ConfigureAwait(false)).Single().Statements, "A parallel run remains separate");
                List<Task> scopes = new List<Task>();
                for (int i = 0; i < 8; i++) scopes.Add(RunDatabaseTelemetry.MeasureAsync(database, first.TenantId, first.Id, "test_parallel", ct => ado.ScalarAsync("SELECT 4;", null, ct), token));
                await Task.WhenAll(scopes).ConfigureAwait(false);
                Assert.Equal(29L, (await database.RunDatabaseUsage.ListAsync(first.TenantId, first.Id, token).ConfigureAwait(false)).Single().Statements, "Concurrent completed scopes add atomically");
            }
        }

        private static async Task ErrorsAsync(DatabaseTypeEnum provider, CancellationToken token)
        {
            await using (DatabaseDriverBase database = await TestEnvironment.CreateDriverAsync(provider, token).ConfigureAwait(false))
            {
                AdoDatabaseDriver ado = (AdoDatabaseDriver)database;
                Run run = await database.Runs.CreateAsync(new Run { TenantId = "ten_usage", AgentId = "agt_usage" }, token).ConfigureAwait(false);
                bool failed = false;
                try
                {
                    await RunDatabaseTelemetry.MeasureAsync(database, run.TenantId, run.Id, "test_failure", ct => ado.ScalarAsync("SELECT * FROM missing_attribution_table;", null, ct), token).ConfigureAwait(false);
                }
                catch (Exception) { failed = true; }
                Assert.True(failed, "The original provider exception propagates");
                RunDatabaseUsage usage = (await database.RunDatabaseUsage.ListAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Single();
                Assert.Equal(1L, usage.Statements, "Failed statement counted once");
                Assert.Equal(1L, usage.Errors, "Failure attributed to run");
                Assert.Equal(0, (await database.RunDatabaseUsage.ListAsync("ten_other", run.Id, token).ConfigureAwait(false)).Count, "Cross-tenant attribution is absent");
                await database.Runs.DeleteAsync(run.Id, token).ConfigureAwait(false);
                Assert.Equal(0, (await database.RunDatabaseUsage.ListAsync(run.TenantId, run.Id, token).ConfigureAwait(false)).Count, "Run deletion cleans attribution");
            }
        }
    }
}
