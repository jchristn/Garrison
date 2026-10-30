namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// An agent architect: a tenant-wide, reusable deployment that may edit studio drafts (managementAccess Drafts), shown
    /// with the harness, model, and architect prompt it works with. Any draft can use any architect. The architect is
    /// stored as a deployment, so its identifier is the deployment identifier (dep_...).
    /// </summary>
    public class Architect
    {
        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Name, unique among the tenant's deployments.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Identifier of the agent it deploys (the built-in agent-architect for architects created here).
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Name of the agent it deploys, or null when the agent cannot be read.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Harness profile identifier.
        /// </summary>
        public string HarnessProfileId { get; set; } = String.Empty;

        /// <summary>
        /// Model, or null for the harness profile's default.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Whether the architect accepts new turns.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Identifier of the System template it uses as its architect prompt.
        /// </summary>
        public string ArchitectPromptTemplateId { get; set; } = String.Empty;

        /// <summary>
        /// Name of the architect prompt.
        /// </summary>
        public string ArchitectPromptName { get; set; } = String.Empty;

        /// <summary>
        /// Pinned prompt version, or null to follow the template's current version.
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;

        /// <summary>
        /// The prompt template's current version.
        /// </summary>
        public int ArchitectPromptCurrentVersion { get; set; } = 1;

        /// <summary>
        /// Identifier of the secret the architect's harness signs in with (for example an AnthropicApiKey for Claude Code),
        /// or null when none is bound. Without one, most harnesses fail with outcome NotCredentialed.
        /// </summary>
        public string? CredentialSecretId { get; set; } = null;

        /// <summary>
        /// Name of the credential secret, or null.
        /// </summary>
        public string? CredentialSecretName { get; set; } = null;

        /// <summary>
        /// Kind of the credential secret (AnthropicApiKey, ClaudeCodeOAuthToken, OpenAiApiKey, and so on), or null.
        /// </summary>
        public string? CredentialSecretKind { get; set; } = null;

        /// <summary>
        /// Configuration version of the underlying deployment; every change adds one.
        /// </summary>
        public int ConfigVersion { get; set; } = 1;

        /// <summary>
        /// Whether the underlying deployment is protected (cannot be changed or deleted here).
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
    }
}
