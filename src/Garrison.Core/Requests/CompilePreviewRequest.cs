namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Compile preview input.
    /// </summary>
    public class CompilePreviewRequest
    {
        /// <summary>
        /// Sample input message.
        /// </summary>
        public string Input { get; set; } = "Hello from the compile preview.";

        /// <summary>
        /// Sample run parameters.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Agent revision to compile with (AD9.3), for example a draft revision before it is published. Null for the
        /// revision the deployment would run.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Environment to preview (AD9.3): compiles the same agent's deployment in that environment instead of this one.
        /// Null for this deployment.
        /// </summary>
        public string? Environment { get; set; } = null;
    }
}
