namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Binds an agent to a harness profile, prompts, resources, placement, and limits.
    /// </summary>
    public class Deployment
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewDeploymentId() : value;
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
        /// Deployment name, unique per tenant.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Harness profile identifier.
        /// </summary>
        public string HarnessProfileId
        {
            get
            {
                return _HarnessProfileId;
            }
            set
            {
                _HarnessProfileId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Model name passed to the harness.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Fallback model.
        /// </summary>
        public string? FallbackModel { get; set; } = null;

        /// <summary>
        /// Reasoning effort.
        /// </summary>
        public string? Effort { get; set; } = null;

        /// <summary>
        /// Maximum agent turns.
        /// </summary>
        public int? MaxTurns { get; set; } = null;

        /// <summary>
        /// Maximum spend per run in USD where the harness supports it.
        /// </summary>
        public double? MaxBudgetUsd { get; set; } = null;

        /// <summary>
        /// Maximum concurrent runs; 0 means unlimited. Minimum 0, maximum 100000.
        /// </summary>
        public int MaxConcurrentRuns
        {
            get
            {
                return _MaxConcurrentRuns;
            }
            set
            {
                _MaxConcurrentRuns = Math.Clamp(value, 0, 100000);
            }
        }

        /// <summary>
        /// Run deadline override.
        /// </summary>
        public int? TimeoutSeconds { get; set; } = null;

        /// <summary>
        /// Run guard limit: whether the worker stops a run whose assistant text degenerates into one short repeated unit
        /// or into text with no letters or digits (outcome RepetitionDetected). Null uses the cluster setting
        /// Runtime.RepetitionGuard (default true).
        /// </summary>
        public bool? RepetitionGuard { get; set; } = null;

        /// <summary>
        /// Run guard limit: most characters of assistant text a run may produce before the worker stops it (outcome
        /// OutputLimitExceeded). 0 turns the limit off. Null uses the cluster setting Runtime.MaxAssistantChars (default
        /// 200,000). Minimum 0, maximum 100,000,000.
        /// </summary>
        public long? MaxAssistantChars
        {
            get
            {
                return _MaxAssistantChars;
            }
            set
            {
                _MaxAssistantChars = value.HasValue ? Math.Clamp(value.Value, 0, 100000000) : null;
            }
        }

        /// <summary>
        /// Run guard limit: seconds without assistant text, thinking, tool call, or tool result (while no tool call is
        /// open) before the worker stops a run (outcome NoProgress). 0 turns the guard off. Null uses the cluster setting
        /// Runtime.NoProgressSeconds (default 300). Minimum 0, maximum 86,400.
        /// </summary>
        public int? NoProgressSeconds
        {
            get
            {
                return _NoProgressSeconds;
            }
            set
            {
                _NoProgressSeconds = value.HasValue ? Math.Clamp(value.Value, 0, 86400) : null;
            }
        }

        /// <summary>
        /// Maximum attempts. Minimum 1, maximum 10, default 1.
        /// </summary>
        public int MaxAttempts
        {
            get
            {
                return _MaxAttempts;
            }
            set
            {
                _MaxAttempts = Math.Clamp(value, 1, 10);
            }
        }

        /// <summary>
        /// Whether a running run is requeued when its node is lost.
        /// </summary>
        public bool RetryOnNodeLoss { get; set; } = false;

        /// <summary>
        /// Traffic weight among the agent's active deployments. Minimum 0, maximum 1000, default 100.
        /// </summary>
        public int Weight
        {
            get
            {
                return _Weight;
            }
            set
            {
                _Weight = Math.Clamp(value, 0, 1000);
            }
        }

        /// <summary>
        /// Required node pool.
        /// </summary>
        public string? NodePoolId { get; set; } = null;

        /// <summary>
        /// How runs execute: Process (a subprocess of the worker) or KubernetesJob (a pod per run, plan D-033). Null uses
        /// the node pool's defaultExecutor, then Process. Runs record the effective executor when they are created, and
        /// only workers that report the executor claim them.
        /// </summary>
        public RunExecutorEnum? Executor { get; set; } = null;

        /// <summary>
        /// CPU, memory, and ephemeral storage requests and limits for the run pod of KubernetesJob runs. Ignored for
        /// Process runs. Never null; unset values use the worker's defaults.
        /// </summary>
        public RunPodResources PodResources
        {
            get
            {
                return _PodResources;
            }
            set
            {
                _PodResources = value ?? new RunPodResources();
            }
        }

        /// <summary>
        /// Workspace template.
        /// </summary>
        public string? WorkspaceTemplateId { get; set; } = null;

        /// <summary>
        /// Artifact store.
        /// </summary>
        public string? ArtifactStoreId { get; set; } = null;

        /// <summary>
        /// Permission approvals (P12.3). When true, Claude Code runs relay permission prompts to Garrison through
        /// <c>--permission-prompt-tool</c>, and Codex app-server runs relay command and file change approvals; the
        /// deployment's rules decide each request or send it to a person. Only harness profiles that can relay
        /// approvals accept it (Claude Code, and Codex with CodexAppServer delivery). Default false.
        /// </summary>
        public bool ApprovalsEnabled { get; set; } = false;

        /// <summary>
        /// What happens to a permission request no rule matches: Allow, Deny, or Ask (a person decides). Default Ask.
        /// </summary>
        public ApprovalRuleActionEnum ApprovalDefaultAction { get; set; } = ApprovalRuleActionEnum.Ask;

        /// <summary>
        /// Seconds a pending approval waits for a person before the timeout decision applies. The wait never outlasts
        /// the run's deadline. Minimum 10, maximum 3600, default 300.
        /// </summary>
        public int ApprovalTimeoutSeconds
        {
            get
            {
                return _ApprovalTimeoutSeconds;
            }
            set
            {
                _ApprovalTimeoutSeconds = Math.Clamp(value, 10, 3600);
            }
        }

        /// <summary>
        /// Decision applied when a pending approval expires. Default Deny.
        /// </summary>
        public ApprovalDecisionEnum ApprovalTimeoutDecision { get; set; } = ApprovalDecisionEnum.Deny;

        /// <summary>
        /// Configuration version, incremented on every change.
        /// </summary>
        public int ConfigVersion { get; set; } = 1;

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
        /// Prompt role to template bindings.
        /// </summary>
        public List<DeploymentPromptBinding> PromptBindings
        {
            get
            {
                return _PromptBindings;
            }
            set
            {
                _PromptBindings = value ?? new List<DeploymentPromptBinding>();
            }
        }

        /// <summary>
        /// MCP server and secret bindings.
        /// </summary>
        public List<DeploymentResourceBinding> ResourceBindings
        {
            get
            {
                return _ResourceBindings;
            }
            set
            {
                _ResourceBindings = value ?? new List<DeploymentResourceBinding>();
            }
        }

        /// <summary>
        /// Argument overrides applied to the profile.
        /// </summary>
        public List<DeploymentArgumentOverride> ArgumentOverrides
        {
            get
            {
                return _ArgumentOverrides;
            }
            set
            {
                _ArgumentOverrides = value ?? new List<DeploymentArgumentOverride>();
            }
        }

        /// <summary>
        /// Environment overrides.
        /// </summary>
        public List<DeploymentEnvironmentOverride> EnvironmentOverrides
        {
            get
            {
                return _EnvironmentOverrides;
            }
            set
            {
                _EnvironmentOverrides = value ?? new List<DeploymentEnvironmentOverride>();
            }
        }

        /// <summary>
        /// File overrides.
        /// </summary>
        public List<DeploymentFileOverride> FileOverrides
        {
            get
            {
                return _FileOverrides;
            }
            set
            {
                _FileOverrides = value ?? new List<DeploymentFileOverride>();
            }
        }

        /// <summary>
        /// Node label requirements.
        /// </summary>
        public List<DeploymentNodeSelector> NodeSelector
        {
            get
            {
                return _NodeSelector;
            }
            set
            {
                _NodeSelector = value ?? new List<DeploymentNodeSelector>();
            }
        }

        /// <summary>
        /// Named parameters exposed to templates as deployment.parameters.
        /// </summary>
        public List<DeploymentParameter> Parameters
        {
            get
            {
                return _Parameters;
            }
            set
            {
                _Parameters = value ?? new List<DeploymentParameter>();
            }
        }

        /// <summary>
        /// Parameters callers may override per run.
        /// </summary>
        public List<DeploymentRunOverrideRule> AllowedRunOverrides
        {
            get
            {
                return _AllowedRunOverrides;
            }
            set
            {
                _AllowedRunOverrides = value ?? new List<DeploymentRunOverrideRule>();
            }
        }

        /// <summary>
        /// Permission approval rules in display order (P12.3). Deny beats Ask and Ask beats Allow when several match;
        /// a request no rule matches gets <see cref="ApprovalDefaultAction"/>.
        /// </summary>
        public List<DeploymentApprovalRule> ApprovalRules
        {
            get
            {
                return _ApprovalRules;
            }
            set
            {
                _ApprovalRules = value ?? new List<DeploymentApprovalRule>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewDeploymentId();
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _Name = String.Empty;
        private string _HarnessProfileId = String.Empty;
        private int _MaxConcurrentRuns = 0;
        private long? _MaxAssistantChars = null;
        private int? _NoProgressSeconds = null;
        private int _MaxAttempts = 1;
        private int _Weight = 100;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;
        private List<DeploymentPromptBinding> _PromptBindings = new List<DeploymentPromptBinding>();
        private List<DeploymentResourceBinding> _ResourceBindings = new List<DeploymentResourceBinding>();
        private List<DeploymentArgumentOverride> _ArgumentOverrides = new List<DeploymentArgumentOverride>();
        private List<DeploymentEnvironmentOverride> _EnvironmentOverrides = new List<DeploymentEnvironmentOverride>();
        private List<DeploymentFileOverride> _FileOverrides = new List<DeploymentFileOverride>();
        private List<DeploymentNodeSelector> _NodeSelector = new List<DeploymentNodeSelector>();
        private RunPodResources _PodResources = new RunPodResources();
        private List<DeploymentParameter> _Parameters = new List<DeploymentParameter>();
        private List<DeploymentRunOverrideRule> _AllowedRunOverrides = new List<DeploymentRunOverrideRule>();
        private List<DeploymentApprovalRule> _ApprovalRules = new List<DeploymentApprovalRule>();
        private int _ApprovalTimeoutSeconds = 300;

        #endregion
    }
}
