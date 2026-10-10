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
        /// Workspace template.
        /// </summary>
        public string? WorkspaceTemplateId { get; set; } = null;

        /// <summary>
        /// Artifact store.
        /// </summary>
        public string? ArtifactStoreId { get; set; } = null;

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

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewDeploymentId();
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _Name = String.Empty;
        private string _HarnessProfileId = String.Empty;
        private int _MaxConcurrentRuns = 0;
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
        private List<DeploymentParameter> _Parameters = new List<DeploymentParameter>();
        private List<DeploymentRunOverrideRule> _AllowedRunOverrides = new List<DeploymentRunOverrideRule>();

        #endregion
    }
}
