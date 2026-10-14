namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Settings of a scale sweep, read once from the command line by <see cref="ScaleRunner"/>. Not thread-safe; treat
    /// as read-only once the sweep starts.
    /// </summary>
    public class ScaleSettings
    {
        /// <summary>
        /// open (submit at a rate, no waiting) or closed (clients that each invoke and wait). Default open.
        /// </summary>
        public string Mode { get; set; } = "open";

        /// <summary>
        /// Open loop: offered submissions per second, one level each, in order.
        /// </summary>
        public List<double> Rates { get; set; } = new List<double>();

        /// <summary>
        /// Closed loop: clients per level, in order.
        /// </summary>
        public List<int> Concurrency { get; set; } = new List<int>();

        /// <summary>
        /// Runs per level. Minimum 1, maximum 1,000,000, default 1000.
        /// </summary>
        public int RunsPerLevel { get; set; } = 1000;

        /// <summary>
        /// Agent invoked. Default scale-echo.
        /// </summary>
        public string Agent { get; set; } = "scale-echo";

        /// <summary>
        /// Fake harness paced events per second of each run (run override eventsPerSecond). Default 10.
        /// </summary>
        public int EventsPerSecond { get; set; } = 10;

        /// <summary>
        /// Fake harness stream duration of each run in ms (run override durationMs). Default 2000.
        /// </summary>
        public int DurationMs { get; set; } = 2000;

        /// <summary>
        /// Open loop: most submissions in flight before an arrival is counted as dropped by the client. Default 512.
        /// </summary>
        public int SubmitConcurrency { get; set; } = 512;

        /// <summary>
        /// Closed loop: server-side wait per invoke in seconds. Default 300.
        /// </summary>
        public int WaitSeconds { get; set; } = 300;

        /// <summary>
        /// Longest wait for a level's runs to finish after the last submission, in seconds. Default 300.
        /// </summary>
        public int DrainSeconds { get; set; } = 300;

        /// <summary>
        /// Pause between levels so leases, gauges, and connections settle, in seconds. Default 5.
        /// </summary>
        public int SettleSeconds { get; set; } = 5;

        /// <summary>
        /// A level breaks when failed submissions, failed runs, and unfinished runs exceed this share (0 to 1). Default 0.01.
        /// </summary>
        public double MaxErrorRate { get; set; } = 0.01;

        /// <summary>
        /// A level breaks when claim latency p95 exceeds this (ms). Default 5000.
        /// </summary>
        public double MaxClaimP95Ms { get; set; } = 5000;

        /// <summary>
        /// A level breaks when end-to-end latency p95 exceeds this (ms); 0 derives it as the run duration plus 10 s.
        /// Default 0.
        /// </summary>
        public double MaxEndToEndP95Ms { get; set; } = 0;

        /// <summary>
        /// Open loop: a level breaks (plateau) when its successful runs per second fall below this share of the offered
        /// rate. Closed loop: when throughput grows by less than (1 - this) over the previous level. Default 0.9.
        /// </summary>
        public double PlateauRatio { get; set; } = 0.9;

        /// <summary>
        /// Stop the sweep at the first level that breaks. Default true.
        /// </summary>
        public bool StopOnBreak { get; set; } = true;

        /// <summary>
        /// Tier label for the report, for example 3x10-1k.
        /// </summary>
        public string Tier { get; set; } = String.Empty;

        /// <summary>
        /// Effective end-to-end p95 threshold (ms).
        /// </summary>
        public double EndToEndThresholdMs
        {
            get
            {
                return MaxEndToEndP95Ms > 0 ? MaxEndToEndP95Ms : DurationMs + 10000.0;
            }
        }
    }
}
