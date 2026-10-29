namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Compile preview with secret values redacted.
    /// </summary>
    public class CompilePreviewResponse
    {
        /// <summary>
        /// Execution spec.
        /// </summary>
        public Garrison.Core.Compilation.ExecutionSpec Spec { get; set; } = new Garrison.Core.Compilation.ExecutionSpec();

        /// <summary>
        /// Template versions used.
        /// </summary>
        public List<Garrison.Core.Models.RunTemplateVersion> TemplateVersions { get; set; } = new List<Garrison.Core.Models.RunTemplateVersion>();

        /// <summary>
        /// Shell-quoted command line for display only.
        /// </summary>
        public string CommandLine { get; set; } = String.Empty;

        /// <summary>
        /// The deployment that was compiled (another one when an environment was requested).
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// The agent revision that was compiled, or null when the agent has no revisions.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;
    }
}
