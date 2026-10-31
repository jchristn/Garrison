namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// How one app turn ran: the model, timings, tokens, tool calls, and cost. The app gateway includes it only for apps
    /// that show operator detail. Values are null (or 0) until the run reports them. Not thread-safe.
    /// </summary>
    public class AppTurnTelemetry
    {
        /// <summary>
        /// Model the harness reported serving the turn, or null.
        /// </summary>
        public string? ServedModel { get; set; } = null;

        /// <summary>
        /// Milliseconds from the start of execution to the first model output, or null.
        /// </summary>
        public long? TimeToFirstTokenMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from the first to the last model output, or null.
        /// </summary>
        public long? StreamingMs { get; set; } = null;

        /// <summary>
        /// Milliseconds the harness ran, or null.
        /// </summary>
        public long? ExecutionMs { get; set; } = null;

        /// <summary>
        /// Milliseconds the turn waited for a worker, or null.
        /// </summary>
        public long? QueueMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from the message to the answer, or null.
        /// </summary>
        public long? TotalMs { get; set; } = null;

        /// <summary>
        /// Milliseconds spent waiting for other agents this turn asked, or null.
        /// </summary>
        public long? DelegationWaitMs { get; set; } = null;

        /// <summary>
        /// Milliseconds spent waiting for a person to approve a step, or null.
        /// </summary>
        public long? ApprovalWaitMs { get; set; } = null;

        /// <summary>
        /// Input tokens. Default 0.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens. Default 0.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Input tokens served from the model's cache. Default 0.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Reasoning (thinking) tokens. Default 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens per second while streaming, or null.
        /// </summary>
        public double? OutputTokensPerSecond { get; set; } = null;

        /// <summary>
        /// Tool calls the turn made. Default 0.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Cost in US dollars, or null when the model has no price.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Instantiate.
        /// </summary>
        public AppTurnTelemetry()
        {
        }
    }
}
