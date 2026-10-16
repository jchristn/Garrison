namespace Garrison.Server.Runtime
{
    using System;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Database.Telemetry;
    using Garrison.Core.Models;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Run-scoped application timing and exact database attribution. Counters are persisted once after the operation,
    /// outside attribution, without run IDs in metric labels. Telemetry failures never change application outcomes.
    /// A process crash before flush loses that scope; the endpoint reports completed scopes, not estimated global deltas.
    /// </summary>
    public static class RunDatabaseTelemetry
    {
        /// <summary>Measure and attribute run work, preserving the result and exception.</summary>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="database">Persistence.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="operation">Fixed lifecycle operation name.</param>
        /// <param name="work">Run operation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Work result.</returns>
        public static async Task<T> MeasureAsync<T>(DatabaseDriverBase database, string tenantId, string runId, string operation, Func<CancellationToken, Task<T>> work, CancellationToken token = default)
        {
            return await ApplicationOperation.MeasureAsync("run", operation, async ct =>
            {
                if (string.IsNullOrEmpty(runId) || RunDatabaseAttribution.Contains(tenantId, runId)) return await work(ct).ConfigureAwait(false);
                RunDatabaseUsage usage;
                using (RunDatabaseAttribution attribution = new RunDatabaseAttribution(tenantId, runId, operation))
                {
                    try
                    {
                        return await work(ct).ConfigureAwait(false);
                    }
                    finally
                    {
                        usage = attribution.Snapshot();
                        Activity.Current?.SetTag("garrison.db.statements", usage.Statements);
                        Activity.Current?.SetTag("garrison.db.reads", usage.Reads);
                        Activity.Current?.SetTag("garrison.db.writes", usage.Writes);
                        Activity.Current?.SetTag("garrison.db.errors", usage.Errors);
                        Activity.Current?.SetTag("garrison.db.duration_us", usage.DurationMicroseconds);
                        // This table is excluded centrally from attribution, including any enclosing scope.
                        using (CancellationTokenSource flush = new CancellationTokenSource(TimeSpan.FromSeconds(2)))
                        {
                            try { await database.RunDatabaseUsage.AddAsync(usage, flush.Token).ConfigureAwait(false); }
                            catch (Exception) { GarrisonMetrics.Count(GarrisonMetricCatalog.ApplicationOperations, 1, GarrisonMetrics.Tags("component", "telemetry", "operation", "attribution_flush", "result", "error")); }
                        }
                    }
                }
            }, token).ConfigureAwait(false);
        }

        /// <summary>Attribute admission SQL to the actual returned run, including idempotent retries.</summary>
        /// <param name="database">Persistence.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="work">Admission operation that returns its canonical run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Canonical admitted run.</returns>
        public static async Task<Run> MeasureCreatedAsync(DatabaseDriverBase database, string tenantId, Func<CancellationToken, Task<Run>> work, CancellationToken token = default)
        {
            return await ApplicationOperation.MeasureAsync("run", "admission", async ct =>
            {
                using (RunDatabaseAttribution attribution = new RunDatabaseAttribution(tenantId, string.Empty, "admission"))
                {
                    Run run = await work(ct).ConfigureAwait(false);
                    RunDatabaseUsage usage = attribution.Snapshot();
                    usage.RunId = run.Id;
                    usage.TenantId = run.TenantId;
                    Activity.Current?.SetTag("garrison.db.statements", usage.Statements);
                    using (CancellationTokenSource flush = new CancellationTokenSource(TimeSpan.FromSeconds(2)))
                    {
                        try { await database.RunDatabaseUsage.AddAsync(usage, flush.Token).ConfigureAwait(false); }
                        catch (Exception) { GarrisonMetrics.Count(GarrisonMetricCatalog.ApplicationOperations, 1, GarrisonMetrics.Tags("component", "telemetry", "operation", "attribution_flush", "result", "error")); }
                    }
                    return run;
                }
            }, token).ConfigureAwait(false);
        }

        /// <summary>Measure and attribute run work that returns no value.</summary>
        /// <param name="database">Persistence.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="operation">Fixed lifecycle operation name.</param>
        /// <param name="work">Run operation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Completion task.</returns>
        public static async Task MeasureAsync(DatabaseDriverBase database, string tenantId, string runId, string operation, Func<CancellationToken, Task> work, CancellationToken token = default)
        {
            await MeasureAsync(database, tenantId, runId, operation, async ct =>
            {
                await work(ct).ConfigureAwait(false);
                return true;
            }, token).ConfigureAwait(false);
        }
    }
}
