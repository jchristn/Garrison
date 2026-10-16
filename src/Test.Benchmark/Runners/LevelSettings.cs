namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Reference;

    /// <summary>
    /// Settings of one load level.
    /// </summary>
    public class LevelSettings
    {
        /// <summary>Trace offsets for trace mode; null for closed and fixed-rate open modes.</summary>
        public List<double>? ArrivalOffsetsMs { get; set; } = null;

        /// <summary>
        /// Arm: garrison or direct.
        /// </summary>
        public string Arm { get; set; } = "garrison";

        /// <summary>
        /// closed or open.
        /// </summary>
        public string Mode { get; set; } = "closed";

        /// <summary>
        /// Closed loop workers.
        /// </summary>
        public int Concurrency { get; set; }

        /// <summary>
        /// Open loop arrivals per second.
        /// </summary>
        public double Rate { get; set; }

        /// <summary>
        /// Workspace tenant.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Agent invoked.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Input prefix; each operation appends its sequence number.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Run parameter overrides.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Fake harness delay between chunks (ms).
        /// </summary>
        public int DelayMs { get; set; }

        /// <summary>
        /// Server-side wait per invoke (s).
        /// </summary>
        public int WaitSeconds { get; set; } = 300;

        /// <summary>
        /// Open loop: most operations in flight before arrivals are counted as dropped.
        /// </summary>
        public int MaxInFlight { get; set; } = 2000;

        /// <summary>
        /// Direct invoker for the direct arm.
        /// </summary>
        public DirectInvoker? Direct { get; set; }
    }
}
