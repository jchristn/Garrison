namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Compile preview with secret values redacted.
    /// </summary>
    public class CompilePreviewResponse
    {
        /// <summary>
        /// Execution spec.
        /// </summary>
        public Garrison.Sdk.Compilation.ExecutionSpec Spec { get; set; } = new Garrison.Sdk.Compilation.ExecutionSpec();

        /// <summary>
        /// Template versions used.
        /// </summary>
        public List<Garrison.Sdk.Models.RunTemplateVersion> TemplateVersions { get; set; } = new List<Garrison.Sdk.Models.RunTemplateVersion>();

        /// <summary>
        /// Shell-quoted command line for display only.
        /// </summary>
        public string CommandLine { get; set; } = String.Empty;

        /// <summary>
        /// Deployment that was compiled; differs from the addressed one when an environment was requested.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent revision used, or null when the agent has no revisions.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;
    }
}
