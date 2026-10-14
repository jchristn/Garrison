namespace Garrison.Benchmark.Reporting
{
    using System;

    /// <summary>
    /// One piece of evidence that a subsystem saturated at a scale level, with a score for ranking. The attribution is a
    /// heuristic over the level's metrics compared with the first level of the sweep; read the evidence, not just the
    /// winner.
    /// </summary>
    public class SaturationSignal
    {
        /// <summary>
        /// Subsystem: worker capacity, database, event ingestion, deployment lock, scheduler, lease renewals, API
        /// admission, or load generator.
        /// </summary>
        public string Subsystem { get; set; } = String.Empty;

        /// <summary>
        /// What was observed.
        /// </summary>
        public string Evidence { get; set; } = String.Empty;

        /// <summary>
        /// Strength of the signal; higher ranks first. Roughly the factor by which the metric grew over the first level,
        /// or a fixed weight for hard failures.
        /// </summary>
        public double Score { get; set; }

        /// <summary>
        /// Whether the subsystem is part of the control plane (false for worker capacity and the load generator).
        /// </summary>
        public bool ControlPlane { get; set; } = true;
    }
}
