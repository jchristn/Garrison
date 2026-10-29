namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// The architect prompt an architect deployment uses (AD7.14): its System prompt binding.
    /// </summary>
    public class ArchitectPromptSelection
    {
        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Selected System template identifier.
        /// </summary>
        public string ArchitectPromptTemplateId { get; set; } = String.Empty;

        /// <summary>
        /// Selected template name.
        /// </summary>
        public string ArchitectPromptName { get; set; } = String.Empty;

        /// <summary>
        /// Pinned version, or null to follow the template's current version (edits apply on the next turn).
        /// </summary>
        public int? ArchitectPromptVersion { get; set; } = null;

        /// <summary>
        /// The template's current version.
        /// </summary>
        public int CurrentVersion { get; set; } = 1;
    }
}
