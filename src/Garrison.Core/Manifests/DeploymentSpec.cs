namespace Garrison.Core.Manifests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
        /// Workspace template name.
        /// </summary>
        public string? Workspace { get; set; } = null;

        /// <summary>
        /// Artifact store name.
        /// </summary>
        public string? ArtifactStore { get; set; } = null;

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
