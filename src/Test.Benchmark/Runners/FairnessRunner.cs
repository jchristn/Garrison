namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Datasets;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>Finite noisy-neighbor load test with per-tenant wall-clock queue percentiles across one or more replicas.</summary>
    public static class FairnessRunner
    {
        /// <summary>Submit a noisy tenant's 100x workload alongside quiet tenants and record queue p95 against an explicit target.</summary>
        /// <param name="context">Benchmark arguments.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Zero when all calls and quiet-tenant p95 targets pass; one otherwise.</returns>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            LoadedDataset? loaded = RunnerSupport.LoadDataset(context, "benchmarks/datasets/synthetic-fleet.json");
            if (loaded == null) return 1;
            string corpusId = context.Args.GetString("corpus", "load");
            string agent = context.Args.GetString("agent", "load-echo");
            int quietRuns = context.Args.GetInt("quiet-runs", 10, 1, 1000);
            int quietTenants = context.Args.GetInt("quiet-tenants", 2, 1, 10);
            int multiplier = context.Args.GetInt("noisy-multiplier", 100, 1, 1000);
            int delayMs = context.Args.GetInt("delay-ms", 0, 0, 5000);
            int waitSeconds = context.Args.GetInt("wait-seconds", 600, 1, 600);
            bool waitInvoke = context.Args.GetBool("wait-invoke", false);
            int pollMs = context.Args.GetInt("completion-poll-ms", 500, 100, 10000);
            double target = context.Args.GetDouble("max-quiet-p95-ms", 10000, 1, 3600000);
            List<string> urls = context.Args.GetList("urls", context.Client.BaseUrl);
            int total = checked(quietRuns * (multiplier + quietTenants));
            if (total > context.Client.MaxConnectionsPerServer * urls.Count)
                throw new ArgumentException("Fairness test needs at least one connection per outstanding invoke so the client does not hide quiet tenants behind its own queue; increase --max-connections or reduce --quiet-runs.");
            BenchmarkCorpus corpus = loaded.Dataset.Corpora.FirstOrDefault(c => c.Id == corpusId) ?? throw new ArgumentException("Dataset has no corpus " + corpusId + ".");
            DateTime started = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport { Kind = "fairness" };
            report.Notes.Add("Finite equal-weight tenant workload: noisy tenant receives " + multiplier + " times each quiet tenant's submissions. Runs are interleaved in rounds. Server queueMs, not client admission delay, determines fairness. Quiet p95 target " + target.ToString("R", CultureInfo.InvariantCulture) + " ms. No claim of steady-state fairness or a universal production latency target.");
            report.Notes.Add("Invocation wait mode: " + waitInvoke + "; asynchronous mode uses bulk tenant completion reads every " + pollMs + " ms instead of a waiting HTTP request per run. QueueMs comes from server timestamps. Admission latency is reported separately.");
            report.Notes.Add("Replica endpoints: " + String.Join(", ", urls) + ". Restarting replicas resets their local virtual service history.");
            using (ScaleCluster cluster = new ScaleCluster(urls, context.Args.GetString("admin-key", BenchmarkContext.DefaultAdminKey, "GARRISON_BENCH_ADMIN_KEY"), context.Client.MaxConnectionsPerServer, context.Client.RequestTimeoutSeconds))
            {
                for (int index = 0; index < cluster.Count; index++)
                    if (!await RunnerSupport.WaitReadyAsync(cluster.Client(index), TimeSpan.FromSeconds(60), token).ConfigureAwait(false)) return 1;
                Provisioner provisioner = new Provisioner(cluster.Client(0));
                string suffix = "fair-" + Guid.NewGuid().ToString("N").Substring(0, 8);
                Workspace noisy = await provisioner.ProvisionAsync(loaded.Dataset.Name, corpus, suffix + "-noisy", token).ConfigureAwait(false);
                List<Workspace> quiet = new List<Workspace>();
                for (int index = 0; index < quietTenants; index++) quiet.Add(await provisioner.ProvisionAsync(loaded.Dataset.Name, corpus, suffix + "-quiet" + index, token).ConfigureAwait(false));
                PrometheusSnapshot before = PrometheusSnapshot.Parse(await cluster.Client(0).GetMetricsTextAsync(token).ConfigureAwait(false));
                List<Task<ProbeOutcome>> tasks = new List<Task<ProbeOutcome>>();
                int sequence = 0;
                for (int round = 0; round < quietRuns; round++)
                {
                    for (int index = 0; index < multiplier; index++)
                    {
                        int current = sequence++;
                        tasks.Add(InvokeAsync(cluster.Client(current % cluster.Count), noisy, "noisy", agent, delayMs, waitSeconds, waitInvoke, current, token));
                    }
                    for (int index = 0; index < quiet.Count; index++)
                    {
                        int current = sequence++;
                        tasks.Add(InvokeAsync(cluster.Client(current % cluster.Count), quiet[index], "quiet-" + index, agent, delayMs, waitSeconds, waitInvoke, current, token));
                    }
                }
                report.Outcomes.AddRange(await Task.WhenAll(tasks).ConfigureAwait(false));
                if (!waitInvoke || report.Outcomes.Any(o => o.Timings.ContainsKey("synchronousFallback")))
                {
                    Dictionary<string, Workspace> workspaces = new Dictionary<string, Workspace>(StringComparer.Ordinal) { ["noisy"] = noisy };
                    for (int index = 0; index < quiet.Count; index++) workspaces["quiet-" + index] = quiet[index];
                    await CompleteAsync(cluster.Client(0), workspaces, report.Outcomes, agent, started, waitSeconds, pollMs, token).ConfigureAwait(false);
                }
                int fallbackCount = report.Outcomes.Count(o => o.Timings.ContainsKey("synchronousFallback"));
                report.Notes.Add("Synchronous wait budget returned accepted 202 responses for " + fallbackCount + " runs. Those runs were followed by bulk polling and their early response time is excluded from synchronous terminal client latency. This is not an all-requests-held synchronous experiment.");
                report.Stages = PrometheusSnapshot.Parse(await cluster.Client(0).GetMetricsTextAsync(token).ConfigureAwait(false)).Since(before, 30);
                report.Notes.Add("Stage counter deltas are from the first replica only; multi-replica queue percentiles still include all submitted runs.");
                bool passed = report.Outcomes.All(o => o.Passed);
                foreach (IGrouping<string, ProbeOutcome> group in report.Outcomes.Where(o => o.Arm.StartsWith("quiet-", StringComparison.Ordinal)).GroupBy(o => o.Arm).ToList())
                {
                    List<double> queues = group.Where(o => o.Passed && o.Timings.ContainsKey("queueMs")).Select(o => o.Timings["queueMs"]).OrderBy(v => v).ToList();
                    double p95 = queues.Count > 0 ? LatencyStatistics.Percentile(queues, 95) : Double.PositiveInfinity;
                    bool within = queues.Count == quietRuns && p95 <= target;
                    passed &= within;
                    ProbeOutcome guard = new ProbeOutcome { Arm = "guard-" + group.Key, Corpus = "fairness", ProbeId = "queue-p95", Type = "p95-target", Category = "tenant-queue", Passed = within, Score = within ? 1 : 0, Observed = p95.ToString("0.###", CultureInfo.InvariantCulture) + " ms against " + target.ToString("R", CultureInfo.InvariantCulture) + " ms" };
                    if (!within) guard.Failures.Add("Quiet tenant queue p95 exceeded the configured target or a run did not succeed.");
                    report.Outcomes.Add(guard);
                    report.Notes.Add(group.Key + " queue p95 " + p95.ToString("0.###", CultureInfo.InvariantCulture) + " ms over " + queues.Count + " successful runs: " + (within ? "PASS" : "FAIL") + " against " + target.ToString("R", CultureInfo.InvariantCulture) + " ms.");
                }
                await RunnerSupport.FinishAsync(context, report, loaded.Dataset.Name, loaded.Sha256, loaded.Path, started, null, token).ConfigureAwait(false);
                return passed ? 0 : 1;
            }
        }

        private static async Task CompleteAsync(GarrisonClient client, Dictionary<string, Workspace> workspaces, List<ProbeOutcome> outcomes, string agentName, DateTime started, int waitSeconds, int pollMs, CancellationToken token)
        {
            Dictionary<string, string> agentIds = new Dictionary<string, string>(StringComparer.Ordinal);
            Dictionary<string, ProbeOutcome> pending = outcomes.Where(o => o.Passed && o.RunIds.Count == 1 && !o.Timings.ContainsKey("totalMs")).ToDictionary(o => o.RunIds[0], StringComparer.Ordinal);
            foreach (KeyValuePair<string, Workspace> entry in workspaces)
            {
                ApiResponse<Agent> agent = await client.GetAgentAsync(entry.Value.TenantId, agentName, token).ConfigureAwait(false);
                if (agent.Body == null) throw new InvalidOperationException("Fairness agent could not be read: " + agent.Describe());
                agentIds[entry.Key] = agent.Body.Id;
            }
            DateTime deadline = DateTime.UtcNow.AddSeconds(waitSeconds);
            while (pending.Count > 0 && DateTime.UtcNow < deadline)
            {
                token.ThrowIfCancellationRequested();
                foreach (KeyValuePair<string, Workspace> entry in workspaces)
                {
                    if (!pending.Values.Any(o => o.Arm == entry.Key)) continue;
                    int skip = 0;
                    while (true)
                    {
                        ApiResponse<EnumerationResult<Run>> page = await client.ListRunsAsync(entry.Value.TenantId, agentIds[entry.Key], started, skip, token).ConfigureAwait(false);
                        if (page.Body == null) throw new InvalidOperationException("Fairness completion list failed: " + page.Describe());
                        foreach (Run run in page.Body.Objects)
                        {
                            if (!pending.TryGetValue(run.Id, out ProbeOutcome? outcome) || (run.Status != "Succeeded" && run.Status != "Failed" && run.Status != "Cancelled" && run.Status != "TimedOut" && run.Status != "Rejected")) continue;
                            pending.Remove(run.Id);
                            outcome.Passed = run.Status == "Succeeded";
                            outcome.Score = outcome.Passed ? 1 : 0;
                            outcome.Observed = run.Status + ": " + run.Outcome;
                            if (!outcome.Passed) outcome.Failures.Add(outcome.Observed);
                            if (run.QueueMs.HasValue) outcome.Timings["queueMs"] = run.QueueMs.Value;
                            if (run.LeasedUtc.HasValue && run.StartedUtc.HasValue) outcome.Timings["leaseToStartedMs"] = (run.StartedUtc.Value - run.LeasedUtc.Value).TotalMilliseconds;
                            if (run.ExecutionMs.HasValue) outcome.Timings["executionMs"] = run.ExecutionMs.Value;
                            if (run.TotalMs.HasValue) outcome.Timings["totalMs"] = run.TotalMs.Value;
                        }
                        if (page.Body.EndOfResults || page.Body.Objects.Count == 0) break;
                        skip += page.Body.Objects.Count;
                    }
                }
                if (pending.Count > 0) await Task.Delay(pollMs, token).ConfigureAwait(false);
            }
            foreach (ProbeOutcome outcome in pending.Values)
            {
                outcome.Passed = false;
                outcome.Score = 0;
                outcome.Failures.Add("Run did not finish before the completion deadline.");
            }
        }

        private static async Task<ProbeOutcome> InvokeAsync(GarrisonClient client, Workspace workspace, string arm, string agent, int delayMs, int waitSeconds, bool waitInvoke, int sequence, CancellationToken token)
        {
            Stopwatch timer = Stopwatch.StartNew();
            ApiResponse<Run> response = await client.InvokeAsync(workspace.TenantId, agent, new RunCreateRequest { Input = "fairness " + sequence.ToString(CultureInfo.InvariantCulture), Wait = waitInvoke, WaitSeconds = waitSeconds, CancelOnDisconnect = false, Parameters = new Dictionary<string, string> { ["delayMs"] = delayMs.ToString(CultureInfo.InvariantCulture) } }, token).ConfigureAwait(false);
            ProbeOutcome outcome = new ProbeOutcome { Arm = arm, Corpus = "fairness", ProbeId = "invoke-" + sequence, Type = "fairness", Category = "tenant-queue", LatencyMs = waitInvoke ? timer.Elapsed.TotalMilliseconds : null };
            Run? run = response.Body;
            bool fallback = waitInvoke && response.StatusCode == 202 && run != null;
            outcome.Passed = waitInvoke ? (response.StatusCode == 200 && run?.Status == "Succeeded") || fallback : response.StatusCode == 202 && run != null;
            if (fallback)
            {
                outcome.Timings["synchronousFallback"] = 1;
                outcome.Timings["fallbackResponseMs"] = timer.Elapsed.TotalMilliseconds;
                outcome.LatencyMs = null;
            }
            if (!waitInvoke) outcome.Timings["admissionMs"] = timer.Elapsed.TotalMilliseconds;
            outcome.Score = outcome.Passed ? 1 : 0;
            outcome.Errored = !response.IsSuccess;
            outcome.Observed = run == null ? response.Describe() : run.Status + ": " + run.Outcome;
            if (!outcome.Passed) outcome.Failures.Add(outcome.Observed);
            if (run != null)
            {
                outcome.RunIds.Add(run.Id);
                if (run.QueueMs.HasValue) outcome.Timings["queueMs"] = run.QueueMs.Value;
                if (run.LeasedUtc.HasValue && run.StartedUtc.HasValue) outcome.Timings["leaseToStartedMs"] = (run.StartedUtc.Value - run.LeasedUtc.Value).TotalMilliseconds;
                if (run.ExecutionMs.HasValue) outcome.Timings["executionMs"] = run.ExecutionMs.Value;
                if (run.TotalMs.HasValue) outcome.Timings["totalMs"] = run.TotalMs.Value;
            }
            return outcome;
        }
    }
}
