namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One invocation of one deployment.
    /// </summary>
    public class Run
    {
        #region Public-Members

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
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
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
        /// Harness session identifier.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Model that served the run.
        /// </summary>
        public string? ServedModel { get; set; } = null;

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
        /// Reasoning (thinking) tokens reported by the harness. Default 0.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Number of tool calls the harness made during the run. Default 0.
        /// </summary>
        public int ToolCallCount { get; set; } = 0;

        /// <summary>
        /// Time of the first model output event (UTC). Null when the run produced no model output.
        /// </summary>
        public DateTime? FirstTokenUtc { get; set; } = null;

        /// <summary>
        /// Time of the last model output event (UTC). Null when the run produced no model output.
        /// </summary>
        public DateTime? LastTokenUtc { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to the first model output event (includes harness startup). Null when not measurable.
        /// </summary>
        public long? TimeToFirstTokenMs { get; set; } = null;

        /// <summary>
        /// Milliseconds between the first and last model output events. Null when not measurable.
        /// </summary>
        public long? StreamingMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from harness process start to process exit. Null when not measurable.
        /// </summary>
        public long? ExecutionMs { get; set; } = null;

        /// <summary>
        /// Milliseconds spent queued before the run was leased. Null when not measurable.
        /// </summary>
        public long? QueueMs { get; set; } = null;

        /// <summary>
        /// Milliseconds from queued to completed, measured by the server. Null until the run finishes.
        /// </summary>
        public long? TotalMs { get; set; } = null;

        /// <summary>
        /// Output tokens per second over the streaming window. Null when not measurable.
        /// </summary>
        public double? OutputTokensPerSecond { get; set; } = null;

        /// <summary>
        /// Whether the cost is an estimate.
        /// </summary>
        public bool CostEstimated { get; set; } = false;

        /// <summary>
        /// Highest event sequence received.
        /// </summary>
        public long LastEventSequence { get; set; } = 0;

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
                _CreatedUtc = value;
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
                _LastUpdateUtc = value;
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

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private string _DeploymentId = String.Empty;
        private int _Priority = 0;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<RunParameter> _Parameters = new List<RunParameter>();
        private List<RunRequirement> _Requirements = new List<RunRequirement>();
        private List<RunTemplateVersion> _TemplateVersions = new List<RunTemplateVersion>();

        #endregion
    }
}
