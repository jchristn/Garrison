namespace Garrison.Sdk.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Fully resolved instructions for one harness invocation. Compiled by the control plane and sent to the worker with the lease; the worker never renders templates or reads the database.
    /// Directory contract: the compiler emits the tokens in ExecutionPlaceholders ($GARRISON_CONFIG_DIR,
    /// $GARRISON_WORKSPACE_DIR, $GARRISON_HOME_DIR) and the worker replaces them with its per-run absolute paths in
    /// Executable, Arguments, Environment values, Files paths and content, Stdin, and McpPreflight before launch.
    /// </summary>
    public class ExecutionSpec
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Harness type.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Executable.
        /// </summary>
        public string Executable { get; set; } = String.Empty;

        /// <summary>
        /// Final argument list, passed with ArgumentList and never through a shell.
        /// </summary>
        public List<string> Arguments { get; set; } = new List<string>();

        /// <summary>
        /// Environment variables added to the allowlisted base environment.
        /// </summary>
        public List<ExecutionEnvironmentVariable> Environment { get; set; } = new List<ExecutionEnvironmentVariable>();

        /// <summary>
        /// Files to materialize.
        /// </summary>
        public List<ExecutionFile> Files { get; set; } = new List<ExecutionFile>();

        /// <summary>
        /// Text written to stdin before it is closed. Null closes stdin immediately.
        /// </summary>
        public string? Stdin { get; set; } = null;

        /// <summary>
        /// Workspace preparation.
        /// </summary>
        public ExecutionWorkspace Workspace { get; set; } = new ExecutionWorkspace();

        /// <summary>
        /// Output parser.
        /// </summary>
        public OutputParserEnum Parser { get; set; } = OutputParserEnum.PlainText;

        /// <summary>
        /// Generic parser options.
        /// </summary>
        public ExecutionParserOptions ParserOptions { get; set; } = new ExecutionParserOptions();

        /// <summary>
        /// Result source.
        /// </summary>
        public ResultSourceEnum ResultSource { get; set; } = ResultSourceEnum.ParserFinalEvent;

        /// <summary>
        /// Result file name in the config directory, for LastMessageFile.
        /// </summary>
        public string? ResultFileName { get; set; } = null;

        /// <summary>
        /// Success policy.
        /// </summary>
        public SuccessPolicyEnum SuccessPolicy { get; set; } = SuccessPolicyEnum.FinalEvent;

        /// <summary>
        /// Successful exit codes.
        /// </summary>
        public List<int> SuccessExitCodes { get; set; } = new List<int> { 0 };

        /// <summary>
        /// Deadline in seconds from start.
        /// </summary>
        public int TimeoutSeconds { get; set; } = 1800;

        /// <summary>
        /// Seconds between graceful stop and process tree kill.
        /// </summary>
        public int KillGraceSeconds { get; set; } = 5;

        /// <summary>
        /// Maximum stdout bytes.
        /// </summary>
        public long MaxOutputBytes { get; set; } = 67108864;

        /// <summary>
        /// Retained stderr tail bytes.
        /// </summary>
        public int StderrTailBytes { get; set; } = 8000;

        /// <summary>
        /// Whether the run gets its own HOME directory.
        /// </summary>
        public bool IsolateHome { get; set; } = true;

        /// <summary>
        /// MCP pre-flight checks.
        /// </summary>
        public List<ExecutionMcpCheck> McpPreflight { get; set; } = new List<ExecutionMcpCheck>();

        /// <summary>
        /// Values to redact from stderr, events, and logs.
        /// </summary>
        public List<string> ScrubValues { get; set; } = new List<string>();

        /// <summary>
        /// W3C traceparent for span correlation.
        /// </summary>
        public string? TraceParent { get; set; } = null;
    }
}
