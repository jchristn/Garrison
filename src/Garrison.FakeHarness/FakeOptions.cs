namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;

    /// <summary>
    /// Parsed command-line options. Unknown arguments are ignored so harness profiles can pass extra flags.
    /// </summary>
    public class FakeOptions
    {
        #region Public-Members

        /// <summary>
        /// Output format: claude, codex, codex-app-server (JSON-RPC over stdin and stdout, see
        /// <see cref="FakeAppServer"/>), mux, or plain. Default plain.
        /// </summary>
        public string Format { get; set; } = "plain";

        /// <summary>
        /// Whether to print the version and exit.
        /// </summary>
        public bool Version { get; set; } = false;

        /// <summary>
        /// Optional scenario file whose contents replace the answer text.
        /// </summary>
        public string? ScenarioFile { get; set; } = null;

        /// <summary>
        /// Delay between emitted events in milliseconds.
        /// </summary>
        public int DelayMs { get; set; } = 0;

        /// <summary>
        /// Whether to report failure.
        /// </summary>
        public bool Fail { get; set; } = false;

        /// <summary>
        /// Exit code override.
        /// </summary>
        public int? ExitCode { get; set; } = null;

        /// <summary>
        /// Whether to hang after the first event until killed.
        /// </summary>
        public bool Hang { get; set; } = false;

        /// <summary>
        /// Number of 100-character filler lines to emit before the answer.
        /// </summary>
        public int LargeOutputLines { get; set; } = 0;

        /// <summary>
        /// MCP call specification: url,token,tool,argsjson.
        /// </summary>
        public string? McpCall { get; set; } = null;

        /// <summary>
        /// File to write the final answer to (mirrors --output-last-message).
        /// </summary>
        public string? OutputLastMessage { get; set; } = null;

        /// <summary>
        /// Text written to stderr before exiting.
        /// </summary>
        public string? Stderr { get; set; } = null;

        /// <summary>
        /// Number of fake tool calls (each with a successful result) to emit before the answer. Default 0.
        /// </summary>
        public int ToolCalls { get; set; } = 0;

        /// <summary>
        /// Pause in milliseconds between the thinking event and the first answer chunk, so a run always has a
        /// measurable streaming time. Minimum 0, default 20.
        /// </summary>
        public int ThinkMs { get; set; } = 20;

        /// <summary>
        /// Answer text used instead of the echo (for example a JSON document). Null keeps the echo.
        /// </summary>
        public string? Answer { get; set; } = null;

        /// <summary>
        /// Answer text used when a session is resumed with --resume. Null falls back to <see cref="Answer"/>.
        /// </summary>
        public string? ResumeAnswer { get; set; } = null;

        /// <summary>
        /// Session to resume. The fake harness keeps each session as a file under $HOME/.garrison-fake/sessions, so a
        /// resume only works in the same home directory, like a real CLI. An unknown session fails with exit code 1.
        /// </summary>
        public string? Resume { get; set; } = null;

        /// <summary>
        /// Session identifier for a new session, the way Mux names one with --session-id. Ignored when resuming. Null
        /// generates a random identifier.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Prefix the answer with "[turn N] ", where N counts the turns recorded in the session (1 for a new session), so
        /// tests can tell a resumed conversation from a fresh one. Default false.
        /// </summary>
        public bool ReportTurns { get; set; } = false;

        /// <summary>
        /// Whether the Claude format result event also carries the answer as structured_output when it parses as
        /// JSON, the way Claude Code reports output produced with --json-schema. Default false.
        /// </summary>
        public bool StructuredOutput { get; set; } = false;

        /// <summary>
        /// Ignore SIGTERM, so only SIGKILL stops the process. Used to prove the worker's kill path. Default false.
        /// </summary>
        public bool IgnoreSigterm { get; set; } = false;

        /// <summary>
        /// After the thinking event and the answer, emit this text as assistant text deltas forever (a degenerate
        /// generation loop like the gpt-oss "* \n" loop). The escapes \n, \r, and \t are expanded. Null turns it off.
        /// </summary>
        public string? LoopText { get; set; } = null;

        /// <summary>
        /// Start a long-lived child process (sleep 600) and write its process identifier to this file, so tests can
        /// check that stopping the harness also stops its children. Null turns it off. Unix only.
        /// </summary>
        public string? SpawnChildPidFile { get; set; } = null;

        /// <summary>
        /// Milliseconds each fake tool call (--tool-calls) runs between its call and its result. Default 0.
        /// </summary>
        public int ToolSleepMs { get; set; } = 0;

        /// <summary>
        /// In codex-app-server format, ask the client to approve a command (an
        /// <c>item/commandExecution/requestApproval</c> request) before answering, and report the decision as a
        /// command item (declined unless the client accepts). Default false.
        /// </summary>
        public bool RequestApproval { get; set; } = false;

        /// <summary>
        /// Command named in the codex-app-server approval request (--request-approval). Default rm -rf build.
        /// </summary>
        public string ApprovalCommand { get; set; } = "rm -rf build";

        /// <summary>
        /// In codex-app-server format, also ask to approve a file change of this path (an
        /// <c>item/fileChange/requestApproval</c> request after an item/started fileChange item), or null.
        /// </summary>
        public string? RequestFileApproval { get; set; } = null;

        /// <summary>
        /// Claude Code's --permission-prompt-tool (mcp__server__tool), or null. In Claude format, each
        /// --permission-request is asked through it.
        /// </summary>
        public string? PermissionPromptTool { get; set; } = null;

        /// <summary>
        /// Claude Code's --mcp-config file, read to find the permission prompt tool's server, or null.
        /// </summary>
        public string? McpConfig { get; set; } = null;

        /// <summary>
        /// Tool calls that need permission, as Tool=inputJson (repeatable), for example Bash={"command":"git push"}. Each
        /// is emitted as a tool call whose result is the permission answer.
        /// </summary>
        public List<string> PermissionRequests { get; set; } = new List<string>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse arguments.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Options.</returns>
        public static FakeOptions Parse(string[] args)
        {
            FakeOptions options = new FakeOptions();
            for (int i = 0; i < args.Length; i++)
            {
                string arg = args[i];
                string? next = i + 1 < args.Length ? args[i + 1] : null;
                switch (arg)
                {
                    case "--version":
                        options.Version = true;
                        break;
                    case "--format":
                        if (next != null) { options.Format = next.ToLowerInvariant(); i++; }
                        break;
                    case "--scenario":
                        if (next != null) { options.ScenarioFile = next; i++; }
                        break;
                    case "--delay-ms":
                        if (next != null) { options.DelayMs = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--fail":
                        options.Fail = true;
                        break;
                    case "--exit-code":
                        if (next != null) { options.ExitCode = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--hang":
                        options.Hang = true;
                        break;
                    case "--large-output":
                        if (next != null) { options.LargeOutputLines = Int32.Parse(next, CultureInfo.InvariantCulture); i++; }
                        break;
                    case "--mcp-call":
                        if (next != null) { options.McpCall = next; i++; }
                        break;
                    case "--output-last-message":
                        if (next != null) { options.OutputLastMessage = next; i++; }
                        break;
                    case "--tool-calls":
                        if (next != null) { options.ToolCalls = Math.Max(0, Int32.Parse(next, CultureInfo.InvariantCulture)); i++; }
                        break;
                    case "--think-ms":
                        if (next != null) { options.ThinkMs = Math.Max(0, Int32.Parse(next, CultureInfo.InvariantCulture)); i++; }
                        break;
                    case "--answer":
                        if (next != null) { options.Answer = next; i++; }
                        break;
                    case "--resume-answer":
                        if (next != null) { options.ResumeAnswer = next; i++; }
                        break;
                    case "--resume":
                        if (next != null) { options.Resume = next; i++; }
                        break;
                    case "resume":
                        // Codex style: codex exec [options] resume <session> -
                        if (next != null && !next.StartsWith("-", StringComparison.Ordinal)) { options.Resume = next; i++; }
                        break;
                    case "--session-id":
                        if (next != null) { options.SessionId = next; i++; }
                        break;
                    case "--report-turns":
                        options.ReportTurns = true;
                        break;
                    case "--structured-output":
                        options.StructuredOutput = true;
                        break;
                    case "--ignore-sigterm":
                        options.IgnoreSigterm = true;
                        break;
                    case "--loop-text":
                        if (next != null) { options.LoopText = Unescape(next); i++; }
                        break;
                    case "--spawn-child":
                        if (next != null) { options.SpawnChildPidFile = next; i++; }
                        break;
                    case "--tool-sleep-ms":
                        if (next != null) { options.ToolSleepMs = Math.Max(0, Int32.Parse(next, CultureInfo.InvariantCulture)); i++; }
                        break;
                    case "--request-approval":
                        options.RequestApproval = true;
                        break;
                    case "--approval-command":
                        if (next != null) { options.ApprovalCommand = next; i++; }
                        break;
                    case "--request-file-approval":
                        if (next != null) { options.RequestFileApproval = next; i++; }
                        break;
                    case "--permission-prompt-tool":
                        if (next != null) { options.PermissionPromptTool = next; i++; }
                        break;
                    case "--mcp-config":
                        if (next != null) { options.McpConfig = next; i++; }
                        break;
                    case "--permission-request":
                        if (next != null) { options.PermissionRequests.Add(next); i++; }
                        break;
                    case "--stderr":
                        if (next != null) { options.Stderr = next; i++; }
                        break;
                    default:
                        break;
                }
            }
            return options;
        }

        #endregion

        #region Private-Methods

        private static string Unescape(string value)
        {
            return value.Replace("\\n", "\n", StringComparison.Ordinal).Replace("\\r", "\r", StringComparison.Ordinal).Replace("\\t", "\t", StringComparison.Ordinal);
        }

        #endregion
    }
}
