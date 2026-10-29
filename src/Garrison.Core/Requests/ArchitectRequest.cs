namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Create or change an agent architect. On create, the architect becomes a deployment of the tenant's built-in
    /// agent-architect with managementAccess Drafts. On update, only these fields change; the deployment's other settings
    /// (limits, executor, egress, and so on) stay as they are and are edited through the deployment routes.
    /// </summary>
    public class ArchitectRequest
    {
        /// <summary>
        /// Name, unique among the tenant's deployments. Required.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Harness profile identifier. Required.
        /// </summary>
        public string HarnessProfileId { get; set; } = String.Empty;

        /// <summary>
        /// Model, or null for the harness profile's default.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Whether the architect accepts new turns. Default true.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// System template identifier or name to use as the architect prompt. Null on create binds builtin/agent-architect;
        /// null on update keeps the current prompt.
        /// </summary>
        public string? ArchitectPromptTemplateId { get; set; } = null;

        /// <summary>
        /// Version to pin, or null to follow the template's current version. Minimum 1. Applies with
        /// ArchitectPromptTemplateId.
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;
    }
}
