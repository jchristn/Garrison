namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Worker report that a run finished.
    /// </summary>
    public class RunCompleteRequest
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Fencing epoch.
        /// </summary>
        public long Epoch { get; set; } = 0;

        /// <summary>
        /// Terminal status: Succeeded, Failed, Cancelled, or TimedOut.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Failed;

        /// <summary>
        /// Outcome code.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.HarnessFailed;

        /// <summary>
        /// Exit code.
        /// </summary>
        public int? ExitCode { get; set; } = null;

        /// <summary>
        /// Final result text.
        /// </summary>
        public string? ResultText { get; set; } = null;

        /// <summary>
        /// Structured output JSON.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Harness session identifier.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Model that served the run.
        /// </summary>
        public string? ServedModel { get; set; } = null;

        /// <summary>
        /// Scrubbed stderr tail.
        /// </summary>
        public string? StderrTail { get; set; } = null;

        /// <summary>
        /// Error message.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

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
        /// Cost in USD.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Whether the cost is estimated.
        /// </summary>
        public bool CostEstimated { get; set; } = false;

        /// <summary>
        /// Reasoning or thinking tokens, when the harness reports them; otherwise 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Time of the first model output event (assistant text or thinking), derived from the worker's monotonic
        /// clock anchored at process start. Null when the harness produced no model output.
        /// </summary>
        public DateTime? FirstTokenUtc { get; set; } = null;

        /// <summary>
        /// Time of the last model output event (assistant text or thinking). Null when the harness produced no
        /// model output.
        /// </summary>
        public DateTime? LastTokenUtc { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to the first model output, including harness startup. Null when
        /// not measurable.
        /// </summary>
        public long? TimeToFirstTokenMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from the first to the last model output. Null when not measurable.
        /// </summary>
        public long? StreamingMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to process exit. Null when the process did not start.
        /// </summary>
        public long? ExecutionMs { get; set; } = null;

        /// <summary>
        /// Number of tool call events in the run. Minimum 0.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Completion time (UTC).
        /// </summary>
        public DateTime CompletedUtc { get; set; } = DateTime.UtcNow;
    }
}
