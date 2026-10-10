namespace Garrison.FakeHarness
{
    using System;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Voltaic.Mcp;

    /// <summary>
    /// Deterministic fake agent harness. Reads the prompt from stdin and answers "Echo: " followed by the first 200
    /// characters of the prompt, in Claude stream-json, Codex JSONL, Mux JSONL, or plain text format.
    /// Usage: garrison-fake-harness --version | --format claude|codex|mux|plain [--scenario file] [--delay-ms N]
    /// [--fail] [--exit-code N] [--hang] [--large-output N] [--mcp-call url,token,tool,argsjson]
    /// [--output-last-message file] [--stderr text] [--tool-calls N] [--think-ms N] [--answer text]
    /// [--resume-answer text] [--resume sessionId] [--structured-output].
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
            FakeOptions options = FakeOptions.Parse(args);
            if (options.Version)
            {
                Console.Out.WriteLine("garrison-fake-harness " + FakeVersion);
                return 0;
            }

            string prompt = Console.IsInputRedirected ? await Console.In.ReadToEndAsync().ConfigureAwait(false) : String.Empty;
            string answer = "Echo: " + (prompt.Length > 200 ? prompt.Substring(0, 200) : prompt).Trim();
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
            SaveTurn(sessionDirectory, sessionId, prompt);

            FakeEmitter emitter = new FakeEmitter(options, sessionId);
            emitter.Start();

            if (options.Hang)
            {
                Thread.Sleep(Timeout.Infinite);
            }

            for (int i = 0; i < options.LargeOutputLines; i++) emitter.Filler(i);
            for (int i = 0; i < options.ToolCalls; i++) emitter.ToolCall("fake_tool", "ok " + (i + 1), true);

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

            if (!String.IsNullOrEmpty(options.OutputLastMessage))
            {
                string? directory = Path.GetDirectoryName(Path.GetFullPath(options.OutputLastMessage));
                if (!String.IsNullOrEmpty(directory)) Directory.CreateDirectory(directory);
                File.WriteAllText(options.OutputLastMessage, answer);
            }

            emitter.Finish(answer, options.Fail);
            if (!String.IsNullOrEmpty(options.Stderr)) Console.Error.WriteLine(options.Stderr);
            if (options.ExitCode.HasValue) return options.ExitCode.Value;
            return options.Fail ? 1 : 0;
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
