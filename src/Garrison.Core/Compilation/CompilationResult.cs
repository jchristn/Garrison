namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
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

        /// <summary>
        /// Rendered task prompt before delivery (before a system prompt is prepended for profiles that prepend it). Used by
        /// previews (for example the pipeline preview, P12.9); not serialized. Prompts never contain secret values.
        /// </summary>
        [JsonIgnore]
        public string TaskPrompt
        {
            get
            {
                return _TaskPrompt;
            }
            set
            {
                _TaskPrompt = value ?? String.Empty;
            }
        }

        private string _TaskPrompt = String.Empty;
    }
}
