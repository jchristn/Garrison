namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Behavior under one injected failure.
    /// </summary>
    public class ResilienceScenarioResult
    {
        /// <summary>
        /// Scenario name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What was injected.
        /// </summary>
        public string Description { get; set; } = String.Empty;

        /// <summary>
        /// Whether the scenario's criteria held.
        /// </summary>
        public bool Passed { get; set; }

        /// <summary>
        /// True when the scenario needs a capability this stack lacks.
        /// </summary>
        public bool Skipped { get; set; }

        /// <summary>
        /// Why it was skipped.
        /// </summary>
        public string? SkipReason { get; set; }

        /// <summary>
        /// Runs the scenario created.
        /// </summary>
        public int RunsSubmitted { get; set; }

        /// <summary>
        /// Runs that ended Succeeded.
        /// </summary>
        public int RunsSucceeded { get; set; }

        /// <summary>
        /// Runs that never reached a terminal status within the timeout.
        /// </summary>
        public int RunsLost { get; set; }

        /// <summary>
        /// Idempotency keys that produced more than one run.
        /// </summary>
        public int DuplicateRuns { get; set; }

        /// <summary>
        /// Terminal status and outcome counts.
        /// </summary>
        public SortedDictionary<string, int> Outcomes { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);

        /// <summary>
        /// Client-visible errors by HTTP status and code, or transport.
        /// </summary>
        public SortedDictionary<string, int> ClientErrors { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);

        /// <summary>
        /// Error responses without a JSON error body (HTML pages, empty bodies).
        /// </summary>
        public int UncleanErrors { get; set; }

        /// <summary>
        /// Seconds from the injection until the system served the scenario's operation again; -1 when it never did.
        /// </summary>
        public double RecoverySeconds { get; set; }

        /// <summary>
        /// Criteria and whether each held.
        /// </summary>
        public List<string> Criteria { get; set; } = new List<string>();
    }
}
