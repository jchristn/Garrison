namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// One level of a scale sweep: K runs submitted at an offered rate (open loop) or by C clients (closed loop),
    /// drained, then measured from the run records and the servers' metrics.
    /// </summary>
    public class ScaleLevelResult
    {
        /// <summary>
        /// Level index in the sweep, from 1.
        /// </summary>
        public int Index { get; set; }

        /// <summary>
        /// open or closed.
        /// </summary>
        public string Mode { get; set; } = String.Empty;

        /// <summary>
        /// Open loop: offered submissions per second.
        /// </summary>
        public double OfferedRate { get; set; }

        /// <summary>
        /// Closed loop: clients, each waiting for its run before submitting the next.
        /// </summary>
        public int Concurrency { get; set; }

        /// <summary>
        /// Worker slots Ready when the level started (sum of MaxConcurrentRuns).
        /// </summary>
        public int Slots { get; set; }

        /// <summary>
        /// Worker nodes Ready when the level started.
        /// </summary>
        public int Workers { get; set; }

        /// <summary>
        /// Runs the level tried to submit.
        /// </summary>
        public int Submitted { get; set; }

        /// <summary>
        /// Submissions the control plane accepted (a run was created).
        /// </summary>
        public int Accepted { get; set; }

        /// <summary>
        /// Submissions refused or failed, by kind (HTTP status and code, transport error, or client overload).
        /// </summary>
        public SortedDictionary<string, int> SubmitErrorsByKind { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);

        /// <summary>
        /// Accepted runs that succeeded.
        /// </summary>
        public int Succeeded { get; set; }

        /// <summary>
        /// Accepted runs that finished without success, by status and outcome.
        /// </summary>
        public SortedDictionary<string, int> RunFailuresByKind { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);

        /// <summary>
        /// Accepted runs not finished when the drain timeout passed.
        /// </summary>
        public int Unfinished { get; set; }

        /// <summary>
        /// Failed submissions, failed runs, and unfinished runs over everything submitted (0 to 1).
        /// </summary>
        public double ErrorRate { get; set; }

        /// <summary>
        /// Seconds spent submitting.
        /// </summary>
        public double SubmitSeconds { get; set; }

        /// <summary>
        /// Accepted submissions per second while submitting.
        /// </summary>
        public double AchievedSubmitRate { get; set; }

        /// <summary>
        /// Seconds from the first submission to the last run finishing (or the drain timeout).
        /// </summary>
        public double WallSeconds { get; set; }

        /// <summary>
        /// Successful runs per second over the level: the completions of successful runs divided by the time between the
        /// first and the last of them ((N - 1) intervals over that span). The sustained throughput of the level; a level
        /// that keeps up completes runs at the offered rate.
        /// </summary>
        public double RunsPerSecond { get; set; }

        /// <summary>
        /// Run events ingested per second over the level's wall time.
        /// </summary>
        public double EventsPerSecond { get; set; }

        /// <summary>
        /// Run events ingested per finished run.
        /// </summary>
        public double EventsPerRun { get; set; }

        /// <summary>
        /// Most runs leased or running at once, from the run records.
        /// </summary>
        public int PeakActive { get; set; }

        /// <summary>
        /// Most runs queued and not yet leased at once, from the run records.
        /// </summary>
        public int PeakQueued { get; set; }

        /// <summary>
        /// Submission request latency (ms): the create call, or the whole invoke in closed loop.
        /// </summary>
        public LatencyStatistics? SubmitLatency { get; set; }

        /// <summary>
        /// Claim latency (ms): queued to leased, from the run records.
        /// </summary>
        public LatencyStatistics? ClaimLatency { get; set; }

        /// <summary>
        /// End-to-end latency (ms): created to completed, from the run records of successful runs.
        /// </summary>
        public LatencyStatistics? EndToEndLatency { get; set; }

        /// <summary>
        /// Harness execution time (ms) of successful runs, for comparing with the configured run duration.
        /// </summary>
        public LatencyStatistics? Execution { get; set; }

        /// <summary>
        /// Control-plane overhead (ms): end-to-end minus execution, of successful runs.
        /// </summary>
        public LatencyStatistics? Overhead { get; set; }

        /// <summary>
        /// Subsystem counters from the servers' metrics.
        /// </summary>
        public ScaleSubsystems Subsystems { get; set; } = new ScaleSubsystems();

        /// <summary>
        /// macOS or Linux one-minute load average at the end of the level, or null when unavailable.
        /// </summary>
        public double? HostLoadAverage { get; set; }

        /// <summary>
        /// Whether the level crossed a breaking threshold.
        /// </summary>
        public bool Broken { get; set; }

        /// <summary>
        /// Thresholds the level crossed.
        /// </summary>
        public List<string> BreakReasons { get; set; } = new List<string>();

        /// <summary>
        /// Saturation evidence for the level, strongest first.
        /// </summary>
        public List<SaturationSignal> Signals { get; set; } = new List<SaturationSignal>();
    }
}
