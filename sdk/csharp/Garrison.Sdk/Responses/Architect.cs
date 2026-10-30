namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// An agent architect: a tenant deployment that may edit studio drafts for the person it works for, with its harness,
    /// model, and architect prompt. Not thread-safe.
    /// </summary>
    public class Architect
    {
        #region Public-Members

        /// <summary>
        /// Deployment identifier. Never null.
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
        /// Tenant identifier. Never null.
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
        /// Deployment name, unique in the tenant. Never null.
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
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Identifier of the agent the deployment runs, normally the built-in agent-architect. Never null.
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
        /// Name of that agent, or null when it could not be read.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Harness profile identifier. Never null.
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
        /// Model, or null for the harness default.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// True when the architect accepts runs. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Identifier of the System template the architect uses. Never null.
        /// </summary>
        public string ArchitectPromptTemplateId
        {
            get
            {
                return _ArchitectPromptTemplateId;
            }
            set
            {
                _ArchitectPromptTemplateId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name of that template, for example builtin/agent-architect. Never null.
        /// </summary>
        public string ArchitectPromptName
        {
            get
            {
                return _ArchitectPromptName;
            }
            set
            {
                _ArchitectPromptName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pinned template version, or null when each turn renders the template's current version.
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;

        /// <summary>
        /// The template's current version. Default 1.
        /// </summary>
        public int ArchitectPromptCurrentVersion { get; set; } = 1;

        /// <summary>
        /// Identifier of the credential secret the architect's harness signs in with, bound under the alias "credential",
        /// or null when none is bound.
        /// </summary>
        public string? CredentialSecretId { get; set; } = null;

        /// <summary>
        /// Name of the credential secret, or null when none is bound.
        /// </summary>
        public string? CredentialSecretName { get; set; } = null;

        /// <summary>
        /// Kind of the credential secret (for example AnthropicApiKey), or null when none is bound.
        /// </summary>
        public string? CredentialSecretKind { get; set; } = null;

        /// <summary>
        /// Deployment configuration version. Default 1.
        /// </summary>
        public int ConfigVersion { get; set; } = 1;

        /// <summary>
        /// True for a deployment Garrison protects from change. Default false.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation time, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last change, UTC.
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private string _HarnessProfileId = String.Empty;
        private string _ArchitectPromptTemplateId = String.Empty;
        private string _ArchitectPromptName = String.Empty;

        #endregion
    }
}
