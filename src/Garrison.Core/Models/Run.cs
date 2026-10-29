namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One invocation of one deployment.
    /// </summary>
    public class Run
    {
        #region Public-Members
        /// <summary>Transient, template-rendered continuation prompt supplied only while recompiling a checkpoint.</summary>
        [JsonIgnore]
        public string? ContinuationPrompt { get; set; } = null;


        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewRunId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent revision the run compiled from (AD1.3): the deployment's pinned revision, or the agent's latest published
        /// revision when the deployment is unpinned. Null for runs created before revisions existed.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Conversation file space the run reads and writes (AD3): its conversation's, its pipeline run's, or its root
        /// run's. Null for remote runs.
        /// </summary>
        public string? FileSpaceId { get; set; } = null;

        /// <summary>
        /// Agent name at creation.
        /// </summary>
        public string AgentName
        {
            get
            {
                return _AgentName;
            }
            set
            {
                _AgentName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment configuration version used.
        /// </summary>
        public int DeploymentVersion { get; set; } = 0;

        /// <summary>
        /// Harness type required.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Required node pool.
        /// </summary>
        public string? NodePoolId { get; set; } = null;

        /// <summary>
        /// Executor the run needs, resolved when the run is created (the deployment's executor, else its node pool's
        /// default, else Process). Only workers reporting this executor claim the run.
        /// </summary>
        public RunExecutorEnum Executor { get; set; } = RunExecutorEnum.Process;

        /// <summary>
        /// Run kind.
        /// </summary>
        public RunKindEnum Kind { get; set; } = RunKindEnum.Invoke;

        /// <summary>
        /// Status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Pending;

        /// <summary>
        /// Outcome code.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.None;

        /// <summary>
        /// Priority; higher runs first. Minimum -100, maximum 100, default 0.
        /// </summary>
        public int Priority
        {
            get
            {
                return _Priority;
            }
            set
            {
                _Priority = Math.Clamp(value, -100, 100);
            }
        }

        /// <summary>
        /// Input message.
        /// </summary>
        public string? InputText { get; set; } = null;

        /// <summary>
        /// Input content type.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Caller principal type.
        /// </summary>
        public PrincipalTypeEnum CallerType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Caller principal identifier.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Caller display name.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Parent run when delegated.
        /// </summary>
        public string? ParentRunId { get; set; } = null;

        /// <summary>
        /// Root run of the delegation chain.
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Delegation depth; 0 for top-level runs.
        /// </summary>
        public int Depth { get; set; } = 0;

        /// <summary>
        /// Comma-separated agent names from the root to this run.
        /// </summary>
        public string? CallChain { get; set; } = null;

        /// <summary>
        /// Caller-supplied idempotency key.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>
        /// Run this run retries.
        /// </summary>
        public string? RetryOfRunId { get; set; } = null;

        /// <summary>
        /// Attempt number.
        /// </summary>
        public int Attempt { get; set; } = 1;

        /// <summary>
        /// Maximum attempts.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Node holding the lease.
        /// </summary>
        public string? LeaseNodeId { get; set; } = null;

        /// <summary>
        /// Node name holding the lease.
        /// </summary>
        public string? LeaseNodeName { get; set; } = null;

        /// <summary>
        /// Fencing epoch, incremented on every claim.
        /// </summary>
        public long LeaseEpoch { get; set; } = 0;

        /// <summary>
        /// Lease expiry (UTC).
        /// </summary>
        public DateTime? LeaseExpiresUtc { get; set; } = null;

        /// <summary>
        /// Queued (UTC).
        /// </summary>
        public DateTime? QueuedUtc { get; set; } = null;

        /// <summary>
        /// Leased (UTC).
        /// </summary>
        public DateTime? LeasedUtc { get; set; } = null;

        /// <summary>
        /// Started (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completed (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Deadline (UTC).
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Whether cancellation was requested.
        /// </summary>
        public bool CancelRequested { get; set; } = false;

        /// <summary>
        /// Final result text.
        /// </summary>
        public string? ResultText { get; set; } = null;

        /// <summary>
        /// Structured output (unmanaged JSON).
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Result of validating the final output against the agent's output schema: true when it validated, false
        /// when it did not, null when the agent has no output schema or the run never produced a successful output.
        /// Always serialized, including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public bool? OutputSchemaValid { get; set; } = null;

        /// <summary>
        /// The first few schema validation errors from the most recent failed validation, separated by "; ", or null
        /// when the output validated or was not validated. Always serialized, including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? SchemaValidationErrors { get; set; } = null;

        /// <summary>
        /// Structured output repair attempts started for this run: 0 (none) or 1. A repair resumes the harness session
        /// inside the same lease with the Repair prompt template.
        /// </summary>
        public int RepairAttempts
        {
            get
            {
                return _RepairAttempts;
            }
            set
            {
                if (value < 0) throw new ArgumentOutOfRangeException(nameof(RepairAttempts), "RepairAttempts cannot be negative.");
                _RepairAttempts = value;
            }
        }

        /// <summary>
        /// Harness session identifier.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Model that served the run.
        /// </summary>
        public string? ServedModel { get; set; } = null;

        /// <summary>
        /// Conversation this run is a turn of, or null for a run outside any conversation. Always serialized, including
        /// when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Turn number within the conversation, starting at 1; 0 for runs outside a conversation.
        /// </summary>
        public int ConversationTurn
        {
            get
            {
                return _ConversationTurn;
            }
            set
            {
                if (value < 0) throw new ArgumentOutOfRangeException(nameof(ConversationTurn), "ConversationTurn cannot be negative.");
                _ConversationTurn = value;
            }
        }

        /// <summary>
        /// Harness session this conversation turn resumes on its affinity node, or null when the turn starts a new
        /// session (the first turn, or a fallback). Cleared when the turn falls back. Always serialized, including when
        /// null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? ResumeSessionId { get; set; } = null;

        /// <summary>
        /// Node this conversation turn prefers because it holds the conversation's directories, or null. Other nodes
        /// leave the run alone until <see cref="AffinityUntilUtc"/> unless the node stops being Ready. Always
        /// serialized, including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? AffinityNodeId { get; set; } = null;

        /// <summary>
        /// End of the affinity wait (UTC): after it any capable node may claim the turn, which then falls back to the
        /// transcript. Null when the run has no affinity.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public DateTime? AffinityUntilUtc { get; set; } = null;

        /// <summary>
        /// Why this conversation turn started a fresh session seeded with the transcript of the earlier turns instead of
        /// resuming, or null when it resumed or is the first turn. Always serialized, including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public ConversationFallbackReasonEnum? ConversationFallbackReason { get; set; } = null;

        /// <summary>
        /// Pipeline run this run is a stage execution of (P12.9), or null for a run outside any pipeline. Always serialized,
        /// including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Position of the pipeline stage this run executes, starting at 1; 0 for runs outside a pipeline.
        /// </summary>
        public int PipelinePosition { get; set; } = 0;

        /// <summary>
        /// Execution number of the pipeline stage this run is, starting at 1 (retries, revisions, and resumes increase it);
        /// 0 for runs outside a pipeline.
        /// </summary>
        public int PipelineExecution { get; set; } = 0;

        /// <summary>
        /// Trigger that started this run (P12.5), or null. Stage runs of a pipeline run a trigger started carry it too.
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// W3C trace ID (32 lowercase hexadecimal characters) of the trace the run was created and compiled in, or null
        /// for runs created before trace IDs were recorded. Server spans (run:create, run:claim, run:compile) and the
        /// worker span (harness &lt;type&gt; exec) for the run share this trace. Always serialized, including when null.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is not null and not 32 hexadecimal characters.</exception>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? TraceId
        {
            get
            {
                return _TraceId;
            }
            set
            {
                if (String.IsNullOrEmpty(value))
                {
                    _TraceId = null;
                    return;
                }
                if (value.Length != 32 || !value.All(Uri.IsHexDigit)) throw new ArgumentException("TraceId must be 32 hexadecimal characters.", nameof(TraceId));
                _TraceId = value.ToLowerInvariant();
            }
        }

        /// <summary>
        /// W3C traceparent of the span that created the run, used to parent the claim, compile, and harness spans. Not
        /// serialized; written once when the run is created.
        /// </summary>
        [JsonIgnore]
        public string? TraceParent { get; set; } = null;

        /// <summary>
        /// Process exit code.
        /// </summary>
        public int? ExitCode { get; set; } = null;

        /// <summary>
        /// Stderr tail (scrubbed).
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
        /// Whether the cost is an estimate.
        /// </summary>
        public bool CostEstimated { get; set; } = false;

        /// <summary>
        /// Reasoning or thinking tokens when the harness reports them (for example Codex reasoning_output_tokens or
        /// Claude Code thinking tokens); otherwise 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Tool call events observed in the run, counted by the worker. Default 0.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Time of the first model output event (assistant text or thinking), measured by the worker. Null when not
        /// measurable.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public DateTime? FirstTokenUtc { get; set; } = null;

        /// <summary>
        /// Time of the last model output event (assistant text or thinking), measured by the worker. Null when not
        /// measurable.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public DateTime? LastTokenUtc { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to the first model output (TTFT, includes harness startup),
        /// measured by the worker on a monotonic clock. Null when not measurable.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? TimeToFirstTokenMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from the first to the last model output, measured by the worker on a monotonic clock. Null
        /// when not measurable.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? StreamingMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to process exit, measured by the worker on a monotonic clock.
        /// Null when not measurable.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? ExecutionMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from queued to leased, computed by the server from its own timestamps. Null until leased.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? QueueMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from queued to completed, computed by the server from its own timestamps. Null until the run
        /// finishes.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? TotalMs { get; set; } = null;

        /// <summary>
        /// Milliseconds the run spent waiting on child runs it delegated to (runs whose parentRunId is this run),
        /// computed by the server from its own timestamps when the run finishes: the union of each child's lifetime
        /// (created to finished), clipped to this run's execution window, so overlapping children count once. 0 when the
        /// run delegated nothing. Null for runs that finished before this was recorded or ended without a worker report.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? DelegationWaitMs { get; set; } = null;

        /// <summary>
        /// TimeToFirstTokenMs minus the delegation wait that happened before the first model output, never negative.
        /// Equals TimeToFirstTokenMs for runs that delegated nothing before their first output. Use it to compare
        /// delegating agents with agents that answer directly. Null when TimeToFirstTokenMs or DelegationWaitMs is null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? TimeToFirstTokenExcludingDelegationMs { get; set; } = null;

        /// <summary>
        /// Output tokens per second of streaming: OutputTokens divided by StreamingMs in seconds, rounded to two
        /// decimals. Null when StreamingMs is null or below 100 milliseconds. Computed; not stored.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? OutputTokensPerSecond
        {
            get
            {
                return ComputeOutputTokensPerSecond(OutputTokens, StreamingMs);
            }
        }

        /// <summary>
        /// Highest event sequence received.
        /// </summary>
        public long LastEventSequence { get; set; } = 0;

        /// <summary>
        /// Computed, read-only on the API: why this queued run cannot be handed to any worker right now, or null when
        /// the run is not Queued or some Ready node could run it. Filled from current node state when the run is read
        /// over REST or MCP; never stored. Always serialized, including when null.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public RunBlockedReasonEnum? BlockedReason { get; set; } = null;

        /// <summary>
        /// Permission approvals of this run waiting for a person (P12.3). Maintained by the approval service with
        /// targeted updates; read-only on the API. While it is above zero the run keeps its status (Running) and its
        /// worker slot, and <see cref="AwaitingApproval"/> is true.
        /// </summary>
        public int PendingApprovals
        {
            get
            {
                return _PendingApprovals;
            }
            set
            {
                _PendingApprovals = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Whether the run's harness is blocked on a permission approval (PendingApprovals above zero). A substatus of
        /// Running, not a status: the harness process and its slot stay in place. Computed; not stored.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public bool AwaitingApproval
        {
            get
            {
                return _PendingApprovals > 0;
            }
        }

        /// <summary>
        /// Total milliseconds the run spent waiting for approvals a person decided or that expired, or null when it never
        /// waited. Rule decisions add nothing.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public long? ApprovalWaitMs { get; set; } = null;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Per-run parameter overrides.
        /// </summary>
        public List<RunParameter> Parameters
        {
            get
            {
                return _Parameters;
            }
            set
            {
                _Parameters = value ?? new List<RunParameter>();
            }
        }

        /// <summary>
        /// Node label requirements copied from the deployment.
        /// </summary>
        public List<RunRequirement> Requirements
        {
            get
            {
                return _Requirements;
            }
            set
            {
                _Requirements = value ?? new List<RunRequirement>();
            }
        }

        /// <summary>
        /// Prompt template versions used to compile the run.
        /// </summary>
        public List<RunTemplateVersion> TemplateVersions
        {
            get
            {
                return _TemplateVersions;
            }
            set
            {
                _TemplateVersions = value ?? new List<RunTemplateVersion>();
            }
        }

        /// <summary>
        /// Executor capabilities needed for placement. Copied into runs so edits do not change queued work.
        /// </summary>
        public ExecutorRequirements RequiredCapabilities
        {
            get { return _RequiredCapabilities; }
            set { _RequiredCapabilities = value ?? new ExecutorRequirements(); }
        }

        /// <summary>
        /// Trust level of the deployment when the run was admitted (P11.14). Default Trusted. For Untrusted runs,
        /// <see cref="RequiredCapabilities"/> already holds the raised isolation requirement; later deployment edits do
        /// not change queued work.
        /// </summary>
        public DeploymentTrustLevelEnum TrustLevel { get; set; } = DeploymentTrustLevelEnum.Trusted;

        /// <summary>
        /// The deployment's effect policy when the run was admitted (P12.29). Default AtMostOnce. The lease reaper uses
        /// this value, not the deployment's current one, so editing the deployment does not change how an in-flight run is
        /// handled when its worker is lost: AtLeastOnce requeues a lost Running run while attempts remain; AtMostOnce and
        /// Journaled without a safe known-coverage checkpoint end it Failed with outcome NodeLost.
        /// </summary>
        public DeploymentEffectPolicyEnum EffectPolicy { get; set; } = DeploymentEffectPolicyEnum.AtMostOnce;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewRunId();
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private string _DeploymentId = String.Empty;
        private int _Priority = 0;
        private int _RepairAttempts = 0;
        private int _ConversationTurn = 0;
        private int _PendingApprovals = 0;
        private string? _TraceId = null;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<RunParameter> _Parameters = new List<RunParameter>();
        private List<RunRequirement> _Requirements = new List<RunRequirement>();
        private List<RunTemplateVersion> _TemplateVersions = new List<RunTemplateVersion>();

        private ExecutorRequirements _RequiredCapabilities = new ExecutorRequirements();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Output tokens per second of streaming: outputTokens divided by streamingMs in seconds, rounded to two
        /// decimals.
        /// </summary>
        /// <param name="outputTokens">Output tokens.</param>
        /// <param name="streamingMs">Streaming milliseconds, or null.</param>
        /// <returns>Rate, or null when streamingMs is null or below 100 milliseconds.</returns>
        public static double? ComputeOutputTokensPerSecond(long outputTokens, long? streamingMs)
        {
            if (!streamingMs.HasValue || streamingMs.Value < 100) return null;
            return Math.Round(outputTokens / (streamingMs.Value / 1000.0), 2);
        }

        /// <summary>
        /// Milliseconds between two timestamps, never negative.
        /// </summary>
        /// <param name="fromUtc">Start, or null.</param>
        /// <param name="toUtc">End, or null.</param>
        /// <returns>Milliseconds, or null when either timestamp is null.</returns>
        public static long? ElapsedMs(DateTime? fromUtc, DateTime? toUtc)
        {
            if (!fromUtc.HasValue || !toUtc.HasValue) return null;
            return Math.Max(0, (long)(toUtc.Value - fromUtc.Value).TotalMilliseconds);
        }

        #endregion
    }
}
