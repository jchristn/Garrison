namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Outcome of a scale sweep (P14.15): the stack it ran on, the workload, every level, the highest load the control
    /// plane sustained, and where and why it broke.
    /// </summary>
    public class ScaleSummary
    {
        /// <summary>
        /// Tier label, for example 3x10-1k.
        /// </summary>
        public string Tier { get; set; } = String.Empty;

        /// <summary>
        /// Server replicas the load was spread across.
        /// </summary>
        public int Servers { get; set; }

        /// <summary>
        /// Server base URLs, in round-robin order.
        /// </summary>
        public List<string> ServerUrls { get; set; } = new List<string>();

        /// <summary>
        /// Worker nodes Ready at the start.
        /// </summary>
        public int Workers { get; set; }

        /// <summary>
        /// Worker slots Ready at the start.
        /// </summary>
        public int Slots { get; set; }

        /// <summary>
        /// Runs per level.
        /// </summary>
        public int RunsPerLevel { get; set; }

        /// <summary>
        /// Fake harness events per second of each run.
        /// </summary>
        public int RunEventsPerSecond { get; set; }

        /// <summary>
        /// Fake harness stream duration of each run (ms).
        /// </summary>
        public int RunDurationMs { get; set; }

        /// <summary>
        /// Slot capacity in runs per second: slots divided by the run duration. Offered load near or above it is bound by
        /// workers, not the control plane.
        /// </summary>
        public double SlotCapacityRunsPerSecond { get; set; }

        /// <summary>
        /// Breaking thresholds used.
        /// </summary>
        public SortedDictionary<string, string> Thresholds { get; set; } = new SortedDictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Every level, in order.
        /// </summary>
        public List<ScaleLevelResult> Levels { get; set; } = new List<ScaleLevelResult>();

        /// <summary>
        /// Highest successful runs per second of a level that did not break, or 0 when the first level broke.
        /// </summary>
        public double MaxSustainedRunsPerSecond { get; set; }

        /// <summary>
        /// Events per second ingested at that level.
        /// </summary>
        public double MaxSustainedEventsPerSecond { get; set; }

        /// <summary>
        /// Index of the level with the highest sustained throughput, or 0.
        /// </summary>
        public int MaxSustainedLevel { get; set; }

        /// <summary>
        /// Index of the first level that broke, or 0 when none did.
        /// </summary>
        public int BreakingLevel { get; set; }

        /// <summary>
        /// Offered load of the breaking level, as text (for example 200/s or c400), or null.
        /// </summary>
        public string? BreakingLoad { get; set; }

        /// <summary>
        /// Thresholds the breaking level crossed.
        /// </summary>
        public List<string> BreakReasons { get; set; } = new List<string>();

        /// <summary>
        /// The subsystem with the strongest saturation signal at the breaking level, or null.
        /// </summary>
        public string? SaturatedSubsystem { get; set; }

        /// <summary>
        /// Whether the saturated subsystem is part of the control plane. False means the sweep hit worker capacity or the
        /// load generator first, so the control plane's ceiling is above the measured numbers.
        /// </summary>
        public bool? SaturatedInControlPlane { get; set; }
    }
}
