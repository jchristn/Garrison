namespace Garrison.Core.Models
{
    using System;

    /// <summary>UTC daily counters and current concurrency for a quota. Known cost excludes missing costs.</summary>
    public class UsageQuotaUsage
    {
        /// <summary>Quota ID.</summary>
        public string QuotaId { get; set; } = String.Empty;
        /// <summary>UTC midnight starting the accounting window.</summary>
        public DateTime WindowStartUtc { get; set; }
        /// <summary>Next UTC midnight; daily counters reset then.</summary>
        public DateTime WindowEndUtc { get; set; }
        /// <summary>Distinct runs admitted in the window, including delegated children and deleted runs.</summary>
        public long RunsUsed { get; set; }
        /// <summary>Completed input and output tokens in the window, plus separately reported Claude cache reads. Saturates at Int64.MaxValue.</summary>
        public long TokensUsed { get; set; }
        /// <summary>Known reported or estimated USD for completions in the window.</summary>
        public double CostUsd { get; set; }
        /// <summary>Completions with unknown cost. They do not block admission by themselves.</summary>
        public long UnknownCostRuns { get; set; }
        /// <summary>Currently Leased, Running, or Cancelling runs, regardless of accounting day.</summary>
        public long ActiveRuns { get; set; }
        /// <summary>False when at least one completion has unknown cost.</summary>
        public bool CostAccountingComplete { get { return UnknownCostRuns == 0; } }
    }
}
