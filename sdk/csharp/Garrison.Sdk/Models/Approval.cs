namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A permission request a harness relayed to Garrison and its decision. Requests decided by a rule or by the
    /// deployment default are recorded already decided; requests a rule sends to a person stay Pending until someone
    /// decides, the approval expires, or the run stops. The tool input is never stored in full: <see cref="InputPreview"/>
    /// is a redacted, truncated copy.
    /// </summary>
    public class Approval
    {
        #region Public-Members

        /// <summary>
        /// Identifier (apr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Run that asked.
        /// </summary>
        public string RunId
        {
            get
            {
                return _RunId;
            }
            set
            {
                _RunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Root of the run's delegation tree, or null when the run is a root.
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Agent of the run.
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
        /// Agent name at request time.
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
        /// Deployment whose rules were evaluated.
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
        /// Lease epoch of the run attempt that asked. A requeued run's later attempt has a higher epoch, and pending
        /// approvals of an older epoch are cancelled.
        /// </summary>
        public long LeaseEpoch { get; set; } = 0;

        /// <summary>
        /// Harness type of the run.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Where the request came from.
        /// </summary>
        public ApprovalKindEnum Kind { get; set; } = ApprovalKindEnum.Tool;

        /// <summary>
        /// Tool name the rules were evaluated against (Codex commands are Bash, Codex file changes are Edit).
        /// </summary>
        public string ToolName
        {
            get
            {
                return _ToolName;
            }
            set
            {
                _ToolName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The harness's identifier of the tool call (Claude tool_use_id, Codex item ID), or null.
        /// </summary>
        public string? ToolCallId { get; set; } = null;

        /// <summary>
        /// Tool input as compact JSON with secrets redacted, truncated to the service's preview limit (default 4000
        /// characters).
        /// </summary>
        public string? InputPreview { get; set; } = null;

        /// <summary>
        /// One-line summary for lists: the command, path, URL, or query, redacted and truncated to 500 characters.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// A rule pattern that would cover this request, offered when deciding with remember.
        /// </summary>
        public string? SuggestedRule { get; set; } = null;

        /// <summary>
        /// State.
        /// </summary>
        public ApprovalStatusEnum Status { get; set; } = ApprovalStatusEnum.Pending;

        /// <summary>
        /// What the harness was told, or null while Pending.
        /// </summary>
        public ApprovalDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who or what decided, or null while Pending.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Rule that matched (Rule source, and Ask requests sent to a person by a rule), or null.
        /// </summary>
        public string? RuleId { get; set; } = null;

        /// <summary>
        /// Pattern of the rule that matched, or null.
        /// </summary>
        public string? RulePattern { get; set; } = null;

        /// <summary>
        /// Rule created from this decision with remember, or null.
        /// </summary>
        public string? RememberedRuleId { get; set; } = null;

        /// <summary>
        /// Name of the principal that decided (User source), or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Identifier of the user or credential that decided (User source), or null.
        /// </summary>
        public string? DecidedById { get; set; } = null;

        /// <summary>
        /// Reason given with the decision, or the reason Garrison decided (timeout, cancellation), or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// Decision applied if the approval expires, copied from the deployment when the request arrived. Default Deny.
        /// </summary>
        public ApprovalDecisionEnum TimeoutDecision { get; set; } = ApprovalDecisionEnum.Deny;

        /// <summary>
        /// When the harness asked (UTC).
        /// </summary>
        public DateTime RequestedUtc
        {
            get
            {
                return _RequestedUtc;
            }
            set
            {
                _RequestedUtc = value;
            }
        }

        /// <summary>
        /// When the approval was decided (UTC), or null while Pending.
        /// </summary>
        public DateTime? DecidedUtc
        {
            get
            {
                return _DecidedUtc;
            }
            set
            {
                _DecidedUtc = value;
            }
        }

        /// <summary>
        /// When a pending approval expires (UTC), or null for approvals decided on arrival.
        /// </summary>
        public DateTime? ExpiresUtc
        {
            get
            {
                return _ExpiresUtc;
            }
            set
            {
                _ExpiresUtc = value;
            }
        }

        /// <summary>
        /// Milliseconds between the request and the decision, or null while Pending. Computed by the server; not stored.
        /// </summary>
        public long? WaitMs { get; set; } = null;

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

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _RunId = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private string _DeploymentId = String.Empty;
        private string _ToolName = String.Empty;
        private DateTime _RequestedUtc = DateTime.UtcNow;
        private DateTime? _DecidedUtc = null;
        private DateTime? _ExpiresUtc = null;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion
    }
}
