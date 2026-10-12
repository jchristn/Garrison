namespace Garrison.FakeHarness
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using System.Threading.Tasks;
    using Voltaic.Mcp;

    /// <summary>
    /// Asks a <c>--permission-prompt-tool</c> the way Claude Code does (P12.3): the tool is named
    /// mcp__&lt;server&gt;__&lt;tool&gt;, the server comes from the <c>--mcp-config</c> file (URL and headers), and the
    /// call passes tool_name, input, and tool_use_id. Without a prompt tool every request is denied, like Claude Code in
    /// print mode.
    /// </summary>
    public static class FakePermissionPrompt
    {
        #region Public-Methods

        /// <summary>
        /// Ask for permission.
        /// </summary>
        /// <param name="options">Options (prompt tool and MCP config path).</param>
        /// <param name="toolName">Tool that wants to run.</param>
        /// <param name="inputJson">Its input as JSON.</param>
        /// <param name="toolUseId">Tool use identifier.</param>
        /// <returns>The answer; a failure to ask is a denial whose message says why.</returns>
        public static async Task<FakePermissionAnswer> AskAsync(FakeOptions options, string toolName, string inputJson, string toolUseId)
        {
            if (String.IsNullOrEmpty(options.PermissionPromptTool))
            {
                FakePermissionAnswer refused = new FakePermissionAnswer();
                refused.Message = "Claude requested permissions to use " + toolName + ", but you haven't granted it yet.";
                return refused;
            }
            try
            {
                string[] parts = options.PermissionPromptTool.Split("__", 3, StringSplitOptions.None);
                if (parts.Length != 3 || parts[0] != "mcp") throw new ArgumentException("--permission-prompt-tool must be mcp__<server>__<tool>");
                FakeMcpConfig config = JsonSerializer.Deserialize<FakeMcpConfig>(File.ReadAllText(options.McpConfig ?? String.Empty)) ?? new FakeMcpConfig();
                if (config.McpServers == null || !config.McpServers.TryGetValue(parts[1], out FakeMcpServerConfig? server) || String.IsNullOrEmpty(server.Url)) throw new ArgumentException("MCP server " + parts[1] + " is not in --mcp-config");

                Uri uri = new Uri(server.Url);
                string baseUrl = uri.GetLeftPart(UriPartial.Authority);
                string path = String.IsNullOrEmpty(uri.AbsolutePath) || uri.AbsolutePath == "/" ? "/mcp" : uri.AbsolutePath;
                using (McpHttpClient client = new McpHttpClient())
                using (JsonDocument input = JsonDocument.Parse(String.IsNullOrWhiteSpace(inputJson) ? "{}" : inputJson))
                {
                    foreach (KeyValuePair<string, string> header in server.Headers ?? new Dictionary<string, string>()) client.SetRequestHeader(header.Key, Environment.ExpandEnvironmentVariables(header.Value));
                    await client.ConnectStreamableAsync(baseUrl, path).ConfigureAwait(false);
                    Dictionary<string, object?> arguments = new Dictionary<string, object?>();
                    arguments["tool_name"] = toolName;
                    arguments["input"] = input.RootElement.Clone();
                    arguments["tool_use_id"] = toolUseId;
                    FakeToolResult result = await client.CallAsync<FakeToolResult>("tools/call", new { name = parts[2], arguments }, 600000).ConfigureAwait(false);
                    string? text = result?.Content?.FirstOrDefault(c => c.Text != null)?.Text;
                    if (String.IsNullOrEmpty(text)) throw new InvalidOperationException("the permission prompt tool returned nothing");
                    return JsonSerializer.Deserialize<FakePermissionAnswer>(text) ?? throw new InvalidOperationException("unreadable answer: " + text);
                }
            }
            catch (Exception e)
            {
                FakePermissionAnswer failed = new FakePermissionAnswer();
                failed.Message = "The permission prompt tool failed: " + e.Message;
                return failed;
            }
        }

        #endregion
    }
}
