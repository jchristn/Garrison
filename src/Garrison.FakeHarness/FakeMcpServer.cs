namespace Garrison.FakeHarness
{
    using System;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Voltaic.Core;
    using Voltaic.Mcp;

    /// <summary>Credential-free deterministic stdio MCP fixture. Never executes tools.</summary>
    public static class FakeMcpServer
    {
        /// <summary>Serve initialize and two tools/list pages until stdin closes.</summary>
        /// <param name="args">Fixture flags: --stdio-hang, --stdio-malformed, --stdio-cycle, --stdio-env, --stdio-describe (tools carry a description and input schema), --stdio-single (one page with fixture_echo only).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Exit code.</returns>
        public static async Task<int> RunAsync(string[] args, CancellationToken token = default)
        {
            int pages = 0;
            while (true)
            {
                string? line = await Console.In.ReadLineAsync(token).ConfigureAwait(false);
                if (line == null) return 0;
                JsonRpcRequest? request = JsonSerializer.Deserialize<JsonRpcRequest>(line);
                if (request == null || request.Id == null) continue;
                if (args.Contains("--stdio-hang")) { await Task.Delay(Timeout.Infinite, token).ConfigureAwait(false); return 0; }
                if (args.Contains("--stdio-malformed")) { await Console.Out.WriteLineAsync("not-json").ConfigureAwait(false); continue; }
                object result;
                if (request.Method == "initialize") result = new { protocolVersion = McpProtocol.LatestProtocolVersion, capabilities = new { tools = new { } }, serverInfo = new { name = "fixture", version = "1" } };
                else if (request.Method == "tools/list")
                {
                    pages++;
                    if (args.Contains("--stdio-env") && (Environment.GetEnvironmentVariable("MCP_FIXTURE_SECRET") != "fixture-private-value" || Environment.GetEnvironmentVariable("GARRISON_WORKER_SECRET_KEY") != null))
                    {
                        await Console.Error.WriteLineAsync("fixture-private-value").ConfigureAwait(false);
                        await Console.Out.WriteLineAsync(JsonSerializer.Serialize(new JsonRpcResponse { Id = request.Id, Error = new JsonRpcError { Code = -32603, Message = "fixture-private-value" } })).ConfigureAwait(false);
                        continue;
                    }
                    if (args.Contains("--stdio-single")) result = new { tools = new[] { new { name = "fixture_echo" } } };
                    else if (args.Contains("--stdio-describe") && pages == 1) result = new { tools = new[] { new { name = "fixture_echo", description = "Echoes the text it is given.", inputSchema = new { type = "object", properties = new { text = new { type = "string" } }, required = new[] { "text" } } } }, nextCursor = "page-two" };
                    else if (pages == 1 || args.Contains("--stdio-cycle")) result = new { tools = new[] { new { name = "fixture_echo" } }, nextCursor = "page-two" };
                    else result = new { tools = new[] { new { name = "fixture_status" } } };
                }
                else result = new { };
                await Console.Out.WriteLineAsync(JsonSerializer.Serialize(new JsonRpcResponse { Id = request.Id, Result = result })).ConfigureAwait(false);
                await Console.Out.FlushAsync(token).ConfigureAwait(false);
            }
        }
    }
}
