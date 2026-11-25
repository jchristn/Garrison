namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Inline revision of a Mandate manifest document (AA1.12). Fields mirror <see cref="Garrison.Core.Models.MandateRevision"/>;
    /// null numbers take the revision defaults (Backoff, 900 to 86400 seconds, factor 2.0, the cluster jitter default).
    /// </summary>
    public class MandateRevisionSpec
    {
        /// <summary>
        /// What the keeper is responsible for. Required.
        /// </summary>
        public string? Objective { get; set; } = null;

        /// <summary>
        /// What healthy means.
        /// </summary>
        public string? HealthyDefinition { get; set; } = null;

        /// <summary>
        /// What the keeper may do on its own.
        /// </summary>
        public string? Autonomy { get; set; } = null;

        /// <summary>
        /// When and to whom to escalate.
        /// </summary>
        public string? EscalationPolicy { get; set; } = null;

        /// <summary>
        /// Standing direction.
        /// </summary>
        public string? Direction { get; set; } = null;

        /// <summary>
        /// Signals observed on each tick, in order.
        /// </summary>
        public List<MandateSignalSpec>? Signals { get; set; } = null;

        /// <summary>
        /// Fixed or Backoff; null means Backoff.
        /// </summary>
        public WakeModeEnum? WakeMode { get; set; } = null;

        /// <summary>
        /// Shortest interval in seconds; null means 900.
        /// </summary>
        public int? MinIntervalSeconds { get; set; } = null;

        /// <summary>
        /// Longest interval in seconds; null means 86400.
        /// </summary>
        public int? MaxIntervalSeconds { get; set; } = null;

        /// <summary>
        /// Backoff factor; null means 2.0.
        /// </summary>
        public double? BackoffFactor { get; set; } = null;

        /// <summary>
        /// Jitter percent; null uses Autonomy.DefaultJitterPercent.
        /// </summary>
        public int? JitterPercent { get; set; } = null;

        /// <summary>
        /// Per-tick budget in US dollars, or null.
        /// </summary>
        public double? BudgetPerTickUsd { get; set; } = null;

        /// <summary>
        /// Per-day budget in US dollars, or null.
        /// </summary>
        public double? BudgetPerDayUsd { get; set; } = null;

        /// <summary>
        /// Per-tick token limit, or null.
        /// </summary>
        public long? MaxTokensPerTick { get; set; } = null;

        /// <summary>
        /// Why this revision was made.
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
