namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Fully resolved instructions for one harness invocation. Compiled by the control plane and sent to the worker with the lease; the worker never renders templates or reads the database.
    /// Directory contract: the compiler emits the tokens in <see cref="ExecutionPlaceholders"/> ($GARRISON_CONFIG_DIR,
    /// $GARRISON_WORKSPACE_DIR, $GARRISON_HOME_DIR) and the worker replaces them with its per-run absolute paths in
    /// Executable, Arguments, Environment values, Files paths and content, Stdin, and McpPreflight before launch.
    /// </summary>
    public class ExecutionSpec
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>Nondefault admission-time capabilities required by this run. Null preserves legacy execution.</summary>
        public Garrison.Core.Models.ExecutorRequirements? RequiredCapabilities { get; set; } = null;

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
        /// Deployment name, used as the deployment label on worker metrics. Empty when the control plane did not send it.
        /// </summary>
        public string DeploymentName { get; set; } = String.Empty;

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
        /// Text written to stdin before it is closed. Null closes stdin immediately. When <see cref="AppServer"/> is
        /// set, this is the prompt the worker sends as the turn input over the app-server protocol instead.
        /// </summary>
        public string? Stdin { get; set; } = null;

        /// <summary>
        /// Codex app-server session settings when the profile delivers the prompt with <c>CodexAppServer</c>; the
        /// worker then keeps stdin open and drives the harness over JSON-RPC. Null for every other delivery mode.
        /// </summary>
        public ExecutionAppServer? AppServer { get; set; } = null;

        /// <summary>
        /// Conversation settings when the run is a conversation turn on the Process executor: the worker then uses the
        /// conversation's directories instead of per-run ones. Null otherwise.
        /// </summary>
        public ExecutionConversation? Conversation { get; set; } = null;

        /// <summary>
        /// Where the worker relays permission requests the harness raises over its own protocol (Codex app-server
        /// approvals, P12.3), or null when the deployment has approvals off or the harness asks Garrison directly (Claude
        /// Code calls garrison_permission_prompt itself).
        /// </summary>
        public ExecutionApprovalRelay? ApprovalRelay { get; set; } = null;

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
        /// Run guard: stop the run with outcome RepetitionDetected when the most recent assistant text degenerates into
        /// one short repeated unit or into text with no letters or digits. From the deployment's repetitionGuard, else
        /// the cluster setting Runtime.RepetitionGuard. Default true.
        /// </summary>
        public bool RepetitionGuard { get; set; } = true;

        /// <summary>
        /// Run guard: most characters of assistant text before the run stops with outcome OutputLimitExceeded. 0 turns
        /// the limit off. From the deployment's maxAssistantChars, else the cluster setting Runtime.MaxAssistantChars.
        /// Default 200,000.
        /// </summary>
        public long MaxAssistantChars { get; set; } = 200000;

        /// <summary>
        /// Run guard: seconds without assistant text, thinking, tool call, or tool result (while no tool call is open)
        /// before the run stops with outcome NoProgress. 0 turns the guard off. From the deployment's
        /// noProgressSeconds, else the cluster setting Runtime.NoProgressSeconds. Default 300.
        /// </summary>
        public int NoProgressSeconds { get; set; } = 300;

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

        /// <summary>
        /// Whether the worker keeps the run's work, home, and config directories after a successful execution, because
        /// the control plane may answer the completion report with a structured output repair that resumes the
        /// harness session in the same directories. Set when the agent has an output schema and the harness profile
        /// supports resume. The worker applies workspace retention once the run is finally reported. Default false.
        /// </summary>
        public bool RetainForRepair { get; set; } = false;

        /// <summary>
        /// Structured output repair attempt this spec runs: 0 for the original execution, 1 for the repair. A repair
        /// reuses the directories of the original execution and skips workspace preparation. Default 0.
        /// </summary>
        public int RepairAttempt { get; set; } = 0;

        /// <summary>
        /// Executor the run needs (from the run, resolved at creation). The worker runs Process specs as a subprocess and
        /// KubernetesJob specs in a Job per run (plan D-033). Default Process.
        /// </summary>
        public RunExecutorEnum Executor { get; set; } = RunExecutorEnum.Process;

        /// <summary>
        /// Run pod resource requests and limits from the deployment, for KubernetesJob runs; null when the deployment
        /// sets none or the run is a Process run. Unset values fall back to the worker's defaults.
        /// </summary>
        public RunPodResources? PodResources { get; set; } = null;
    }
}
