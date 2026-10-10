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
    /// [--output-last-message file] [--stderr text].
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

            FakeEmitter emitter = new FakeEmitter(options);
            emitter.Start();

            if (options.Hang)
            {
                Thread.Sleep(Timeout.Infinite);
            }

            for (int i = 0; i < options.LargeOutputLines; i++) emitter.Filler(i);

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
