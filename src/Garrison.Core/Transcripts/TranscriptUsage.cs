namespace Garrison.Core.Transcripts
{
    /// <summary>
    /// Token usage, cost, and duration of a transcript turn or of a whole transcript (P12.27).
    /// </summary>
    public class TranscriptUsage
    {
        #region Public-Members

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Cached input tokens.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Reasoning tokens.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Tool calls.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Cost in US dollars, or null when no turn reported or estimated one.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Whether any part of the cost is an estimate from the model price table.
        /// </summary>
        public bool CostEstimated { get; set; } = false;

        /// <summary>
        /// Total duration in milliseconds (queue plus execution), or null when unknown.
        /// </summary>
        public long? DurationMs { get; set; } = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add another usage to this one.
        /// </summary>
        /// <param name="other">Usage to add; null is ignored.</param>
        public void Add(TranscriptUsage? other)
        {
            if (other == null) return;
            InputTokens += other.InputTokens;
            OutputTokens += other.OutputTokens;
            CachedTokens += other.CachedTokens;
            ReasoningTokens += other.ReasoningTokens;
            ToolCallCount += other.ToolCallCount;
            if (other.CostUsd.HasValue) CostUsd = (CostUsd ?? 0) + other.CostUsd.Value;
            CostEstimated = CostEstimated || other.CostEstimated;
            if (other.DurationMs.HasValue) DurationMs = (DurationMs ?? 0) + other.DurationMs.Value;
        }

        #endregion
    }
}
