namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The fields of a Garrison run the harness reads (REST_API.md, Run). Unknown fields are ignored.
    /// </summary>
    public class Run
    {
        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string? TenantId { get; set; }

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string? AgentId { get; set; }

        /// <summary>
        /// Agent name at creation.
        /// </summary>
        public string? AgentName { get; set; }

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string? DeploymentId { get; set; }

        /// <summary>
        /// Status, for example Queued or Succeeded.
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Outcome code.
        /// </summary>
        public string? Outcome { get; set; }

        /// <summary>
        /// Priority.
        /// </summary>
        public int Priority { get; set; }

        /// <summary>
        /// Attempt number.
        /// </summary>
        public int Attempt { get; set; }

        /// <summary>
        /// Idempotency key.
        /// </summary>
        public string? IdempotencyKey { get; set; }

        /// <summary>
        /// Node holding (or that last held) the lease.
        /// </summary>
        public string? LeaseNodeId { get; set; }

        /// <summary>
        /// Node name holding (or that last held) the lease.
        /// </summary>
        public string? LeaseNodeName { get; set; }

        /// <summary>
        /// Queued (UTC).
        /// </summary>
        public DateTime? QueuedUtc { get; set; }

        /// <summary>
        /// Leased (UTC).
        /// </summary>
        public DateTime? LeasedUtc { get; set; }

        /// <summary>
        /// Started (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; }

        /// <summary>
        /// Completed (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; }

        /// <summary>
        /// Created (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; }

        /// <summary>
        /// Whether cancellation was requested.
        /// </summary>
        public bool CancelRequested { get; set; }

        /// <summary>
        /// Final result text.
        /// </summary>
        public string? ResultText { get; set; }

        /// <summary>
        /// Whether the output validated against the agent's output schema.
        /// </summary>
        public bool? OutputSchemaValid { get; set; }

        /// <summary>
        /// Structured output repairs started.
        /// </summary>
        public int RepairAttempts { get; set; }

        /// <summary>
        /// Harness exit code.
        /// </summary>
        public int? ExitCode { get; set; }

        /// <summary>
        /// Error message.
        /// </summary>
        public string? ErrorMessage { get; set; }

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; }

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; }

        /// <summary>
        /// Highest event sequence received.
        /// </summary>
        public long LastEventSequence { get; set; }

        /// <summary>
        /// Why a queued run cannot be handed to any worker, or null.
        /// </summary>
        public string? BlockedReason { get; set; }

        /// <summary>
        /// Harness start to first model output, measured by the worker.
        /// </summary>
        public long? TimeToFirstTokenMs { get; set; }

        /// <summary>
        /// First to last model output, measured by the worker.
        /// </summary>
        public long? StreamingMs { get; set; }

        /// <summary>
        /// Harness start to exit, measured by the worker.
        /// </summary>
        public long? ExecutionMs { get; set; }

        /// <summary>
        /// Queued to leased, from server timestamps.
        /// </summary>
        public long? QueueMs { get; set; }

        /// <summary>
        /// Queued to completion received, from server timestamps.
        /// </summary>
        public long? TotalMs { get; set; }
    }
}
