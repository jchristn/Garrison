namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using McpHttpClient = Voltaic.Mcp.McpHttpClient;

    /// <summary>
    /// Lists the tools of an HTTP MCP server: initialize, then tools/list page by page, without calling any tool. Used by
    /// the connection test route and by the capability catalog refresh (AD4.3). Connects only to addresses the outbound
    /// policy allows and never follows redirects (SR-07). Thread-safe.
    /// </summary>
    public class McpToolListingService
    {
        #region Public-Members

        /// <summary>
        /// Most tools/list pages read. Default 50; range 1 to 1000.
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

        /// <summary>
        /// Most tools kept. Default 1000; range 1 to 10000.
        /// </summary>
        public int MaxTools
        {
            get
            {
                return _MaxTools;
            }
            set
            {
                _MaxTools = Math.Clamp(value, 1, 10000);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private int _MaxPages = 50;
        private int _MaxTools = 1000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public McpToolListingService(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List an HTTP MCP server's tools. Failures are reported in the result, never thrown, except cancellation of the
        /// caller's token.
        /// </summary>
        /// <param name="server">HTTP MCP server.</param>
        /// <param name="referenced">The secrets the server's header templates name; the caller checked it may use them.</param>
        /// <param name="timeoutMs">Overall timeout in milliseconds, 1000 to 120000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tool names and details, or an error.</returns>
        /// <exception cref="ArgumentNullException">Thrown when server or referenced is null.</exception>
        /// <exception cref="OperationCanceledException">Thrown when the caller's token is cancelled.</exception>
        public async Task<McpServerTestResponse> ListHttpAsync(McpServer server, List<Secret> referenced, int timeoutMs, CancellationToken token)
        {
            if (server == null) throw new ArgumentNullException(nameof(server));
            if (referenced == null) throw new ArgumentNullException(nameof(referenced));
            int timeout = Math.Clamp(timeoutMs, 1000, 120000);
            McpServerTestResponse response = new McpServerTestResponse();
            Stopwatch watch = Stopwatch.StartNew();
            long outboundStart = Stopwatch.GetTimestamp();
            Activity? outbound = GarrisonTracing.StartOutbound("mcp_server", "test");
            outbound?.SetTag("garrison.mcp_server", server.Name);
            string outcome = "error";
            Exception? failure = null;
            try
            {
                if (!Uri.TryCreate((server.Url ?? String.Empty).TrimEnd('/'), UriKind.Absolute, out Uri? target)) throw new InvalidOperationException("The MCP server URL is not an absolute URL.");
                string? blocked = await OutboundAddressPolicy.BlockedReasonAsync(target, token).ConfigureAwait(false);
                if (blocked != null)
                {
                    response.Error = blocked;
                    GarrisonTracing.EndOutbound(outbound, "mcp_server", "test", outboundStart, outcome, null);
                    response.DurationMs = watch.ElapsedMilliseconds;
                    return response;
                }
                TemplateContext context = _Context.Get<WorkerMcpTestService>().SecretContext(referenced);
                using (CancellationTokenSource deadline = CancellationTokenSource.CreateLinkedTokenSource(token))
                {
                    deadline.CancelAfter(timeout);
                    using (McpHttpClient client = new McpHttpClient(OutboundAddressPolicy.CreateHandler(), true))
                    {
                        foreach (McpServerHeader header in server.Headers)
                        {
                            TemplateRenderOptions options = new TemplateRenderOptions();
                            options.AllowSecrets = true;
                            client.SetRequestHeader(header.Name, TemplateRenderer.Render(header.ValueTemplate, context, options));
                        }
                        bool connected = await client.ConnectStreamableAsync((server.Url ?? String.Empty).TrimEnd('/'), String.IsNullOrWhiteSpace(server.Path) ? "/mcp" : server.Path!, deadline.Token).ConfigureAwait(false);
                        if (!connected) throw new InvalidOperationException("The server did not complete the MCP handshake.");
                        HashSet<string> names = new HashSet<string>(StringComparer.Ordinal);
                        HashSet<string> cursors = new HashSet<string>(StringComparer.Ordinal);
                        string? cursor = null;
                        for (int page = 0; page < _MaxPages; page++)
                        {
                            object parameters = cursor == null ? new { } : (object)new { cursor };
                            McpToolsListResult list = await client.CallAsync<McpToolsListResult>("tools/list", parameters, timeout, deadline.Token).ConfigureAwait(false)
                                ?? throw new InvalidOperationException("The server did not return a tool list.");
                            foreach (McpListedTool tool in list.Tools ?? new List<McpListedTool>())
                            {
                                if (String.IsNullOrEmpty(tool.Name) || tool.Name.Length > 512) throw new InvalidOperationException("The server returned an invalid tool name.");
                                if (!names.Add(tool.Name)) continue;
                                if (names.Count > _MaxTools) throw new InvalidOperationException("The server lists more than " + _MaxTools + " tools.");
                                response.Tools.Add(tool.Name);
                                response.ToolDetails.Add(McpToolDetail.Create(tool.Name, tool.Description, tool.InputSchema));
                            }
                            cursor = list.NextCursor;
                            if (String.IsNullOrEmpty(cursor)) break;
                            if (!cursors.Add(cursor)) throw new InvalidOperationException("The server repeated a tool list cursor.");
                            if (page == _MaxPages - 1) throw new InvalidOperationException("The server's tool list has more than " + _MaxPages + " pages.");
                        }
                    }
                }
                response.MissingRequiredTools = server.RequiredTools.Where(t => !response.Tools.Contains(t, StringComparer.Ordinal)).ToList();
                response.Success = response.MissingRequiredTools.Count == 0;
                outcome = response.Success ? "ok" : "missing_tools";
                if (!response.Success) response.Error = "Required tools are missing: " + String.Join(", ", response.MissingRequiredTools) + ".";
            }
            catch (Exception e) when (e is not OperationCanceledException || !token.IsCancellationRequested)
            {
                response.Success = false;
                response.Error = e is OperationCanceledException ? "Timed out after " + timeout + " ms." : Failure(e);
                _Context.Logging.Debug("[McpToolListingService] listing MCP server " + server.Id + " failed: " + e.Message);
                outcome = e is OperationCanceledException ? "timeout" : "error";
                failure = e;
            }
            GarrisonTracing.EndOutbound(outbound, "mcp_server", "test", outboundStart, outcome, failure);
            response.DurationMs = watch.ElapsedMilliseconds;
            return response;
        }

        #endregion

        #region Private-Methods

        private static string Failure(Exception e)
        {
            // The caller chooses the URL, so the raw exception text (which can echo internal host names, response bodies,
            // and socket details) is not returned; only the class of failure is (SR-26). The detail goes to the debug log.
            if (e is System.Net.Http.HttpRequestException request)
            {
                if (request.StatusCode.HasValue) return "The MCP server answered HTTP " + (int)request.StatusCode.Value + ".";
                return "The MCP server could not be reached (" + request.HttpRequestError + ").";
            }
            if (e is InvalidOperationException && e.Source == typeof(McpToolListingService).Assembly.GetName().Name) return e.Message;
            return "The MCP test failed (" + e.GetType().Name + ").";
        }

        #endregion
    }
}
