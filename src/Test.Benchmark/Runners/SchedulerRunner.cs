namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Concurrent;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The scheduler command (AA12.4): keeper scheduler load. For each level it creates that many Active mandates on
    /// one fake-harness agent (each with its first wake due at creation and then every --interval-seconds), lets the
    /// scheduler run for --window-seconds after the last create, and reads every tick. Tick lag is the time from a wake
    /// coming due (the tick's scheduledUtc) to the scheduler handling it (startedUtc), whether it started a run or was
    /// skipped because the previous tick still ran. A wake still due and unhandled when the window closes is a censored
    /// value: its lag so far is counted as a lower bound, so a scheduler that falls behind cannot hide its backlog.
    /// Mandates are deleted (force) after each level. Invariant probes (every mandate created, every first wake handled,
    /// one tick at a time, every started tick has a run) make the deterministic subset the CI gate compares.
    /// </summary>
    public static class SchedulerRunner
    {
        #region Public-Methods

        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            List<int> levels = context.Args.GetIntList("levels", "1,100,1000,10000", 1, 100000);
            int windowSeconds = context.Args.GetInt("window-seconds", 120, 10, 3600);
            int intervalSeconds = context.Args.GetInt("interval-seconds", 60, 10, 86400);
            int concurrency = context.Args.GetInt("concurrency", 16, 1, 256);
            bool deterministic = context.Args.GetBool("deterministic", false);
            string agent = context.Args.GetString("agent", "keeper-bench");
            string deployment = context.Args.GetString("deployment", "keeper-bench-fake");

            AutonomyWorkload? workload = await AutonomyWorkload.LoadAsync(context, token).ConfigureAwait(false);
            if (workload == null) return 1;
            if (!await RunnerSupport.WaitReadyAsync(context.Client, TimeSpan.FromSeconds(30), token).ConfigureAwait(false)) return 1;

            DateTime startedUtc = DateTime.UtcNow;
            BenchmarkReport report = new BenchmarkReport();
            report.Kind = "scheduler";
            report.Deterministic = deterministic;
            Workspace workspace;
            try
            {
                workspace = await AutonomySupport.ProvisionAsync(context.Client, "scheduler", workload, null, startedUtc, token).ConfigureAwait(false);
            }
            catch (InvalidOperationException e)
            {
                report.Incomplete = true;
                report.IncompleteReason = "the workload did not provision (" + e.Message + ")";
                await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
                return RunnerSupport.ExitCode(context, report);
            }
            BenchmarkContext.Log("scheduler: tenant " + workspace.Name + ", levels " + String.Join(", ", levels) + ", window " + windowSeconds + " s, interval " + intervalSeconds + " s");
            PrometheusSnapshot before = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));

            foreach (int level in levels)
            {
                token.ThrowIfCancellationRequested();
                await RunLevelAsync(context, report, workspace.TenantId, agent, deployment, level, windowSeconds, intervalSeconds, concurrency, token).ConfigureAwait(false);
            }

            PrometheusSnapshot after = PrometheusSnapshot.Parse(await context.Client.GetMetricsTextAsync(token).ConfigureAwait(false));
            report.Stages = after.Since(before, 25);
            report.Notes.Add("Keeper settings are the server's (defaults: Autonomy.SchedulerSweepSeconds 5, Autonomy.MaxDueClaimsPerSweep 2500, Autonomy.SchedulerSweepConcurrency 32, Autonomy.MinIntervalSeconds 60). A sweep claims at most MaxDueClaimsPerSweep due wakes, SchedulerSweepConcurrency at a time, so the scheduler handles at most MaxDueClaimsPerSweep / SchedulerSweepSeconds wakes per second, less when the database cannot start that many runs in the time; mandates beyond that rate times the interval build a backlog.");
            report.Notes.Add("tickLagMs covers every handled wake (started or skipped) plus censored pending wakes; startedTickLagMs covers only wakes that started a run; firstWakeLagMs is each mandate's first wake, due at creation.");
            report.Notes.Add("Wake times are server timestamps; the window end is the harness clock, which is the same clock on the local stack.");
            await RunnerSupport.FinishAsync(context, report, AutonomyWorkload.DatasetName, workload.Sha256, workload.Path, startedUtc, null, token).ConfigureAwait(false);
            return RunnerSupport.ExitCode(context, report);
        }

        #endregion

        #region Private-Methods

        private static async Task RunLevelAsync(BenchmarkContext context, BenchmarkReport report, string tenantId, string agent, string deployment, int level, int windowSeconds, int intervalSeconds, int concurrency, CancellationToken token)
        {
            GarrisonClient client = context.Client;
            string phaseName = "n" + level.ToString(CultureInfo.InvariantCulture);
            BenchmarkContext.Log("scheduler " + phaseName + ": creating " + level + " mandates");
            DateTime levelStart = DateTime.UtcNow;
            string[] ids = new string[level];
            ConcurrentBag<double> createMs = new ConcurrentBag<double>();
            ConcurrentBag<string> createFailures = new ConcurrentBag<string>();
            await AutonomySupport.ForEachAsync(level, concurrency, async (i, w, t) =>
            {
                MandateCreateRequest request = new MandateCreateRequest();
                request.Name = "keeper-" + level.ToString(CultureInfo.InvariantCulture) + "-" + i.ToString("00000", CultureInfo.InvariantCulture);
                request.AgentId = agent;
                request.DeploymentId = deployment;
                MandateRevisionRequest revision = new MandateRevisionRequest();
                revision.Objective = "Benchmark keeper " + request.Name + ": report the tick and nothing else.";
                revision.WakeMode = "Fixed";
                revision.MinIntervalSeconds = intervalSeconds;
                revision.MaxIntervalSeconds = Math.Max(60, intervalSeconds);
                revision.JitterPercent = 0;
                request.CurrentRevision = revision;
                ApiResponse<Mandate> created = await client.CreateMandateAsync(tenantId, request, t).ConfigureAwait(false);
                if (created.IsSuccess && created.Body != null)
                {
                    ids[i] = created.Body.Id;
                    createMs.Add(created.ElapsedMs);
                }
                else
                {
                    createFailures.Add(request.Name + ": " + created.Describe());
                }
            }, token).ConfigureAwait(false);
            DateTime createdEnd = DateTime.UtcNow;
            List<string> mandateIds = ids.Where(id => !String.IsNullOrEmpty(id)).ToList();
            BenchmarkContext.Log("scheduler " + phaseName + ": " + mandateIds.Count + " created in " + ReportWriter.N((createdEnd - levelStart).TotalSeconds, "F1") + " s; observing for " + windowSeconds + " s");

            DateTime windowEnd = createdEnd.AddSeconds(windowSeconds);
            while (DateTime.UtcNow < windowEnd)
            {
                TimeSpan left = windowEnd - DateTime.UtcNow;
                await Task.Delay(left < TimeSpan.FromSeconds(30) ? left : TimeSpan.FromSeconds(30), token).ConfigureAwait(false);
                if (DateTime.UtcNow < windowEnd) BenchmarkContext.Log("scheduler " + phaseName + ": " + ReportWriter.N((windowEnd - DateTime.UtcNow).TotalSeconds, "F0") + " s left");
            }

            // Pending wakes first (as close to the window end as possible), then every tick.
            List<Mandate>? snapshot = await AutonomySupport.ListAllMandatesAsync(client, tenantId, token).ConfigureAwait(false);
            Dictionary<string, Mandate> byId = (snapshot ?? new List<Mandate>()).ToDictionary(m => m.Id, StringComparer.Ordinal);
            ConcurrentDictionary<string, List<MandateTick>> ticks = new ConcurrentDictionary<string, List<MandateTick>>(StringComparer.Ordinal);
            int tickReadFailures = 0;
            await AutonomySupport.ForEachAsync(mandateIds.Count, concurrency, async (i, w, t) =>
            {
                List<MandateTick>? list = await AutonomySupport.ListAllTicksAsync(client, tenantId, mandateIds[i], t).ConfigureAwait(false);
                if (list == null) Interlocked.Increment(ref tickReadFailures);
                else ticks[mandateIds[i]] = list;
            }, token).ConfigureAwait(false);
            BenchmarkContext.Log("scheduler " + phaseName + ": read " + ticks.Values.Sum(l => l.Count) + " ticks; deleting the mandates");

            AutonomyPhaseResult phase = Analyze(context, phaseName, level, mandateIds, byId, ticks, levelStart, windowEnd, report);
            phase.Counts["createFailed"] = createFailures.Count;
            phase.Counts["tickReadFailures"] = tickReadFailures;
            AutonomySupport.AddTiming(context, phase, "createLatencyMs", createMs.ToList());
            report.AutonomyPhases.Add(phase);

            List<string> createProblems = createFailures.OrderBy(f => f, StringComparer.Ordinal).ToList();
            report.Outcomes.Add(AutonomySupport.Probe("scheduler", phaseName + "-create", "create", phaseName, createProblems, mandateIds.Count + " of " + level + " created"));
            if (snapshot == null || tickReadFailures > 0)
            {
                report.Incomplete = true;
                report.IncompleteReason = "level " + phaseName + ": " + (snapshot == null ? "the mandate list could not be read" : tickReadFailures + " tick lists could not be read");
            }

            int deleteFailed = await AutonomySupport.DeleteMandatesAsync(client, tenantId, mandateIds, concurrency, token).ConfigureAwait(false);
            phase.Counts["deleteFailed"] = deleteFailed;
            if (deleteFailed > 0) report.Notes.Add("Level " + phaseName + ": " + deleteFailed + " mandates could not be deleted and may still tick during later levels.");
            LatencyStatistics? lag;
            phase.Timings.TryGetValue("tickLagMs", out lag);
            BenchmarkContext.Log("scheduler " + phaseName + ": tick lag p50 " + (lag == null ? "n/a" : ReportWriter.N(lag.P50, "F0")) + " ms, p95 " + (lag == null ? "n/a" : ReportWriter.N(lag.P95, "F0")) + " ms, p99 " + (lag == null ? "n/a" : ReportWriter.N(lag.P99, "F0")) + " ms, " + phase.Censored + " censored");
        }

        private static AutonomyPhaseResult Analyze(BenchmarkContext context, string phaseName, int level, List<string> mandateIds, Dictionary<string, Mandate> snapshot, ConcurrentDictionary<string, List<MandateTick>> ticks, DateTime levelStart, DateTime windowEnd, BenchmarkReport report)
        {
            AutonomyPhaseResult phase = new AutonomyPhaseResult();
            phase.Scenario = "scheduler";
            phase.Name = phaseName;
            phase.Level = level;
            phase.WindowSeconds = (windowEnd - levelStart).TotalSeconds;

            List<double> lag = new List<double>();
            List<double> startedLag = new List<double>();
            List<double> firstLag = new List<double>();
            List<string> firstMissing = new List<string>();
            List<string> overlaps = new List<string>();
            List<string> unlinked = new List<string>();
            SortedDictionary<string, int> skipped = new SortedDictionary<string, int>(StringComparer.Ordinal);
            int handled = 0;
            int started = 0;
            int censored = 0;
            int failedTicks = 0;
            int runningAtEnd = 0;

            foreach (string id in mandateIds)
            {
                List<MandateTick> list = ticks.TryGetValue(id, out List<MandateTick>? found) ? found : new List<MandateTick>();
                List<MandateTick> due = list.Where(t => t.ScheduledUtc <= windowEnd).OrderBy(t => t.ScheduledUtc).ToList();
                foreach (MandateTick tick in due)
                {
                    if (tick.StartedUtc <= windowEnd)
                    {
                        double ms = AutonomySupport.Ms(tick.ScheduledUtc, tick.StartedUtc);
                        lag.Add(ms);
                        handled++;
                        if (tick.Outcome == "Skipped")
                        {
                            string code = "skipped." + (tick.ErrorCode ?? "Unknown");
                            skipped[code] = skipped.TryGetValue(code, out int count) ? count + 1 : 1;
                        }
                        else if (tick.RunId == null)
                        {
                            // A claimed wake that never got a run (for example StartInterrupted or a refused start).
                            unlinked.Add(id + "/" + tick.Id + " has no run (" + (tick.Outcome ?? "no outcome") + (tick.ErrorCode == null ? String.Empty : ", " + tick.ErrorCode) + ")");
                            failedTicks++;
                        }
                        else
                        {
                            started++;
                            startedLag.Add(ms);
                            if (tick.Outcome == "Failed") failedTicks++;
                            if (!tick.FinishedUtc.HasValue || tick.FinishedUtc.Value > windowEnd) runningAtEnd++;
                        }
                    }
                    else
                    {
                        lag.Add(AutonomySupport.Ms(tick.ScheduledUtc, windowEnd));
                        censored++;
                    }
                }

                // A wake still due in the snapshot and not among the ticks read afterwards was never handled.
                if (snapshot.TryGetValue(id, out Mandate? mandate) && mandate.Status == "Active" && mandate.NextWakeUtc.HasValue && mandate.NextWakeUtc.Value <= windowEnd)
                {
                    DateTime pending = mandate.NextWakeUtc.Value;
                    bool seen = list.Any(t => Math.Abs((t.ScheduledUtc - pending).TotalMilliseconds) < 1);
                    if (!seen)
                    {
                        lag.Add(AutonomySupport.Ms(pending, windowEnd));
                        censored++;
                    }
                }

                MandateTick? first = list.OrderBy(t => t.ScheduledUtc).FirstOrDefault();
                if (first != null && first.StartedUtc <= windowEnd) firstLag.Add(AutonomySupport.Ms(first.ScheduledUtc, first.StartedUtc));
                else
                {
                    firstMissing.Add(id + " had no tick by the window end");
                    DateTime firstDue = first?.ScheduledUtc ?? (snapshot.TryGetValue(id, out Mandate? m) && m.NextWakeUtc.HasValue ? m.NextWakeUtc.Value : windowEnd);
                    firstLag.Add(AutonomySupport.Ms(firstDue, windowEnd));
                }

                List<MandateTick> runs = list.Where(t => t.RunId != null && t.StartedUtc <= windowEnd).OrderBy(t => t.StartedUtc).ToList();
                for (int i = 1; i < runs.Count; i++)
                {
                    MandateTick previous = runs[i - 1];
                    if (!previous.FinishedUtc.HasValue || previous.FinishedUtc.Value > runs[i].StartedUtc)
                        overlaps.Add(id + ": tick " + runs[i].Id + " started while " + previous.Id + " was still running");
                }
            }

            phase.Operations = handled + censored;
            phase.Succeeded = handled;
            phase.Failed = failedTicks;
            phase.Censored = censored;
            phase.Throughput = phase.WindowSeconds > 0 ? handled / phase.WindowSeconds : 0;
            phase.Counts["mandates"] = mandateIds.Count;
            phase.Counts["wakesHandled"] = handled;
            phase.Counts["ticksStarted"] = started;
            phase.Counts["ticksFailed"] = failedTicks;
            phase.Counts["ticksRunningAtWindowEnd"] = runningAtEnd;
            phase.Counts["wakesPendingAtWindowEnd"] = censored;
            phase.Counts["mandatesWithoutTick"] = firstMissing.Count;
            foreach (KeyValuePair<string, int> skip in skipped) phase.Counts[skip.Key] = skip.Value;
            AutonomySupport.AddTiming(context, phase, "tickLagMs", lag);
            AutonomySupport.AddTiming(context, phase, "startedTickLagMs", startedLag);
            AutonomySupport.AddTiming(context, phase, "firstWakeLagMs", firstLag);

            report.Outcomes.Add(AutonomySupport.Probe("scheduler", phaseName + "-first-wake", "first-wake", phaseName, firstMissing, (mandateIds.Count - firstMissing.Count) + " of " + mandateIds.Count + " mandates ticked by the window end"));
            report.Outcomes.Add(AutonomySupport.Probe("scheduler", phaseName + "-single-flight", "single-flight", phaseName, overlaps, started + " started ticks, " + overlaps.Count + " overlapping"));
            report.Outcomes.Add(AutonomySupport.Probe("scheduler", phaseName + "-tick-runs", "tick-runs", phaseName, unlinked, started + " started ticks linked to runs"));
            return phase;
        }

        #endregion
    }
}
