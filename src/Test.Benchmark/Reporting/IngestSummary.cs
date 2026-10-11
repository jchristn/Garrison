namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Load-path summary of an ingest run: manifest apply at scale.
    /// </summary>
    public class IngestSummary
    {
        /// <summary>
        /// Documents submitted.
        /// </summary>
        public int Documents { get; set; }

        /// <summary>
        /// Apply requests.
        /// </summary>
        public int Applies { get; set; }

        /// <summary>
        /// Documents per apply.
        /// </summary>
        public int BatchSize { get; set; }

        /// <summary>
        /// Documents created.
        /// </summary>
        public int Created { get; set; }

        /// <summary>
        /// Documents updated.
        /// </summary>
        public int Updated { get; set; }

        /// <summary>
        /// Documents unchanged.
        /// </summary>
        public int Unchanged { get; set; }

        /// <summary>
        /// Documents failed.
        /// </summary>
        public int Failed { get; set; }

        /// <summary>
        /// Apply requests that did not return a result (transport error or 5xx).
        /// </summary>
        public int RequestErrors { get; set; }

        /// <summary>
        /// Documents applied per second of apply time.
        /// </summary>
        public double DocumentsPerSecond { get; set; }

        /// <summary>
        /// Latency per apply request (ms).
        /// </summary>
        public LatencyStatistics? ApplyLatency { get; set; }

        /// <summary>
        /// Share of documents a second identical apply reported Unchanged (idempotence).
        /// </summary>
        public double ReapplyUnchangedRate { get; set; }

        /// <summary>
        /// Latency per re-apply request (ms).
        /// </summary>
        public LatencyStatistics? ReapplyLatency { get; set; }

        /// <summary>
        /// Latency of one dry run of the whole corpus (ms), 0 when skipped.
        /// </summary>
        public double DryRunMs { get; set; }

        /// <summary>
        /// Agents readable by name after the apply.
        /// </summary>
        public int Reachable { get; set; }

        /// <summary>
        /// Agent documents submitted.
        /// </summary>
        public int AgentDocuments { get; set; }

        /// <summary>
        /// Reachable divided by AgentDocuments.
        /// </summary>
        public double Reachability { get; set; }
    }
}
