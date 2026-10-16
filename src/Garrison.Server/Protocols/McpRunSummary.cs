namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;

    /// <summary>
    /// Run status and result returned by MCP tools.
    /// </summary>
    public class McpRunSummary
    {
        /// <summary>Machine checkpoint marker when a resumable parent must yield until this child finishes.</summary>
        public string? ContinuationMarker { get; set; } = null;

        /// <summary>Template-rendered instruction asking the parent to finish its turn at this checkpoint.</summary>
        public string? ContinuationInstruction { get; set; } = null;

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Status.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Outcome code.
        /// </summary>
        public string Outcome { get; set; } = String.Empty;

        /// <summary>
        /// Why the queued run cannot be handed to any worker right now (NoReadyWorker, NoCapableWorker, NoMatchingPool,
        /// or NoIsolatingWorker for an Untrusted run no Ready worker can isolate), or null when it is not Queued or some
        /// Ready worker can run it. Computed on read.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? BlockedReason { get; set; } = null;

        /// <summary>
        /// Conversation the run is a turn of, or null (omitted). Pass it as conversationId to send the next turn.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Turn number within the conversation, or null (omitted) outside a conversation.
        /// </summary>
        public int? ConversationTurn { get; set; } = null;

        /// <summary>
        /// Whether the run is waiting for a person to decide a permission approval (P12.3).
        /// </summary>
        public bool AwaitingApproval { get; set; } = false;

        /// <summary>
        /// Whether the run finished.
        /// </summary>
        public bool Finished { get; set; } = false;

        /// <summary>
        /// Result text when finished.
        /// </summary>
        public string? Result { get; set; } = null;

        /// <summary>
        /// Structured output when the agent declares an output schema.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Whether the final output validated against the agent's output schema, or null (omitted) when it was not
        /// validated.
        /// </summary>
        public bool? OutputSchemaValid { get; set; } = null;

        /// <summary>
        /// Structured output repair attempts started (0 or 1).
        /// </summary>
        public int RepairAttempts { get; set; } = 0;

        /// <summary>
        /// Error message when failed.
        /// </summary>
        public string? Error { get; set; } = null;

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Cost in USD.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Cached input tokens.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Reasoning or thinking tokens, when the harness reports them; otherwise 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Tool call events in the run.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Model the harness reported serving the run (for example claude-sonnet-5-5); null until the run reports it or
        /// when the harness does not report one. Always present in the JSON.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? ServedModel { get; set; } = null;

        /// <summary>
        /// W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and compiled in, for
        /// finding its spans in Tempo; null for runs created before trace IDs were recorded. Always present in the JSON.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? TraceId { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to the first model output; null when not measured.
        /// </summary>
        public long? TimeToFirstTokenMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from the first to the last model output; null when not measured.
        /// </summary>
        public long? StreamingMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to exit; null when not measured.
        /// </summary>
        public long? ExecutionMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from queued to leased; null until leased.
        /// </summary>
        public long? QueueMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from queued to completed; null until finished.
        /// </summary>
        public long? TotalMs { get; set; } = null;

        /// <summary>
        /// Milliseconds the run spent waiting on child runs it delegated to; null until the run finishes.
        /// </summary>
        public long? DelegationWaitMs { get; set; } = null;

        /// <summary>
        /// Time to first token minus the delegation wait before it; null when not measured.
        /// </summary>
        public long? TimeToFirstTokenExcludingDelegationMs { get; set; } = null;

        /// <summary>
        /// Output tokens per second of streaming; null when streaming lasted under 100 milliseconds.
        /// </summary>
        public double? OutputTokensPerSecond { get; set; } = null;

        /// <summary>
        /// Created (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Completed (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;
    }
}
