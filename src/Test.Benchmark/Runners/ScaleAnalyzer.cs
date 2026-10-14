namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// Turns a scale level's submissions, run records, and metric scrapes into its result: throughput, latency
    /// distributions, subsystem counters, the breaking verdict, and saturation evidence. Stateless and thread-safe.
    /// </summary>
    public static class ScaleAnalyzer
    {
        #region Public-Members

        /// <summary>
        /// Run statuses that are final.
        /// </summary>
        public static readonly IReadOnlyList<string> TerminalStatuses = new List<string> { "Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Fill a level's run-based measurements from its submissions and the final run records.
        /// </summary>
        /// <param name="level">Level to fill.</param>
        /// <param name="submissions">Every submission of the level.</param>
        /// <param name="runs">Final run records by run identifier (runs missing from it count as unfinished).</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static void MeasureRuns(ScaleLevelResult level, List<ScaleSubmission> submissions, Dictionary<string, Run> runs)
        {
            if (level == null) throw new ArgumentNullException(nameof(level));
            if (submissions == null) throw new ArgumentNullException(nameof(submissions));
            if (runs == null) throw new ArgumentNullException(nameof(runs));

            level.Submitted = submissions.Count;
            level.Accepted = submissions.Count(s => s.RunId != null);
            level.SubmitErrorsByKind.Clear();
            foreach (IGrouping<string, ScaleSubmission> kind in submissions.Where(s => s.RunId == null).GroupBy(s => s.FailureKind ?? "unknown"))
                level.SubmitErrorsByKind[kind.Key] = kind.Count();

            List<Run> finished = new List<Run>();
            level.Unfinished = 0;
            level.RunFailuresByKind.Clear();
            foreach (ScaleSubmission submission in submissions.Where(s => s.RunId != null))
            {
                if (!runs.TryGetValue(submission.RunId!, out Run? run) || run.Status == null || !TerminalStatuses.Contains(run.Status))
                {
                    level.Unfinished++;
                    continue;
                }
                finished.Add(run);
                if (run.Status != "Succeeded")
                {
                    string kind = run.Status + "/" + (run.Outcome ?? "none");
                    level.RunFailuresByKind.TryGetValue(kind, out int count);
                    level.RunFailuresByKind[kind] = count + 1;
                }
            }
            List<Run> ok = finished.Where(r => r.Status == "Succeeded").ToList();
            level.Succeeded = ok.Count;
            int failures = level.Submitted - level.Accepted + level.RunFailuresByKind.Values.Sum() + level.Unfinished;
            level.ErrorRate = level.Submitted > 0 ? failures / (double)level.Submitted : 0;

            List<double> submitLatencies = submissions.Where(s => s.RunId != null).Select(s => s.LatencyMs).ToList();
            if (submitLatencies.Count > 0) level.SubmitLatency = LatencyStatistics.From(submitLatencies, 0, 0);
            List<double> claims = finished.Where(r => r.QueuedUtc.HasValue && r.LeasedUtc.HasValue).Select(r => Math.Max(0, (r.LeasedUtc!.Value - r.QueuedUtc!.Value).TotalMilliseconds)).ToList();
            if (claims.Count > 0) level.ClaimLatency = LatencyStatistics.From(claims, 0, 0);
            List<double> endToEnd = ok.Where(r => r.CompletedUtc.HasValue).Select(r => Math.Max(0, (r.CompletedUtc!.Value - r.CreatedUtc).TotalMilliseconds)).ToList();
            if (endToEnd.Count > 0) level.EndToEndLatency = LatencyStatistics.From(endToEnd, 0, 0);
            List<double> execution = ok.Where(r => r.ExecutionMs.HasValue).Select(r => (double)r.ExecutionMs!.Value).ToList();
            if (execution.Count > 0) level.Execution = LatencyStatistics.From(execution, 0, 0);
            List<double> overhead = ok.Where(r => r.CompletedUtc.HasValue && r.ExecutionMs.HasValue).Select(r => Math.Max(0, (r.CompletedUtc!.Value - r.CreatedUtc).TotalMilliseconds - r.ExecutionMs!.Value)).ToList();
            if (overhead.Count > 0) level.Overhead = LatencyStatistics.From(overhead, 0, 0);

            List<DateTime> completions = ok.Where(r => r.CompletedUtc.HasValue).Select(r => r.CompletedUtc!.Value).OrderBy(t => t).ToList();
            if (completions.Count >= 2)
            {
                // Completions of a level that keeps up arrive at the offered rate, one run duration after their
                // submissions; a level that cannot keep up spreads them out. N completions span N - 1 intervals.
                double seconds = (completions[completions.Count - 1] - completions[0]).TotalSeconds;
                level.RunsPerSecond = seconds > 0 ? (completions.Count - 1) / seconds : 0;
            }
            level.PeakActive = Peak(finished.Where(r => r.LeasedUtc.HasValue).Select(r => new KeyValuePair<DateTime, DateTime>(r.LeasedUtc!.Value, r.CompletedUtc ?? DateTime.MaxValue)));
            level.PeakQueued = Peak(finished.Where(r => r.QueuedUtc.HasValue).Select(r => new KeyValuePair<DateTime, DateTime>(r.QueuedUtc!.Value, r.LeasedUtc ?? r.CompletedUtc ?? DateTime.MaxValue)));
        }

        /// <summary>
        /// Subsystem counters for a level: the difference between two cluster-wide scrapes.
        /// </summary>
        /// <param name="before">Scrape before the level.</param>
        /// <param name="after">Scrape after the level drained.</param>
        /// <param name="agent">Agent whose finished runs are the per-run divisor.</param>
        /// <param name="peakConnections">Most database connections seen in use while the level ran.</param>
        /// <returns>Subsystem counters.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static ScaleSubsystems Subsystems(PrometheusSamples before, PrometheusSamples after, string agent, double peakConnections)
        {
            if (before == null) throw new ArgumentNullException(nameof(before));
            if (after == null) throw new ArgumentNullException(nameof(after));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            ScaleSubsystems s = new ScaleSubsystems();
            s.Replicas = Math.Min(before.Scrapes, after.Scrapes);
            s.RunsFinished = Delta(before, after, "garrison_runs_finished_total", x => x.Label("agent") == agent);
            double runs = Math.Max(1, s.RunsFinished);

            s.EventsReceived = Delta(before, after, "garrison_run_events_total", null);
            s.EventBatches = Delta(before, after, "garrison_event_batch_size_count", null);
            Func<PrometheusSample, bool> eventInserts = x => x.Label("table") == "run_events" && (x.Label("operation") == "insert" || x.Label("operation") == "upsert");
            s.EventInsertStatements = Delta(before, after, "garrison_db_operation_duration_seconds_count", eventInserts);
            s.EventInsertMeanMs = MeanMs(before, after, "garrison_db_operation_duration_seconds", eventInserts);

            s.WakeupsNotify = Delta(before, after, "garrison_scheduler_queue_wakeups_total", x => x.Label("source") == "notify");
            s.WakeupsPoll = Delta(before, after, "garrison_scheduler_queue_wakeups_total", x => x.Label("source") == "poll");
            s.LeaseRequestsAssigned = Delta(before, after, "garrison_scheduler_lease_requests_total", x => x.Label("result") == "assigned");
            s.LeaseRequestsEmpty = Delta(before, after, "garrison_scheduler_lease_requests_total", x => x.Label("result") == "empty");
            s.EmptyClaimPasses = Delta(before, after, "garrison_scheduler_claim_duration_seconds_count", x => x.Label("result") == "empty");

            s.LeaseRenewals = Delta(before, after, "garrison_lease_renewals_total", x => x.Label("result") == "renewed");
            s.LeaseRenewalsLost = Delta(before, after, "garrison_lease_renewals_total", x => x.Label("result") == "lost");
            s.LeaseExpirations = Delta(before, after, "garrison_lease_expirations_total", null);
            s.Heartbeats = Delta(before, after, "garrison_node_heartbeats_total", null);

            s.DeploymentLockAcquisitions = Delta(before, after, "garrison_scheduler_deployment_lock_wait_seconds_count", null);
            s.DeploymentLockTotalWaitMs = Delta(before, after, "garrison_scheduler_deployment_lock_wait_seconds_sum", null) * 1000.0;
            s.DeploymentLockMeanWaitMs = s.DeploymentLockAcquisitions > 0 ? s.DeploymentLockTotalWaitMs / s.DeploymentLockAcquisitions : 0;
            s.Claims = DeltaBy(before, after, "garrison_claims_total", "result", null);

            s.DbStatements = Delta(before, after, "garrison_db_operation_duration_seconds_count", null);
            s.DbMeanMs = MeanMs(before, after, "garrison_db_operation_duration_seconds", null);
            s.DbStatementsPerRun = s.DbStatements / runs;
            SortedDictionary<string, double> byTable = DeltaBy(before, after, "garrison_db_operation_duration_seconds_count", "table", null);
            foreach (KeyValuePair<string, double> table in byTable.OrderByDescending(t => t.Value).Take(12)) s.DbStatementsPerRunByTable[table.Key] = table.Value / runs;
            s.RequestHistoryHeaderInsertsPerRun = Delta(before, after, "garrison_db_operation_duration_seconds_count", x => x.Label("table") == "request_history_headers" && x.Label("operation") == "insert") / runs;
            s.RequestHistoryInsertsPerRun = Delta(before, after, "garrison_db_operation_duration_seconds_count", x => x.Label("table") == "request_history" && x.Label("operation") == "insert") / runs;
            s.DbErrors = Delta(before, after, "garrison_db_errors_total", null);
            s.DbRetries = Delta(before, after, "garrison_db_transaction_retries_total", null);
            s.PeakDbConnections = peakConnections;

            s.HttpByStatusClass = DeltaBy(before, after, "garrison_http_requests_total", "status_class", null);
            s.Http429And503 = Delta(before, after, "garrison_http_requests_total", x => x.Label("status_code") == "429" || x.Label("status_code") == "503");
            return s;
        }

        /// <summary>
        /// Decide whether a level broke, recording why.
        /// </summary>
        /// <param name="level">Level (measured).</param>
        /// <param name="previous">Previous level, or null for the first.</param>
        /// <param name="settings">Sweep settings.</param>
        /// <exception cref="ArgumentNullException">Thrown when level or settings is null.</exception>
        public static void Judge(ScaleLevelResult level, ScaleLevelResult? previous, ScaleSettings settings)
        {
            if (level == null) throw new ArgumentNullException(nameof(level));
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            level.BreakReasons.Clear();
            if (level.ErrorRate > settings.MaxErrorRate)
                level.BreakReasons.Add("error rate " + Pct(level.ErrorRate) + " > " + Pct(settings.MaxErrorRate));
            if (level.ClaimLatency != null && level.ClaimLatency.P95 > settings.MaxClaimP95Ms)
                level.BreakReasons.Add("claim p95 " + F0(level.ClaimLatency.P95) + " ms > " + F0(settings.MaxClaimP95Ms) + " ms");
            if (level.EndToEndLatency != null && level.EndToEndLatency.P95 > settings.EndToEndThresholdMs)
                level.BreakReasons.Add("end-to-end p95 " + F0(level.EndToEndLatency.P95) + " ms > " + F0(settings.EndToEndThresholdMs) + " ms");
            if (level.Mode == "open" && level.OfferedRate > 0 && level.RunsPerSecond < settings.PlateauRatio * level.OfferedRate)
                level.BreakReasons.Add("throughput plateau: " + F1(level.RunsPerSecond) + " runs/s < " + Pct(settings.PlateauRatio) + " of the offered " + F1(level.OfferedRate) + "/s");
            if (level.Mode == "closed" && previous != null && previous.RunsPerSecond > 0 && level.RunsPerSecond < previous.RunsPerSecond * (2.0 - settings.PlateauRatio))
                level.BreakReasons.Add("throughput plateau: " + F1(level.RunsPerSecond) + " runs/s grew less than " + Pct(1.0 - settings.PlateauRatio) + " over " + F1(previous.RunsPerSecond) + " runs/s");
            level.Broken = level.BreakReasons.Count > 0;
        }

        /// <summary>
        /// Saturation evidence for a level, compared with the sweep's first level, strongest first.
        /// </summary>
        /// <param name="level">Level (measured and judged).</param>
        /// <param name="baseline">First level of the sweep (may be the level itself).</param>
        /// <param name="settings">Sweep settings.</param>
        /// <returns>Signals, strongest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static List<SaturationSignal> Signals(ScaleLevelResult level, ScaleLevelResult baseline, ScaleSettings settings)
        {
            if (level == null) throw new ArgumentNullException(nameof(level));
            if (baseline == null) throw new ArgumentNullException(nameof(baseline));
            if (settings == null) throw new ArgumentNullException(nameof(settings));
            List<SaturationSignal> signals = new List<SaturationSignal>();
            ScaleSubsystems now = level.Subsystems;
            ScaleSubsystems was = baseline.Subsystems;

            if (level.Slots > 0 && level.PeakActive >= 0.9 * level.Slots)
                Add(signals, "worker capacity", "peak " + level.PeakActive + " runs leased or running of " + level.Slots + " slots", 50.0 * level.PeakActive / level.Slots, false);
            int dropped = level.SubmitErrorsByKind.Where(k => k.Key.StartsWith("client:", StringComparison.Ordinal)).Sum(k => k.Value);
            if (dropped > 0) Add(signals, "load generator", dropped + " submissions dropped by the client (submit concurrency exhausted)", 20, false);
            if (level.Mode == "open" && level.OfferedRate > 0 && level.AchievedSubmitRate < 0.9 * level.OfferedRate)
                Add(signals, "load generator", "achieved " + F1(level.AchievedSubmitRate) + "/s of the offered " + F1(level.OfferedRate) + "/s", 5 * level.OfferedRate / Math.Max(0.1, level.AchievedSubmitRate), false);

            int serverErrors = level.SubmitErrorsByKind.Where(k => !k.Key.StartsWith("client:", StringComparison.Ordinal)).Sum(k => k.Value);
            if (serverErrors > 0) Add(signals, "API admission", serverErrors + " submissions refused or failed (" + String.Join(", ", level.SubmitErrorsByKind.Where(k => !k.Key.StartsWith("client:", StringComparison.Ordinal)).Select(k => k.Key + " x" + k.Value)) + ")", 30);
            double submitRatio = Ratio(level.SubmitLatency?.P95, baseline.SubmitLatency?.P95);
            if (submitRatio >= 3) Add(signals, "API admission", "submit p95 " + F0(level.SubmitLatency!.P95) + " ms, " + F1(submitRatio) + "x the first level", submitRatio);

            if (now.DbErrors > 0) Add(signals, "database", F0(now.DbErrors) + " statement errors", 25 + now.DbErrors);
            double dbRatio = Ratio(now.DbMeanMs, was.DbMeanMs);
            if (dbRatio >= 2) Add(signals, "database", "mean statement " + F2(now.DbMeanMs) + " ms, " + F1(dbRatio) + "x the first level; peak " + F0(now.PeakDbConnections) + " connections", dbRatio);
            double eventRatio = Ratio(now.EventInsertMeanMs, was.EventInsertMeanMs);
            if (eventRatio >= 2) Add(signals, "event ingestion", "mean run_events insert " + F2(now.EventInsertMeanMs) + " ms, " + F1(eventRatio) + "x the first level", eventRatio);
            double lockRatio = Ratio(now.DeploymentLockMeanWaitMs, was.DeploymentLockMeanWaitMs);
            if (lockRatio >= 2 && now.DeploymentLockMeanWaitMs >= 1)
                Add(signals, "deployment lock", "mean wait " + F2(now.DeploymentLockMeanWaitMs) + " ms per claim, " + F1(lockRatio) + "x the first level (" + F0(now.DeploymentLockTotalWaitMs) + " ms total)", lockRatio);
            // A heartbeat that races a completion finds its lease gone; that is normal. Many lost renewals, or any
            // expiration, means renewals are not keeping up.
            if (now.LeaseExpirations > 0 || now.LeaseRenewalsLost > Math.Max(5, 0.05 * (now.LeaseRenewals + now.LeaseRenewalsLost)))
                Add(signals, "lease renewals", F0(now.LeaseRenewalsLost) + " lost renewals of " + F0(now.LeaseRenewals + now.LeaseRenewalsLost) + ", " + F0(now.LeaseExpirations) + " expirations", 15 + now.LeaseRenewalsLost + now.LeaseExpirations);
            double claimRatio = Ratio(level.ClaimLatency?.P95, baseline.ClaimLatency?.P95);
            if (claimRatio >= 3 && (level.Slots == 0 || level.PeakActive < 0.9 * level.Slots))
                Add(signals, "scheduler", "claim p95 " + F0(level.ClaimLatency!.P95) + " ms, " + F1(claimRatio) + "x the first level, with free slots (peak " + level.PeakActive + " of " + level.Slots + "); wakeups notify " + F0(now.WakeupsNotify) + ", poll " + F0(now.WakeupsPoll), claimRatio);
            return signals.OrderByDescending(s => s.Score).ToList();
        }

        /// <summary>
        /// Offered load of a level as text: 200/s (open) or c400 (closed).
        /// </summary>
        /// <param name="level">Level.</param>
        /// <returns>Text.</returns>
        /// <exception cref="ArgumentNullException">Thrown when level is null.</exception>
        public static string LoadText(ScaleLevelResult level)
        {
            if (level == null) throw new ArgumentNullException(nameof(level));
            return level.Mode == "open" ? level.OfferedRate.ToString("0.##", CultureInfo.InvariantCulture) + "/s" : "c" + level.Concurrency.ToString(CultureInfo.InvariantCulture);
        }

        #endregion

        #region Private-Methods

        private static int Peak(IEnumerable<KeyValuePair<DateTime, DateTime>> intervals)
        {
            List<KeyValuePair<DateTime, int>> edges = new List<KeyValuePair<DateTime, int>>();
            foreach (KeyValuePair<DateTime, DateTime> interval in intervals)
            {
                edges.Add(new KeyValuePair<DateTime, int>(interval.Key, 1));
                edges.Add(new KeyValuePair<DateTime, int>(interval.Value, -1));
            }
            int current = 0;
            int peak = 0;
            foreach (KeyValuePair<DateTime, int> edge in edges.OrderBy(e => e.Key).ThenBy(e => e.Value))
            {
                current += edge.Value;
                if (current > peak) peak = current;
            }
            return peak;
        }

        private static double Delta(PrometheusSamples before, PrometheusSamples after, string name, Func<PrometheusSample, bool>? filter)
        {
            return Math.Max(0, after.Sum(name, filter) - before.Sum(name, filter));
        }

        private static SortedDictionary<string, double> DeltaBy(PrometheusSamples before, PrometheusSamples after, string name, string label, Func<PrometheusSample, bool>? filter)
        {
            SortedDictionary<string, double> was = before.SumBy(name, label, filter);
            SortedDictionary<string, double> now = after.SumBy(name, label, filter);
            SortedDictionary<string, double> delta = new SortedDictionary<string, double>(StringComparer.Ordinal);
            foreach (KeyValuePair<string, double> item in now)
            {
                was.TryGetValue(item.Key, out double old);
                if (item.Value - old > 0) delta[item.Key] = item.Value - old;
            }
            return delta;
        }

        private static double MeanMs(PrometheusSamples before, PrometheusSamples after, string histogram, Func<PrometheusSample, bool>? filter)
        {
            double count = Delta(before, after, histogram + "_count", filter);
            if (count <= 0) return 0;
            return Delta(before, after, histogram + "_sum", filter) * 1000.0 / count;
        }

        private static double Ratio(double? now, double? was)
        {
            if (!now.HasValue || !was.HasValue || was.Value <= 0) return 0;
            return now.Value / was.Value;
        }

        private static void Add(List<SaturationSignal> signals, string subsystem, string evidence, double score, bool controlPlane = true)
        {
            SaturationSignal signal = new SaturationSignal();
            signal.Subsystem = subsystem;
            signal.Evidence = evidence;
            signal.Score = Math.Round(score, 2);
            signal.ControlPlane = controlPlane;
            signals.Add(signal);
        }

        private static string Pct(double value)
        {
            return (value * 100).ToString("0.##", CultureInfo.InvariantCulture) + "%";
        }

        private static string F0(double value)
        {
            return value.ToString("F0", CultureInfo.InvariantCulture);
        }

        private static string F1(double value)
        {
            return value.ToString("F1", CultureInfo.InvariantCulture);
        }

        private static string F2(double value)
        {
            return value.ToString("F2", CultureInfo.InvariantCulture);
        }

        #endregion
    }
}
