namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Concurrent;
    using System.Diagnostics;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Per-run metrics on the control plane (P13.21): creation, every terminal transition (worker completions, lease
    /// expiry, deadlines, blocked runs, cancellations of queued runs, compile failures, rejections), stage durations,
    /// tokens, cost, throughput, tool calls, and guard trips, all labeled with tenant, agent, deployment (by name),
    /// harness, and served model. Deployment names are cached per process and read from the database on a miss.
    /// Static so every terminal transition can record without extra wiring. Recording never throws. Thread-safe.
    /// </summary>
    public static class RunTelemetry
    {
        #region Public-Members

        /// <summary>
        /// How long a cached deployment name is trusted, in seconds. Minimum 10, maximum 86400, default 300.
        /// </summary>
        public static int NameCacheSeconds
        {
            get
            {
                return _NameCacheSeconds;
            }
            set
            {
                _NameCacheSeconds = Math.Clamp(value, 10, 86400);
            }
        }

        #endregion

        #region Private-Members

        private static readonly ConcurrentDictionary<string, CachedName> _Names = new ConcurrentDictionary<string, CachedName>(StringComparer.Ordinal);
        private static int _NameCacheSeconds = 300;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Remember a deployment's name.
        /// </summary>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="name">Name.</param>
        public static void Remember(string? deploymentId, string? name)
        {
            if (String.IsNullOrEmpty(deploymentId) || String.IsNullOrEmpty(name)) return;
            _Names[deploymentId] = new CachedName(name, DateTime.UtcNow.AddSeconds(_NameCacheSeconds));
        }

        /// <summary>
        /// Labels for a run, resolving its deployment name.
        /// </summary>
        /// <param name="database">Database used to resolve the deployment name on a cache miss.</param>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Labels.</returns>
        /// <exception cref="ArgumentNullException">Thrown when database or run is null.</exception>
        public static async Task<RunMetricLabels> LabelsAsync(DatabaseDriverBase database, Run run, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (run == null) throw new ArgumentNullException(nameof(run));
            string? name = null;
            if (!String.IsNullOrEmpty(run.DeploymentId))
            {
                if (_Names.TryGetValue(run.DeploymentId, out CachedName? cached) && cached.ExpiresUtc > DateTime.UtcNow)
                {
                    name = cached.Name;
                }
                else
                {
                    try
                    {
                        Deployment? deployment = await database.Deployments.ReadAsync(run.DeploymentId, token).ConfigureAwait(false);
                        if (deployment != null)
                        {
                            Remember(deployment.Id, deployment.Name);
                            name = deployment.Name;
                        }
                    }
                    catch (Exception e) when (e is not OperationCanceledException)
                    {
                    }
                }
            }
            return RunMetricLabels.For(run, name);
        }

        /// <summary>
        /// Record a created run.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="deploymentName">Deployment name, or null.</param>
        public static void Created(Run run, string? deploymentName)
        {
            if (run == null) return;
            try
            {
                Remember(run.DeploymentId, deploymentName);
                RunMetricLabels labels = RunMetricLabels.For(run, deploymentName);
                TagList tags = GarrisonMetrics.RunTags(labels, "kind", run.Kind.ToString(), false);
                tags.Add("executor", run.Executor.ToString());
                GarrisonMetrics.Count(GarrisonMetricCatalog.RunsCreated, 1, tags);
                if (run.Depth > 0) GarrisonMetrics.Observe(GarrisonMetricCatalog.DelegationDepth, run.Depth, "agent", run.AgentName);
            }
            catch (Exception)
            {
            }
        }

        /// <summary>
        /// Record a run that reached a terminal status. Call it once, after the transition is stored, with the run's
        /// outcome and timing fields as stored.
        /// </summary>
        /// <param name="database">Database used to resolve the deployment name.</param>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public static async Task FinishedAsync(DatabaseDriverBase database, Run run, CancellationToken token = default)
        {
            if (database == null || run == null) return;
            try
            {
                RunMetricLabels labels = await LabelsAsync(database, run, token).ConfigureAwait(false);
                Finished(run, labels);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
            }
        }

        /// <summary>
        /// Record a run that reached a terminal status, with labels already resolved.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="labels">Labels.</param>
        public static void Finished(Run run, RunMetricLabels labels)
        {
            if (run == null || labels == null) return;
            try
            {
                GarrisonMetrics.Count(GarrisonMetricCatalog.RunsFinished, 1, GarrisonMetrics.RunTags(labels, "outcome", run.Outcome.ToString()));

                DateTime completed = run.CompletedUtc ?? DateTime.UtcNow;
                long? queueMs = run.QueueMs ?? Run.ElapsedMs(run.QueuedUtc, run.LeasedUtc);
                long? totalMs = run.TotalMs ?? Run.ElapsedMs(run.QueuedUtc ?? run.CreatedUtc, completed);
                Stage(labels, "queue", queueMs);
                Stage(labels, "startup", Run.ElapsedMs(run.LeasedUtc, run.StartedUtc));
                Stage(labels, "first_token", run.TimeToFirstTokenMs);
                Stage(labels, "first_token_excl_delegation", run.TimeToFirstTokenExcludingDelegationMs);
                Stage(labels, "streaming", run.StreamingMs);
                Stage(labels, "execution", run.ExecutionMs ?? Run.ElapsedMs(run.StartedUtc, run.CompletedUtc));
                if (run.DelegationWaitMs.HasValue && run.DelegationWaitMs.Value > 0) Stage(labels, "delegation_wait", run.DelegationWaitMs);
                Stage(labels, "total", totalMs);

                Tokens(labels, "input", run.InputTokens);
                Tokens(labels, "output", run.OutputTokens);
                Tokens(labels, "cached", run.CachedTokens);
                Tokens(labels, "reasoning", run.ReasoningTokens);

                if (run.CostUsd.HasValue && run.CostUsd.Value > 0)
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunCostUsd, run.CostUsd.Value, GarrisonMetrics.RunTags(labels));
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.RunCost, run.CostUsd.Value, GarrisonMetrics.Tags("agent", labels.Agent, "harness", labels.Harness, "model", labels.Model));
                }
                double? rate = run.OutputTokensPerSecond;
                if (rate.HasValue && rate.Value > 0) GarrisonMetrics.Observe(GarrisonMetricCatalog.RunOutputRate, rate.Value, GarrisonMetrics.Tags("agent", labels.Agent, "harness", labels.Harness, "model", labels.Model));
                if (run.StartedUtc.HasValue) GarrisonMetrics.Observe(GarrisonMetricCatalog.RunToolCalls, run.ToolCallCount, "agent", labels.Agent, "harness", labels.Harness);

                string? guard = RunMetricLabels.Guard(run.Outcome);
                if (guard != null)
                {
                    TagList guardTags = GarrisonMetrics.Tags("guard", guard, "tenant", labels.Tenant, "agent", labels.Agent, "harness", labels.Harness);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.RunGuardTrips, 1, guardTags);
                }
            }
            catch (Exception)
            {
            }
        }

        #endregion

        #region Private-Methods

        private static void Stage(RunMetricLabels labels, string stage, long? milliseconds)
        {
            if (!milliseconds.HasValue || milliseconds.Value < 0) return;
            GarrisonMetrics.Observe(GarrisonMetricCatalog.RunStageDuration, milliseconds.Value / 1000.0, GarrisonMetrics.RunTags(labels, "stage", stage));
        }

        private static void Tokens(RunMetricLabels labels, string direction, long tokens)
        {
            if (tokens <= 0) return;
            GarrisonMetrics.Count(GarrisonMetricCatalog.RunTokens, tokens, GarrisonMetrics.RunTags(labels, "direction", direction));
            GarrisonMetrics.Observe(GarrisonMetricCatalog.HarnessTokens, tokens, GarrisonMetrics.Tags("direction", direction, "agent", labels.Agent, "harness", labels.Harness, "model", labels.Model));
        }

        #endregion
    }
}
