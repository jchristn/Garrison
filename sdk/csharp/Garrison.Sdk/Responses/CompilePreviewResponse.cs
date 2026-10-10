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
    }
}
