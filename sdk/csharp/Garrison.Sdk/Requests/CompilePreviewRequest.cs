namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

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
        /// Agent revision to compile with instead of the deployment's pinned or published one, such as a draft
        /// (AD9.3). Needs Read on AgentRevision. Null uses the deployment's own revision.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Compile the same agent's deployment in this environment instead (AD9.3). The server answers 400
        /// NoDeploymentInEnvironment when there is none. Null compiles the addressed deployment.
        /// </summary>
        public string? Environment { get; set; } = null;
    }
}
