namespace Garrison.Sdk.Models
{
    /// <summary>
    /// Token, tool, cost, and duration totals of a transcript or one of its turns.
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
        /// Tool calls made.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Cost in US dollars, or null when unknown.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Whether the cost was estimated from model prices.
        /// </summary>
        public bool CostEstimated { get; set; } = false;

        /// <summary>
        /// Total duration in milliseconds, or null when unknown.
        /// </summary>
        public long? DurationMs { get; set; } = null;

        #endregion
    }
}
