namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Options for the invocation compiler.
    /// </summary>
    public class CompilerOptions
    {
        /// <summary>
        /// Base URL of the Garrison MCP server as reachable from worker nodes, without the path, for example
        /// http://garrison-server:8701.
        /// </summary>
        public string McpBaseUrl { get; set; } = "http://127.0.0.1:8701";

        /// <summary>
        /// MCP path. Default /mcp.
        /// </summary>
        public string McpPath { get; set; } = "/mcp";

        /// <summary>
        /// Base URL of the Garrison REST API as reachable from worker nodes.
        /// </summary>
        public string ApiBaseUrl { get; set; } = "http://127.0.0.1:8700";

        /// <summary>
        /// Default run timeout in seconds when neither the deployment nor the profile sets one (cluster setting
        /// Runs.DefaultTimeoutSeconds). Minimum 5, maximum 86,400, default 1,800.
        /// </summary>
        public int DefaultTimeoutSeconds
        {
            get
            {
                return _DefaultTimeoutSeconds;
            }
            set
            {
                _DefaultTimeoutSeconds = Math.Clamp(value, 5, 86400);
            }
        }

        /// <summary>
        /// Cluster cap on any run's deadline, in seconds (cluster setting Runtime.MaxRunSeconds). Every compiled run's
        /// timeout is the smaller of its own timeout (deployment, per-run timeoutSeconds override, or profile default)
        /// and this cap. Minimum 60, maximum 604,800, default 3,600.
        /// </summary>
        public int MaxRunSeconds
        {
            get
            {
                return _MaxRunSeconds;
            }
            set
            {
                _MaxRunSeconds = Math.Clamp(value, 60, 604800);
            }
        }

        /// <summary>
        /// Repetition guard default for deployments that do not set repetitionGuard (cluster setting
        /// Runtime.RepetitionGuard). Default true.
        /// </summary>
        public bool RepetitionGuard { get; set; } = true;

        /// <summary>
        /// Assistant text limit default for deployments that do not set maxAssistantChars (cluster setting
        /// Runtime.MaxAssistantChars). 0 turns the limit off. Minimum 0, maximum 100,000,000, default 200,000.
        /// </summary>
        public long MaxAssistantChars
        {
            get
            {
                return _MaxAssistantChars;
            }
            set
            {
                _MaxAssistantChars = Math.Clamp(value, 0, 100000000);
            }
        }

        /// <summary>
        /// No-progress limit default for deployments that do not set noProgressSeconds (cluster setting
        /// Runtime.NoProgressSeconds). 0 turns the guard off. Minimum 0, maximum 86,400, default 300.
        /// </summary>
        public int NoProgressSeconds
        {
            get
            {
                return _NoProgressSeconds;
            }
            set
            {
                _NoProgressSeconds = Math.Clamp(value, 0, 86400);
            }
        }

        private int _DefaultTimeoutSeconds = 1800;
        private int _MaxRunSeconds = 3600;
        private long _MaxAssistantChars = 200000;
        private int _NoProgressSeconds = 300;
    }
}
