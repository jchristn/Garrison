namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.IO;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Voltaic.Mcp;

    /// <summary>
    /// Deterministic fake agent harness. Reads the prompt from stdin and answers "Echo: " followed by the first 200
    /// characters of the prompt (--echo-chars N changes the length; 0 echoes all of it), in Claude stream-json, Codex JSONL, Mux JSONL, or plain text format, or serves the
    /// Codex app-server JSON-RPC protocol (format codex-app-server).
    /// Usage: garrison-fake-harness --version | --format claude|codex|codex-app-server|mux|plain [--scenario file] [--delay-ms N]
    /// [--fail] [--exit-code N] [--hang] [--large-output N] [--mcp-call url,token,tool,argsjson]
    /// [--output-last-message file] [--stderr text] [--tool-calls N] [--think-ms N] [--answer text]
    /// [--resume-answer text] [--resume sessionId] [--structured-output] [--ignore-sigterm] [--loop-text text]
    /// [--spawn-child pidfile] [--tool-sleep-ms N] [--request-approval] [--session-id id] [resume sessionId] [--report-turns].
    /// [--spawn-child pidfile] [--tool-sleep-ms N] [--request-approval] [--approval-command text]
    /// [--request-file-approval path] [--permission-prompt-tool mcp__server__tool] [--mcp-config file]
    /// [--permission-request Tool=inputJson] [--mcp-invoke server,tool,argsjson] [--events-per-second N] [--duration-ms N]
    /// [--probe "kind target [argument]"] [--probe-prompt] [--probe-timeout-ms N].
    /// Isolation probes (P11.17, see <see cref="FakeProbe"/>): --probe is repeatable, and --probe-prompt also runs every
    /// prompt line that starts with "probe ". Kinds: read path-or-glob, list directory, env NAME[*], proc-env NAME,
    /// connect host:port, http url, marker name text, hold ms. Each result is a tool call and one answer line
    /// PROBE|kind|target|OUTCOME|detail (OUTCOME is ALLOWED, BLOCKED, DONE, or ERROR); details never include contents,
    /// values, or tokens.
    /// </summary>
    public static class Program
    {
        /// <summary>
        /// Version reported by --version.
        /// </summary>
        public static readonly string FakeVersion = "1.0.0";

        /// <summary>
        /// Entry point.
        /// </summary>
        /// <param name="args">Arguments.</param>
        /// <returns>Exit code.</returns>
        public static async Task<int> Main(string[] args)
        {
            if (args.Contains("--mcp-stdio")) return await FakeMcpServer.RunAsync(args).ConfigureAwait(false);
            FakeOptions options = FakeOptions.Parse(args);
            if (options.Version)
            {
                Console.Out.WriteLine("garrison-fake-harness " + FakeVersion);
                return 0;
            }

            PosixSignalRegistration? sigterm = null;
            if (options.IgnoreSigterm && !OperatingSystem.IsWindows())
            {
                // Swallow SIGTERM so only SIGKILL ends the process (tests of the worker's kill path).
                sigterm = PosixSignalRegistration.Create(PosixSignal.SIGTERM, context => context.Cancel = true);
            }
            if (!String.IsNullOrEmpty(options.SpawnChildPidFile)) SpawnChild(options.SpawnChildPidFile);

            if (options.Format == "codex-app-server")
            {
                int code = await new FakeAppServer(options).RunAsync().ConfigureAwait(false);
                GC.KeepAlive(sigterm);
                return code;
            }

            string prompt = Console.IsInputRedirected ? await Console.In.ReadToEndAsync().ConfigureAwait(false) : String.Empty;
            string answer = "Echo: " + (options.EchoChars > 0 && prompt.Length > options.EchoChars ? prompt.Substring(0, options.EchoChars) : prompt).Trim();
            if (!String.IsNullOrEmpty(options.ScenarioFile) && File.Exists(options.ScenarioFile)) answer = File.ReadAllText(options.ScenarioFile).Trim();
            if (options.Answer != null) answer = options.Answer;

            string? sessionDirectory = SessionDirectory();
            string sessionId = Guid.NewGuid().ToString();
            if (!String.IsNullOrEmpty(options.Resume))
            {
                string? sessionFile = SessionFile(sessionDirectory, options.Resume);
                if (sessionFile == null || !File.Exists(sessionFile))
                {
                    Console.Error.WriteLine("No conversation found with session ID: " + options.Resume);
                    return 1;
                }
                sessionId = options.Resume;
                if (options.ResumeAnswer != null) answer = options.ResumeAnswer;
            }
            else if (!String.IsNullOrEmpty(options.SessionId))
            {
                sessionId = options.SessionId;
            }
            SaveTurn(sessionDirectory, sessionId, prompt);
            if (options.ReportTurns) answer = "[turn " + CountTurns(sessionDirectory, sessionId) + "] " + answer;

            FakeEmitter emitter = new FakeEmitter(options, sessionId);
            emitter.Start();

            if (options.Probes.Count > 0 || options.ProbePrompt)
            {
                // Isolation probes (P11.17): each result is a tool call as it finishes and one line of the answer.
                List<string> texts = new List<string>(options.Probes);
                if (options.ProbePrompt) texts.AddRange(FakeProbe.PromptLines(prompt));
                FakeProber prober = new FakeProber();
                prober.TimeoutMs = options.ProbeTimeoutMs;
                List<string> lines = new List<string>();
                foreach (string text in texts)
                {
                    FakeProbeResult result = await prober.RunTextAsync(text, CancellationToken.None).ConfigureAwait(false);
                    emitter.ToolCall("isolation_probe", result.ToLine(), result.Outcome != FakeProbeOutcomeEnum.Error);
                    lines.Add(result.ToLine());
                }
                answer = lines.Count == 0 ? "PROBES|0" : String.Join("\n", lines);
            }

            if (options.Hang)
            {
                Thread.Sleep(Timeout.Infinite);
            }

            if (options.LoopText != null)
            {
                emitter.Loop(answer, options.LoopText.Length == 0 ? " " : options.LoopText);
            }

            emitter.Stream();
            for (int i = 0; i < options.LargeOutputLines; i++) emitter.Filler(i);
            for (int i = 0; i < options.ToolCalls; i++) emitter.ToolCall("fake_tool", "ok " + (i + 1), true);

            foreach (string request in options.PermissionRequests)
            {
                // Claude Code asks its --permission-prompt-tool before running a tool that needs permission (P12.3).
                int equals = request.IndexOf('=');
                string tool = equals > 0 ? request.Substring(0, equals) : request;
                string inputJson = equals > 0 ? request.Substring(equals + 1) : "{}";
                string toolUseId = "toolu_" + Guid.NewGuid().ToString("N").Substring(0, 12);
                using (JsonDocument input = JsonDocument.Parse(String.IsNullOrWhiteSpace(inputJson) ? "{}" : inputJson))
                {
                    emitter.ToolUse(toolUseId, tool, input.RootElement);
                }
                FakePermissionAnswer permission = await FakePermissionPrompt.AskAsync(options, tool, inputJson, toolUseId).ConfigureAwait(false);
                emitter.ToolResult(toolUseId, permission.Allowed ? "ran " + tool : (permission.Message ?? "denied"), permission.Allowed);
                answer = answer + "\npermission " + tool + ": " + (permission.Allowed ? "allow" : "deny");
            }

            if (!String.IsNullOrEmpty(options.McpCall))
            {
                string result;
                bool success = true;
                try
                {
                    result = await CallMcpAsync(options.McpCall).ConfigureAwait(false);
                }
                catch (Exception e)
                {
                    result = "MCP call failed: " + e.Message;
                    success = false;
                }
                emitter.ToolCall(ToolName(options.McpCall), result, success);
                answer = answer + "\nTool result: " + result;
            }

            foreach (string invoke in options.McpInvokes)
            {
                string result;
                bool success = true;
                try
                {
                    result = await InvokeConfiguredMcpAsync(options, invoke).ConfigureAwait(false);
                }
                catch (Exception e)
                {
                    result = "MCP call failed: " + e.Message;
                    success = false;
                }
                emitter.ToolCall(InvokeToolName(invoke), result, success);
                answer = answer + "\nTool result: " + result;
            }

            if (!String.IsNullOrEmpty(options.OutputLastMessage))
            {
                string? directory = Path.GetDirectoryName(Path.GetFullPath(options.OutputLastMessage));
                if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                File.WriteAllText(options.OutputLastMessage, answer);
            }

            emitter.Finish(answer, options.Fail);
            GC.KeepAlive(sigterm);
            if (!String.IsNullOrEmpty(options.Stderr)) Console.Error.WriteLine(options.Stderr);
            if (options.ExitCode.HasValue) return options.ExitCode.Value;
            return options.Fail ? 1 : 0;
        }

        private static void SpawnChild(string pidFile)
        {
            ProcessStartInfo info = new ProcessStartInfo("sleep");
            info.ArgumentList.Add("600");
            info.UseShellExecute = false;
            info.RedirectStandardInput = true;
            using (Process? child = Process.Start(info))
            {
                if (child == null) return;
                File.WriteAllText(pidFile, child.Id.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }
        }

        private static string? SessionDirectory()
        {
            string? home = Environment.GetEnvironmentVariable("HOME");
            if (String.IsNullOrEmpty(home)) home = Environment.GetEnvironmentVariable("USERPROFILE");
            if (String.IsNullOrEmpty(home)) return null;
            return Path.Combine(home, ".garrison-fake", "sessions");
        }

        private static string? SessionFile(string? directory, string sessionId)
        {
            if (directory == null || sessionId.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0 || sessionId.Contains("..", StringComparison.Ordinal)) return null;
            return Path.Combine(directory, sessionId + ".txt");
        }

        /// <summary>
        /// Number of turns recorded in a session file, or 1 when it cannot be read.
        /// </summary>
        /// <param name="directory">Session directory.</param>
        /// <param name="sessionId">Session identifier.</param>
        /// <returns>Turns.</returns>
        internal static int CountTurns(string? directory, string sessionId)
        {
            string? file = SessionFile(directory, sessionId);
            if (file == null || !File.Exists(file)) return 1;
            try
            {
                int turns = File.ReadAllLines(file).Count(l => l.StartsWith("--- turn ", StringComparison.Ordinal));
                return Math.Max(1, turns);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                return 1;
            }
        }

        private static void SaveTurn(string? directory, string sessionId, string prompt)
        {
            string? file = SessionFile(directory, sessionId);
            if (directory == null || file == null) return;
            try
            {
                Directory.CreateDirectory(directory);
                File.AppendAllText(file, "--- turn " + DateTime.UtcNow.ToString("o") + Environment.NewLine + prompt + Environment.NewLine);
            }
            catch (Exception e) when (e is IOException || e is UnauthorizedAccessException)
            {
                Console.Error.WriteLine("Could not record the session: " + e.Message);
            }
        }

        private static string ToolName(string spec)
        {
            string[] parts = spec.Split(',', 4);
            return parts.Length >= 3 ? parts[2] : "tool";
        }

        private static string InvokeToolName(string spec)
        {
            string[] parts = spec.Split(',', 3);
            return parts.Length >= 2 ? "mcp__" + parts[0] + "__" + parts[1] : "tool";
        }

        private static async Task<string> InvokeConfiguredMcpAsync(FakeOptions options, string spec)
        {
            string[] parts = spec.Split(',', 3);
            if (parts.Length < 2) throw new ArgumentException("--mcp-invoke expects server,tool[,argsjson]");
            string argsJson = parts.Length == 3 ? parts[2] : "{}";
            FakeMcpConfig config = JsonSerializer.Deserialize<FakeMcpConfig>(File.ReadAllText(options.McpConfig ?? String.Empty)) ?? new FakeMcpConfig();
            if (config.McpServers == null || !config.McpServers.TryGetValue(parts[0], out FakeMcpServerConfig? server) || String.IsNullOrEmpty(server.Url)) throw new ArgumentException("MCP server " + parts[0] + " is not in --mcp-config");

            Uri uri = new Uri(server.Url);
            string baseUrl = uri.GetLeftPart(UriPartial.Authority);
            string path = String.IsNullOrEmpty(uri.AbsolutePath) || uri.AbsolutePath == "/" ? "/mcp" : uri.AbsolutePath;
            using (McpHttpClient client = new McpHttpClient())
            using (JsonDocument arguments = JsonDocument.Parse(argsJson))
            {
                foreach (KeyValuePair<string, string> header in server.Headers ?? new Dictionary<string, string>()) client.SetRequestHeader(header.Key, Environment.ExpandEnvironmentVariables(header.Value));
                await client.ConnectStreamableAsync(baseUrl, path).ConfigureAwait(false);
                FakeToolResult result = await client.CallAsync<FakeToolResult>("tools/call", new { name = parts[1], arguments = arguments.RootElement }, 600000).ConfigureAwait(false);
                string? text = result?.Content?.FirstOrDefault(c => c.Text != null)?.Text;
                return text ?? String.Empty;
            }
        }

        private static async Task<string> CallMcpAsync(string spec)
        {
            string[] parts = spec.Split(',', 4);
            if (parts.Length < 3) throw new ArgumentException("--mcp-call expects url,token,tool[,argsjson]");
            string url = parts[0];
            string token = parts[1];
            string tool = parts[2];
            string argsJson = parts.Length == 4 ? parts[3] : "{}";

            Uri uri = new Uri(url);
            string baseUrl = uri.GetLeftPart(UriPartial.Authority);
            string path = String.IsNullOrEmpty(uri.AbsolutePath) || uri.AbsolutePath == "/" ? "/mcp" : uri.AbsolutePath;

            using (McpHttpClient client = new McpHttpClient())
            {
                if (!String.IsNullOrEmpty(token)) client.SetRequestHeader("Authorization", "Bearer " + token);
                await client.ConnectStreamableAsync(baseUrl, path).ConfigureAwait(false);
                using (JsonDocument arguments = JsonDocument.Parse(argsJson))
                {
                    JsonElement result = await client.CallAsync<JsonElement>("tools/call", new { name = tool, arguments = arguments.RootElement }, 120000).ConfigureAwait(false);
                    if (result.ValueKind == JsonValueKind.Object && result.TryGetProperty("content", out JsonElement content) && content.ValueKind == JsonValueKind.Array)
                    {
                        foreach (JsonElement part in content.EnumerateArray())
                        {
                            if (part.TryGetProperty("text", out JsonElement text) && text.ValueKind == JsonValueKind.String) return text.GetString() ?? String.Empty;
                        }
                    }
                    return result.GetRawText();
                }
            }
        }
    }
}
