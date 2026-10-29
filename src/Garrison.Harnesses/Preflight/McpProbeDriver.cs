namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Channels;
    using System.Threading.Tasks;
    using Garrison.Core.Responses;
    using Garrison.Core.Serialization;
    using Garrison.Harnesses.Execution;
    using Voltaic.Core;
    using Voltaic.Mcp;

    /// <summary>Bounded initialize/tools-list exchange. Does not call tools or log server output. One process per instance.</summary>
    public class McpProbeDriver : IStdinDriver
    {
        private readonly Channel<McpProbeEnvelope> _Replies = Channel.CreateBounded<McpProbeEnvelope>(32);
        private readonly CancellationTokenSource _Stop;
        private readonly int _MaxPages;
        private readonly int _MaxTools;
        private int _NextId;

        /// <summary>Names returned by completed tools/list pages.</summary>
        public List<string> Tools { get; } = new List<string>();
        /// <summary>The same tools with descriptions and input schemas (AD4.3).</summary>
        public List<McpToolDetail> ToolDetails { get; } = new List<McpToolDetail>();
        /// <summary>Whether the full exchange completed.</summary>
        public bool Success { get; private set; } = false;
        /// <summary>Safe diagnostic message, without stderr or protocol payloads.</summary>
        public string? Error { get; private set; } = null;

        /// <summary>Construct a single-use driver.</summary>
        /// <param name="stop">Process stop signal owned by the caller.</param>
        /// <param name="maxPages">Maximum list pages.</param>
        /// <param name="maxTools">Maximum unique tools.</param>
        /// <exception cref="ArgumentNullException">Thrown when stop is null.</exception>
        public McpProbeDriver(CancellationTokenSource stop, int maxPages, int maxTools)
        {
            _Stop = stop ?? throw new ArgumentNullException(nameof(stop));
            _MaxPages = Math.Clamp(maxPages, 1, 1000);
            _MaxTools = Math.Clamp(maxTools, 1, 10000);
        }

        /// <summary>Accept a stdout line from the process runner. Thread-safe with DriveAsync.</summary>
        /// <param name="line">One bounded JSON-RPC message.</param>
        public void Accept(string line)
        {
            try
            {
                McpProbeEnvelope? message = Serializer.Deserialize<McpProbeEnvelope>(line);
                if (message == null || message.Id == null) return;
                if (!_Replies.Writer.TryWrite(message))
                {
                    Error = "MCP diagnostic received too many pending messages.";
                    _Stop.Cancel();
                }
            }
            catch (JsonException)
            {
                Error = "MCP diagnostic received invalid JSON.";
                _Stop.Cancel();
            }
        }

        /// <inheritdoc />
        public async Task DriveAsync(TextWriter stdin, CancellationToken token)
        {
            try
            {
                McpProbeResult initialized = await CallAsync(stdin, "initialize", new { protocolVersion = McpProtocol.LatestProtocolVersion, capabilities = new { }, clientInfo = new { name = "garrison-diagnostic", version = Garrison.Core.Constants.ProductVersion } }, token).ConfigureAwait(false);
                if (!McpProtocol.IsSupportedVersion(initialized.ProtocolVersion)) throw new IOException("MCP initialization returned an unsupported protocol version.");
                await WriteAsync(stdin, new JsonRpcRequest { Method = "notifications/initialized" }, token).ConfigureAwait(false);
                HashSet<string> cursors = new HashSet<string>(StringComparer.Ordinal);
                HashSet<string> names = new HashSet<string>(StringComparer.Ordinal);
                string? cursor = null;
                for (int page = 0; page < _MaxPages; page++)
                {
                    McpProbeResult list = await CallAsync(stdin, "tools/list", cursor == null ? new { } : (object)new { cursor }, token).ConfigureAwait(false);
                    if (list.Tools == null) throw new IOException("MCP server did not return a tool list.");
                    foreach (McpProbeTool tool in list.Tools)
                    {
                        if (String.IsNullOrEmpty(tool.Name) || tool.Name.Length > 512) throw new IOException("MCP server returned an invalid tool name.");
                        if (names.Add(tool.Name))
                        {
                            Tools.Add(tool.Name);
                            ToolDetails.Add(McpToolDetail.Create(tool.Name, tool.Description, tool.InputSchema));
                        }
                        if (Tools.Count > _MaxTools) throw new IOException("MCP tool list exceeds the diagnostic limit.");
                    }
                    cursor = list.NextCursor;
                    if (String.IsNullOrEmpty(cursor)) { Success = true; return; }
                    if (!cursors.Add(cursor)) throw new IOException("MCP tool pagination repeated a cursor.");
                }
                throw new IOException("MCP tool pagination exceeds the diagnostic limit.");
            }
            catch (IOException ex) { Error = ex.Message; }
            finally { _Stop.Cancel(); }
        }

        private async Task<McpProbeResult> CallAsync(TextWriter stdin, string method, object parameters, CancellationToken token)
        {
            string id = "garrison-diagnostic-" + (++_NextId).ToString(System.Globalization.CultureInfo.InvariantCulture);
            await WriteAsync(stdin, new JsonRpcRequest { Id = id, Method = method, Params = parameters }, token).ConfigureAwait(false);
            while (true)
            {
                McpProbeEnvelope reply = await _Replies.Reader.ReadAsync(token).ConfigureAwait(false);
                if (!String.IsNullOrEmpty(reply.Method))
                {
                    JsonRpcResponse answer = new JsonRpcResponse { Id = reply.Id };
                    if (reply.Method == "ping") answer.Result = new { };
                    else answer.Error = new JsonRpcError { Code = -32601, Message = "Diagnostic client does not support this request." };
                    await WriteAsync(stdin, answer, token).ConfigureAwait(false);
                    continue;
                }
                if (reply.Id is not string received || received != id) continue;
                if (reply.Error != null) throw new IOException("MCP server rejected the diagnostic request.");
                return reply.Result ?? throw new IOException("MCP server returned no diagnostic result.");
            }
        }

        private static async Task WriteAsync(TextWriter stdin, object message, CancellationToken token)
        {
            token.ThrowIfCancellationRequested();
            await stdin.WriteLineAsync(Serializer.Serialize(message).AsMemory(), token).ConfigureAwait(false);
            await stdin.FlushAsync(token).ConfigureAwait(false);
        }
    }
}
