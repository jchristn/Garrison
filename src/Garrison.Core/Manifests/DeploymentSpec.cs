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
        /// Environment label (AD1.3). Default dev; omitted from exports when dev.
        /// </summary>
        public string? Environment { get; set; } = null;

        /// <summary>
        /// Agent revision number to pin (AD1.7), or null to follow the agent's latest published revision. Numbers, not
        /// identifiers, so a bundle applies to another tenant. An agent created by the same bundle has revision 1 only.
        /// </summary>
        public int? AgentRevision { get; set; } = null;

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
        /// Effect policy (P12.29): AtMostOnce, AtLeastOnce, or Journaled. Null (omitted) means AtMostOnce unless the
        /// deprecated <see cref="RetryOnNodeLoss"/> is given. Export always writes it.
        /// </summary>
        public DeploymentEffectPolicyEnum? EffectPolicy { get; set; } = null;

        /// <summary>
        /// Deprecated since P12.29; use <see cref="EffectPolicy"/>. Accepted for one release: true maps to AtLeastOnce and
        /// false to AtMostOnce; together with an <see cref="EffectPolicy"/> it must agree, or the document fails with
        /// EffectPolicyConflict. Null (omitted) by default; export never writes it.
        /// </summary>
        public bool? RetryOnNodeLoss { get; set; } = null;

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

        /// <summary>
        /// Delegated management (AD7.4): Drafts lets this deployment's runs work on studio drafts for the person who started
        /// them. Null (omitted) means None; export omits None.
        /// </summary>
        public ManagementAccessEnum? ManagementAccess { get; set; } = null;

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
        /// Egress allowlist (P11.15): a list of rules, each with cidr (required), port (1 to 65535, omitted for every
        /// port), and protocol (TCP, the default, or UDP). Null or empty means no allowlist; export omits it then. With
        /// rules, run pods may reach only DNS, the Garrison server MCP port, and these rules.
        /// </summary>
        public List<Garrison.Core.Models.DeploymentEgressRule>? EgressRules { get; set; } = null;

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
