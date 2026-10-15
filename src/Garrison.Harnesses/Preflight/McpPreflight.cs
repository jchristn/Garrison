namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Security;
    using Voltaic.Mcp;

    /// <summary>
    /// Verifies MCP servers before a harness launches: connects over streamable HTTP with the resolved headers, lists
    /// tools (following pagination), and checks that required tools are present. Claude Code, Gemini CLI, and Mux
    /// fail MCP authentication silently, so this check turns a silent failure into McpPreflightFailed. Thread-safe.
    /// </summary>
    public class McpPreflight
    {
        #region Public-Members

        /// <summary>
        /// Per-server timeout in milliseconds. Minimum 1000, maximum 300000, default 20000.
        /// </summary>
        public int TimeoutMs
        {
            get
            {
                return _TimeoutMs;
            }
            set
            {
                _TimeoutMs = Math.Clamp(value, 1000, 300000);
            }
        }

        /// <summary>
        /// Maximum tools/list pages followed. Minimum 1, maximum 1000, default 50.
        /// </summary>
        public int MaxPages
        {
            get
            {
                return _MaxPages;
            }
            set
            {
                _MaxPages = Math.Clamp(value, 1, 1000);
            }
        }

        #endregion

        #region Private-Members

        private int _TimeoutMs = 20000;
        private int _MaxPages = 50;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Run every check.
        /// </summary>
        /// <param name="checks">Checks.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Result.</returns>
        public async Task<McpPreflightResult> CheckAsync(IEnumerable<ExecutionMcpCheck>? checks, CancellationToken token = default)
        {
            McpPreflightResult result = new McpPreflightResult();
            if (checks == null) return result;

            foreach (ExecutionMcpCheck check in checks)
            {
                token.ThrowIfCancellationRequested();
                string? problem = await CheckOneAsync(check, token).ConfigureAwait(false);
                if (problem == null) continue;
                if (check.Required)
                {
                    result.Success = false;
                    result.Message = problem;
                    return result;
                }
                result.Warnings.Add(problem);
            }
            return result;
        }

        /// <summary>
        /// List the tools exposed by one server.
        /// </summary>
        /// <param name="check">Server to query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tool names.</returns>
        /// <exception cref="ArgumentNullException">Thrown when check is null.</exception>
        public async Task<List<string>> ListToolsAsync(ExecutionMcpCheck check, CancellationToken token = default)
        {
            if (check == null) throw new ArgumentNullException(nameof(check));
            List<string> tools = new List<string>();
            using (CancellationTokenSource timeout = new CancellationTokenSource(_TimeoutMs))
            using (CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(token, timeout.Token))
            // A tenant chooses this URL: connect only to addresses the outbound policy allows, never follow redirects (SR-07).
            using (McpHttpClient client = new McpHttpClient(OutboundAddressPolicy.CreateHandler(), true))
            {
                foreach (ExecutionEnvironmentVariable header in check.Headers) client.SetRequestHeader(header.Name, header.Value);
                bool connected = await client.ConnectStreamableAsync(check.Url.TrimEnd('/'), String.IsNullOrEmpty(check.Path) ? "/mcp" : check.Path, linked.Token).ConfigureAwait(false);
                if (!connected) throw new InvalidOperationException("could not connect");

                string? cursor = null;
                for (int page = 0; page < _MaxPages; page++)
                {
                    JsonElement response = await client.CallAsync<JsonElement>("tools/list", cursor == null ? new { } : (object)new { cursor }, _TimeoutMs, linked.Token).ConfigureAwait(false);
                    if (response.ValueKind == JsonValueKind.Object && response.TryGetProperty("tools", out JsonElement list) && list.ValueKind == JsonValueKind.Array)
                    {
                        foreach (JsonElement tool in list.EnumerateArray())
                        {
                            if (tool.TryGetProperty("name", out JsonElement name) && name.ValueKind == JsonValueKind.String) tools.Add(name.GetString()!);
                        }
                    }
                    cursor = response.ValueKind == JsonValueKind.Object && response.TryGetProperty("nextCursor", out JsonElement next) && next.ValueKind == JsonValueKind.String ? next.GetString() : null;
                    if (String.IsNullOrEmpty(cursor)) break;
                }
            }
            return tools;
        }

        #endregion

        #region Private-Methods

        private async Task<string?> CheckOneAsync(ExecutionMcpCheck check, CancellationToken token)
        {
            List<string> tools;
            try
            {
                tools = await ListToolsAsync(check, token).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (!token.IsCancellationRequested)
            {
                return "MCP server '" + check.Name + "' did not answer tools/list within " + _TimeoutMs + " ms.";
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                return "MCP server '" + check.Name + "' at " + check.Url + " failed pre-flight: " + e.Message;
            }

            List<string> missing = check.RequiredTools.Where(t => !tools.Contains(t, StringComparer.Ordinal)).ToList();
            if (missing.Count > 0) return "MCP server '" + check.Name + "' is missing required tools: " + String.Join(", ", missing) + ".";
            return null;
        }

        #endregion
    }
}
