namespace Garrison.Core.Compilation
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Result of compiling a run.
    /// </summary>
    public class CompilationResult
    {
        /// <summary>
        /// Execution spec to send to the worker.
        /// </summary>
        public ExecutionSpec Spec { get; set; } = new ExecutionSpec();

        /// <summary>
        /// Prompt template versions used, recorded on the run.
        /// </summary>
        public List<RunTemplateVersion> TemplateVersions { get; set; } = new List<RunTemplateVersion>();
    }
}
