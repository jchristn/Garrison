namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Throughput and latency of one arm at one concurrency (closed loop) or arrival rate (open loop).
    /// </summary>
    public class LoadLevelResult
    {
        /// <summary>Number of successful runs with observed completed SQL attribution scopes.</summary>
        public int ExactDbUsageRuns { get; set; }
        /// <summary>Successful runs whose attribution could not be read or lacked completion scope.</summary>
        public int ExactDbUsageMissingRuns { get; set; }
        /// <summary>Exact scoped statement attempts divided by observed attributed successful runs; excludes shared work and telemetry persistence.</summary>
        public double? ExactScopedDbStatementsPerRun { get; set; }
        /// <summary>Exact scoped read attempts divided by observed attributed successful runs.</summary>
        public double? ExactScopedDbReadsPerRun { get; set; }
        /// <summary>Exact scoped write attempts divided by observed attributed successful runs.</summary>
        public double? ExactScopedDbWritesPerRun { get; set; }

        /// <summary>Server-wide database statement delta divided by successful runs. Includes background and failed-run work, so this is an estimate, not per-run attribution.</summary>
        public double? EstimatedDbStatementsPerSucceededRun { get; set; }
        /// <summary>Server-wide request-history header insert delta divided by successful runs.</summary>
        public double? EstimatedRequestHistoryHeaderInsertsPerSucceededRun { get; set; }

        /// <summary>
        /// Arm.
        /// </summary>
        public string Arm { get; set; } = String.Empty;

        /// <summary>
        /// closed or open.
        /// </summary>
        public string Mode { get; set; } = String.Empty;

        /// <summary>
        /// Closed loop: workers each waiting for their run before starting the next.
        /// </summary>
        public int Concurrency { get; set; }

        /// <summary>
        /// Open loop: scheduled arrivals per second.
        /// </summary>
        public double TargetRate { get; set; }

        /// <summary>
        /// Worker nodes Ready during the level (scale-out sweeps).
        /// </summary>
        public int Workers { get; set; }

        /// <summary>
        /// Total worker slots during the level.
        /// </summary>
        public int Slots { get; set; }

        /// <summary>
        /// Measured window, from the end of warmup to the last drained operation.
        /// </summary>
        public double MeasuredSeconds { get; set; }

        /// <summary>
        /// Operations started in the measured window.
        /// </summary>
        public int Started { get; set; }

        /// <summary>
        /// Operations that succeeded.
        /// </summary>
        public int Succeeded { get; set; }

        /// <summary>
        /// Operations that failed.
        /// </summary>
        public int Failed { get; set; }

        /// <summary>
        /// Failures by kind (HTTP status and code, run outcome, or transport).
        /// </summary>
        public SortedDictionary<string, int> FailuresByKind { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);

        /// <summary>
        /// Successful operations per second over the measured window.
        /// </summary>
        public double Throughput { get; set; }

        /// <summary>
        /// Interval of the mean successful operations per second, from per-second completion counts.
        /// </summary>
        public ConfidenceInterval? ThroughputCi { get; set; }

        /// <summary>
        /// Successful completions in each second of the measured window.
        /// </summary>
        public List<double> PerSecond { get; set; } = new List<double>();

        /// <summary>
        /// Client latency of successful operations (ms); open loop measures from the scheduled send time.
        /// </summary>
        public LatencyStatistics? Latency { get; set; }

        /// <summary>
        /// Server and worker timing distributions (queueMs, executionMs, totalMs, overheadMs).
        /// </summary>
        public SortedDictionary<string, LatencyStatistics> Timings { get; set; } = new SortedDictionary<string, LatencyStatistics>(StringComparer.Ordinal);

        /// <summary>
        /// Server-side stage breakdown for the level, from /metrics.
        /// </summary>
        public List<StageDelta> Stages { get; set; } = new List<StageDelta>();
    }
}
