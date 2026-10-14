namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Renders the scale section of a Markdown report: the verdict, one row per level, subsystem counters per level,
    /// and saturation evidence. Stateless and thread-safe.
    /// </summary>
    public static class ScaleMarkdown
    {
        #region Public-Methods

        /// <summary>
        /// Append the scale section; nothing when the report has no scale summary.
        /// </summary>
        /// <param name="md">Builder.</param>
        /// <param name="scale">Scale summary, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when md is null.</exception>
        public static void Append(StringBuilder md, ScaleSummary? scale)
        {
            if (md == null) throw new ArgumentNullException(nameof(md));
            if (scale == null) return;
            md.Append("## Scale: ").Append(String.IsNullOrEmpty(scale.Tier) ? "sweep" : scale.Tier).Append("\n\n| Field | Value |\n|---|---|\n");
            Row(md, "Stack", scale.Servers + " servers (" + String.Join(", ", scale.ServerUrls) + "), " + scale.Workers + " workers, " + scale.Slots + " slots");
            Row(md, "Workload", scale.RunsPerLevel + " runs per level; each run streams " + scale.RunEventsPerSecond + " events/s for " + scale.RunDurationMs + " ms");
            Row(md, "Slot capacity", F1(scale.SlotCapacityRunsPerSecond) + " runs/s (slots divided by run duration)");
            Row(md, "Thresholds", String.Join(", ", scale.Thresholds.Select(t => t.Key + " " + t.Value)));
            Row(md, "Max sustained", scale.MaxSustainedLevel > 0 ? F1(scale.MaxSustainedRunsPerSecond) + " runs/s, " + F0(scale.MaxSustainedEventsPerSecond) + " events/s (level " + scale.MaxSustainedLevel + ")" : "no level held");
            Row(md, "Breaking point", scale.BreakingLevel > 0 ? "level " + scale.BreakingLevel + " (" + scale.BreakingLoad + "): " + String.Join("; ", scale.BreakReasons) : "no level broke");
            Row(md, "Saturated", scale.SaturatedSubsystem == null ? "n/a" : scale.SaturatedSubsystem + (scale.SaturatedInControlPlane == false ? " (outside the control plane)" : String.Empty));
            md.Append('\n');

            md.Append("### Levels\n\n| # | Load | Submitted | Accepted | Succeeded | Errors | Runs/s | Events/s | Claim p50/p95/p99 (ms) | E2E p50/p95/p99 (ms) | Overhead p50/p95 (ms) | Submit p95 (ms) | Peak active / queued | Load avg | Verdict |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n");
            foreach (ScaleLevelResult level in scale.Levels)
            {
                md.Append("| ").Append(level.Index).Append(" | ").Append(LoadText(level))
                    .Append(" | ").Append(level.Submitted).Append(" | ").Append(level.Accepted).Append(" | ").Append(level.Succeeded)
                    .Append(" | ").Append((level.ErrorRate * 100).ToString("0.##", CultureInfo.InvariantCulture)).Append('%')
                    .Append(" | ").Append(F1(level.RunsPerSecond)).Append(" | ").Append(F0(level.EventsPerSecond))
                    .Append(" | ").Append(Triple(level.ClaimLatency)).Append(" | ").Append(Triple(level.EndToEndLatency))
                    .Append(" | ").Append(level.Overhead == null ? "n/a" : F0(level.Overhead.P50) + " / " + F0(level.Overhead.P95))
                    .Append(" | ").Append(level.SubmitLatency == null ? "n/a" : F0(level.SubmitLatency.P95))
                    .Append(" | ").Append(level.PeakActive).Append(" / ").Append(level.PeakQueued)
                    .Append(" | ").Append(level.HostLoadAverage.HasValue ? F1(level.HostLoadAverage.Value) : "n/a")
                    .Append(" | ").Append(level.Broken ? "broke: " + ReportWriter.Cell(String.Join("; ", level.BreakReasons)) : "held").Append(" |\n");
            }
            md.Append('\n');

            md.Append("### Subsystems per level\n\nSummed over every server replica's /metrics for the level. Per-run values divide by the runs that finished.\n\n");
            md.Append("| # | Events in | Batches | Event inserts (mean ms) | Wakeups notify / handoff / pending / poll | Wakeups per run | Lease req assigned / empty | Renewals (lost) | Expirations | Lock waits (mean ms, total ms) | Claims | Lost claims per run | DB ops/run | Auth statements per run | Auth cache hit / miss | DB mean ms | request_history_headers inserts/run | DB errors | Peak DB conns | HTTP 429+503 |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n");
            foreach (ScaleLevelResult level in scale.Levels)
            {
                ScaleSubsystems s = level.Subsystems;
                md.Append("| ").Append(level.Index)
                    .Append(" | ").Append(F0(s.EventsReceived)).Append(" | ").Append(F0(s.EventBatches))
                    .Append(" | ").Append(F0(s.EventInsertStatements)).Append(" (").Append(F2(s.EventInsertMeanMs)).Append(')')
                    .Append(" | ").Append(F0(s.WakeupsNotify)).Append(" / ").Append(F0(s.WakeupsHandoff)).Append(" / ").Append(F0(s.WakeupsPending)).Append(" / ").Append(F0(s.WakeupsPoll))
                    .Append(" | ").Append(F1(s.WakeupsPerRun))
                    .Append(" | ").Append(F0(s.LeaseRequestsAssigned)).Append(" / ").Append(F0(s.LeaseRequestsEmpty))
                    .Append(" | ").Append(F0(s.LeaseRenewals)).Append(" (").Append(F0(s.LeaseRenewalsLost)).Append(')')
                    .Append(" | ").Append(F0(s.LeaseExpirations))
                    .Append(" | ").Append(F0(s.DeploymentLockAcquisitions)).Append(" (").Append(F2(s.DeploymentLockMeanWaitMs)).Append(", ").Append(F0(s.DeploymentLockTotalWaitMs)).Append(')')
                    .Append(" | ").Append(ReportWriter.Cell(String.Join(", ", s.Claims.Select(c => c.Key + " " + F0(c.Value)))))
                    .Append(" | ").Append(F1(s.LostClaimsPerRun))
                    .Append(" | ").Append(F1(s.DbStatementsPerRun)).Append(" | ").Append(F1(s.AuthStatementsPerRun))
                    .Append(" | ").Append(F0(s.AuthCacheHits)).Append(" / ").Append(F0(s.AuthCacheMisses))
                    .Append(" | ").Append(F2(s.DbMeanMs))
                    .Append(" | ").Append(F2(s.RequestHistoryHeaderInsertsPerRun))
                    .Append(" | ").Append(F0(s.DbErrors)).Append(" | ").Append(F0(s.PeakDbConnections)).Append(" | ").Append(F0(s.Http429And503)).Append(" |\n");
            }
            md.Append('\n');

            ScaleLevelResult? last = scale.Levels.LastOrDefault();
            if (last != null && last.Subsystems.DbStatementsPerRunByTable.Count > 0)
            {
                md.Append("### Database statements per run by table, level ").Append(last.Index).Append("\n\n| Table | Statements per run |\n|---|---|\n");
                foreach (KeyValuePair<string, double> table in last.Subsystems.DbStatementsPerRunByTable.OrderByDescending(t => t.Value))
                    md.Append("| ").Append(ReportWriter.Cell(table.Key)).Append(" | ").Append(F2(table.Value)).Append(" |\n");
                md.Append('\n');
            }

            List<ScaleLevelResult> failing = scale.Levels.Where(l => l.SubmitErrorsByKind.Count > 0 || l.RunFailuresByKind.Count > 0 || l.Unfinished > 0).ToList();
            if (failing.Count > 0)
            {
                md.Append("### Failures\n\n| # | Kind | Count |\n|---|---|---|\n");
                foreach (ScaleLevelResult level in failing)
                {
                    foreach (KeyValuePair<string, int> kind in level.SubmitErrorsByKind) md.Append("| ").Append(level.Index).Append(" | submit: ").Append(ReportWriter.Cell(kind.Key)).Append(" | ").Append(kind.Value).Append(" |\n");
                    foreach (KeyValuePair<string, int> kind in level.RunFailuresByKind) md.Append("| ").Append(level.Index).Append(" | run: ").Append(ReportWriter.Cell(kind.Key)).Append(" | ").Append(kind.Value).Append(" |\n");
                    if (level.Unfinished > 0) md.Append("| ").Append(level.Index).Append(" | unfinished at the drain timeout | ").Append(level.Unfinished).Append(" |\n");
                }
                md.Append('\n');
            }

            List<ScaleLevelResult> signalled = scale.Levels.Where(l => l.Signals.Count > 0).ToList();
            if (signalled.Count > 0)
            {
                md.Append("### Saturation evidence\n\n| # | Subsystem | Control plane | Score | Evidence |\n|---|---|---|---|---|\n");
                foreach (ScaleLevelResult level in signalled)
                    foreach (SaturationSignal signal in level.Signals)
                        md.Append("| ").Append(level.Index).Append(" | ").Append(signal.Subsystem).Append(" | ").Append(signal.ControlPlane ? "yes" : "no").Append(" | ").Append(F1(signal.Score)).Append(" | ").Append(ReportWriter.Cell(signal.Evidence)).Append(" |\n");
                md.Append('\n');
            }
        }

        #endregion

        #region Private-Methods

        private static string LoadText(ScaleLevelResult level)
        {
            return level.Mode == "open" ? level.OfferedRate.ToString("0.##", CultureInfo.InvariantCulture) + "/s" : "c" + level.Concurrency.ToString(CultureInfo.InvariantCulture);
        }

        private static string Triple(LatencyStatistics? stats)
        {
            if (stats == null) return "n/a";
            return F0(stats.P50) + " / " + F0(stats.P95) + " / " + F0(stats.P99);
        }

        private static void Row(StringBuilder md, string name, string value)
        {
            md.Append("| ").Append(name).Append(" | ").Append(ReportWriter.Cell(value)).Append(" |\n");
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
