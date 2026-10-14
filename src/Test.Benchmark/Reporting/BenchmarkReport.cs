namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// One run of one command: configuration, provenance, per-arm summaries, and every per-probe outcome, so two reports can be compared probe by probe and re-analyzed offline.
    /// </summary>
    public class BenchmarkReport
    {
        /// <summary>
        /// Report schema version. Currently 1.
        /// </summary>
        public int SchemaVersion { get; set; } = 1;

        /// <summary>
        /// Report kind: ingest, routing, e2e, load, resilience, or scale.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Dataset name (or a workload name for load and resilience).
        /// </summary>
        public string Dataset { get; set; } = String.Empty;

        /// <summary>
        /// Run label from --label.
        /// </summary>
        public string? Label { get; set; }

        /// <summary>
        /// True when every scored value is deterministic (no wall-clock latency in the score), which is what ci-gate compares; compare then treats any probe that flips from pass to fail as a regression.
        /// </summary>
        public bool Deterministic { get; set; }

        /// <summary>
        /// True when some input failed to load or a run was lost, so the results are not comparable (exit code 3).
        /// </summary>
        public bool Incomplete { get; set; }

        /// <summary>
        /// Why the run is incomplete.
        /// </summary>
        public string? IncompleteReason { get; set; }

        /// <summary>
        /// What produced the report.
        /// </summary>
        public ReportProvenance Provenance { get; set; } = new ReportProvenance();

        /// <summary>
        /// Every option the run used, including defaults. Credentials are never recorded.
        /// </summary>
        public SortedDictionary<string, string> Options { get; set; } = new SortedDictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Per-arm summaries.
        /// </summary>
        public List<ArmSummary> Arms { get; set; } = new List<ArmSummary>();

        /// <summary>
        /// Every per-probe outcome.
        /// </summary>
        public List<ProbeOutcome> Outcomes { get; set; } = new List<ProbeOutcome>();

        /// <summary>
        /// Load results per arm and level (load reports).
        /// </summary>
        public List<LoadLevelResult> LoadLevels { get; set; } = new List<LoadLevelResult>();

        /// <summary>
        /// Load-path summary (ingest reports).
        /// </summary>
        public IngestSummary? Ingest { get; set; }

        /// <summary>
        /// Resilience scenarios (resilience reports).
        /// </summary>
        public List<ResilienceScenarioResult> Scenarios { get; set; } = new List<ResilienceScenarioResult>();

        /// <summary>
        /// Scale sweep (scale reports).
        /// </summary>
        public ScaleSummary? Scale { get; set; }

        /// <summary>
        /// Server-side stage breakdown over the whole measured phase, from /metrics.
        /// </summary>
        public List<StageDelta> Stages { get; set; } = new List<StageDelta>();

        /// <summary>
        /// Published or prior baselines from benchmarks/baselines.json with the net difference.
        /// </summary>
        public List<BaselineComparison> Baselines { get; set; } = new List<BaselineComparison>();

        /// <summary>
        /// Notes for the reader (contention, indicative numbers, skipped parts).
        /// </summary>
        public List<string> Notes { get; set; } = new List<string>();
    }
}
