namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Deployment manifest spec. References use names; prompts map a role to a template name, optionally pinned with name@version.
    /// </summary>
    public class DeploymentSpec
    {
        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Harness profile name (tenant or built-in).
        /// </summary>
        public string HarnessProfile { get; set; } = String.Empty;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Model.
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
        /// Maximum turns.
        /// </summary>
        public int? MaxTurns { get; set; } = null;

        /// <summary>
        /// Maximum budget in USD.
        /// </summary>
        public double? MaxBudgetUsd { get; set; } = null;

        /// <summary>
        /// Maximum concurrent runs; 0 means unlimited.
        /// </summary>
        public int MaxConcurrentRuns { get; set; } = 0;

        /// <summary>
        /// Run deadline.
        /// </summary>
        public int? TimeoutSeconds { get; set; } = null;

        /// <summary>
        /// Run guard: stop runs whose assistant text degenerates into repetition. Null uses Runtime.RepetitionGuard.
        /// </summary>
        public bool? RepetitionGuard { get; set; } = null;

        /// <summary>
        /// Run guard: most characters of assistant text per run (0 is unlimited). Null uses Runtime.MaxAssistantChars.
        /// </summary>
        public long? MaxAssistantChars { get; set; } = null;

        /// <summary>
        /// Run guard: seconds without progress before a run stops (0 turns it off). Null uses Runtime.NoProgressSeconds.
        /// </summary>
        public int? NoProgressSeconds { get; set; } = null;

        /// <summary>
        /// Maximum attempts.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Whether runs are requeued when their node is lost.
        /// </summary>
        public bool RetryOnNodeLoss { get; set; } = false;

        /// <summary>
        /// Traffic weight.
        /// </summary>
        public int Weight { get; set; } = 100;

        /// <summary>
        /// Executor: Process or KubernetesJob. Null uses the node pool's default executor, then Process.
        /// </summary>
        public RunExecutorEnum? Executor { get; set; } = null;

        /// <summary>
        /// Trust level: Trusted or Untrusted (P11.14). Null (omitted) means Trusted; export omits Trusted. Untrusted runs
        /// need an executor with at least Container isolation.
        /// </summary>
        public DeploymentTrustLevelEnum? TrustLevel { get; set; } = null;

        /// <summary>Optional executor capability requirements; defaults preserve legacy placement.</summary>
        public ExecutorRequirements? RequiredCapabilities { get; set; } = null;

        /// <summary>
        /// Run pod requests and limits for KubernetesJob runs (cpuRequest, cpuLimit, memoryRequest, memoryLimit,
        /// ephemeralStorageRequest, ephemeralStorageLimit). Null for none. Named podResources because resources holds
        /// the secret and MCP server bindings.
        /// </summary>
        public RunPodResources? PodResources { get; set; } = null;

        /// <summary>
        /// Workspace template name.
        /// </summary>
        public string? Workspace { get; set; } = null;

        /// <summary>
        /// Artifact store name.
        /// </summary>
        public string? ArtifactStore { get; set; } = null;

        /// <summary>Explicit workspace-relative collection globs. Null or empty disables collection.</summary>
        public List<string>? ArtifactGlobs { get; set; } = null;

        /// <summary>
        /// Role to template name (name@version pins a version).
        /// </summary>
        public Dictionary<string, string> Prompts { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Resource bindings.
        /// </summary>
        public DeploymentResourcesSpec Resources { get; set; } = new DeploymentResourcesSpec();

        /// <summary>
        /// Parameters exposed to templates.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Node label requirements.
        /// </summary>
        public Dictionary<string, string> NodeSelector { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Parameters callers may override.
        /// </summary>
        public List<Garrison.Core.Models.DeploymentRunOverrideRule> AllowedRunOverrides { get; set; } = new List<Garrison.Core.Models.DeploymentRunOverrideRule>();

        /// <summary>
        /// Permission approvals (P12.3): relay Claude Code and Codex app-server permission requests to Garrison. Default false.
        /// </summary>
        public bool ApprovalsEnabled { get; set; } = false;

        /// <summary>
        /// Action for requests no approval rule matches: Allow, Deny, or Ask. Default Ask.
        /// </summary>
        public Garrison.Core.Enums.ApprovalRuleActionEnum ApprovalDefaultAction { get; set; } = Garrison.Core.Enums.ApprovalRuleActionEnum.Ask;

        /// <summary>
        /// Seconds a pending approval waits for a person (10 to 3600). Default 300.
        /// </summary>
        public int ApprovalTimeoutSeconds { get; set; } = 300;

        /// <summary>
        /// Decision applied when a pending approval expires. Default Deny.
        /// </summary>
        public Garrison.Core.Enums.ApprovalDecisionEnum ApprovalTimeoutDecision { get; set; } = Garrison.Core.Enums.ApprovalDecisionEnum.Deny;

        /// <summary>
        /// Permission approval rules in order (action, pattern, optional inputPattern and description).
        /// </summary>
        public List<Garrison.Core.Models.DeploymentApprovalRule> ApprovalRules { get; set; } = new List<Garrison.Core.Models.DeploymentApprovalRule>();

        /// <summary>
        /// Argument overrides.
        /// </summary>
        public List<Garrison.Core.Models.DeploymentArgumentOverride> ArgumentOverrides { get; set; } = new List<Garrison.Core.Models.DeploymentArgumentOverride>();

        /// <summary>
        /// Environment overrides.
        /// </summary>
        public List<Garrison.Core.Models.DeploymentEnvironmentOverride> EnvironmentOverrides { get; set; } = new List<Garrison.Core.Models.DeploymentEnvironmentOverride>();

        /// <summary>
        /// File overrides.
        /// </summary>
        public List<Garrison.Core.Models.DeploymentFileOverride> FileOverrides { get; set; } = new List<Garrison.Core.Models.DeploymentFileOverride>();
    }
}
