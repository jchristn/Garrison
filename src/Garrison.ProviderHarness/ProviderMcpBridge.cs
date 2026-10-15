namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Security.Cryptography;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using PolyPrompt.Models;
    using Voltaic.Mcp;

    /// <summary>HTTP MCP tool bridge with bounded discovery and permission mediation. One instance per run.</summary>
    public class ProviderMcpBridge : IDisposable
    {
        private readonly ProviderApiConfig _Config;
        private readonly List<McpHttpClient> _Clients = new List<McpHttpClient>();
        private readonly Dictionary<string, ProviderToolBinding> _Bindings = new Dictionary<string, ProviderToolBinding>(StringComparer.Ordinal);
        private ProviderToolBinding? _Approver;
        private bool _Disposed;
        /// <summary>Safe optional-server diagnostics.</summary>
        public List<string> Warnings { get; } = new List<string>();
        /// <summary>Tools exposed to the model. The permission-prompt tool is kept private.</summary>
        public List<PolyPrompt.Models.ToolDefinition> Definitions { get; } = new List<PolyPrompt.Models.ToolDefinition>();
        /// <summary>Construct a bridge.</summary>
        /// <param name="config">Resolved configuration.</param>
        public ProviderMcpBridge(ProviderApiConfig config) { _Config = config ?? throw new ArgumentNullException(nameof(config)); }

        /// <summary>Discover HTTP tools and validate required capabilities before the first model request.</summary>
        /// <param name="token">Run cancellation.</param>
        /// <returns>Task.</returns>
        /// <exception cref="InvalidOperationException">Thrown when a required server or approval hook cannot be used.</exception>
        public async Task ConnectAsync(CancellationToken token)
        {
            foreach (ProviderMcpSpec spec in _Config.Servers)
            {
                token.ThrowIfCancellationRequested();
                List<ProviderToolBinding> discovered = new List<ProviderToolBinding>();
                McpHttpClient? client = null;
                string stage = "transport";
                try
                {
                    if (spec.Transport != "http") throw new InvalidOperationException("Only HTTP MCP servers are supported in provider API mode.");
                    stage = "connection";
                    // A tenant chooses this URL: connect only to addresses the outbound policy allows, never follow redirects (SR-07).
                    client = new McpHttpClient(OutboundAddressPolicy.CreateHandler(), true);
                    _Clients.Add(client);
                    client.MaxMessageSize = _Config.MaxMcpMessageBytes;
                    client.RequestTimeoutMs = Math.Clamp(spec.ToolTimeoutSeconds, 1, 86400) * 1000;
                    foreach (Garrison.Core.Compilation.ExecutionEnvironmentVariable header in spec.Headers) client.SetRequestHeader(header.Name, header.Value);
                    using (CancellationTokenSource connection = CancellationTokenSource.CreateLinkedTokenSource(token))
                    {
                        connection.CancelAfter(_Config.McpDiscoveryTimeoutMs);
                        if (!await client.ConnectStreamableAsync(spec.Url.TrimEnd('/'), spec.Path, connection.Token).ConfigureAwait(false)) throw new InvalidOperationException("MCP connection refused.");
                        stage = "tool discovery";
                        string? cursor = null;
                        HashSet<string> cursors = new HashSet<string>(StringComparer.Ordinal);
                        bool finished = false;
                        for (int page = 0; page < _Config.MaxMcpPages; page++)
                        {
                            ProviderToolPage response = await client.CallAsync<ProviderToolPage>("tools/list", cursor == null ? new { } : (object)new { cursor }, _Config.McpDiscoveryTimeoutMs, connection.Token).ConfigureAwait(false);
                            foreach (ProviderToolInfo tool in response.Tools)
                            {
                                if (String.IsNullOrWhiteSpace(tool.Name) || tool.InputSchema.Count == 0) throw new InvalidOperationException("MCP tool metadata is invalid.");
                                if (discovered.Any(t => t.Tool.Name == tool.Name)) throw new InvalidOperationException("Duplicate MCP tool name.");
                                string canonical = "mcp__" + spec.Name + "__" + tool.Name;
                                string alias = canonical.Length <= 64 && canonical.All(c => Char.IsAsciiLetterOrDigit(c) || c == '_' || c == '-')
                                    ? canonical : "mcp_" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(spec.Name + "\n" + tool.Name))).ToLowerInvariant().Substring(0, 48);
                                discovered.Add(new ProviderToolBinding(tool, spec, client, alias));
                                if (_Bindings.Count + discovered.Count > _Config.MaxMcpTools) throw new InvalidOperationException("Too many MCP tools.");
                            }
                            cursor = response.NextCursor;
                            if (String.IsNullOrEmpty(cursor)) { finished = true; break; }
                            if (!cursors.Add(cursor)) throw new InvalidOperationException("Repeated MCP tools cursor.");
                        }
                        stage = "required-tool validation";
                        if (!finished || spec.RequiredTools.Any(t => !discovered.Any(d => d.Tool.Name == t))) throw new InvalidOperationException("Required MCP tools are missing or pagination exceeded its limit.");
                    }
                    foreach (ProviderToolBinding binding in discovered)
                    {
                        if (binding.Server.Name == Constants.McpServerName && binding.Tool.Name == "garrison_permission_prompt") { _Approver = binding; continue; }
                        if (!_Bindings.TryAdd(binding.Alias, binding)) throw new InvalidOperationException("Duplicate MCP binding.");
                        Definitions.Add(PolyPrompt.Models.ToolDefinition.Function(binding.Alias, binding.Tool.Description ?? binding.Tool.Name, binding.Tool.InputSchema));
                    }
                }
                catch (Exception error) when (!token.IsCancellationRequested)
                {
                    client?.Dispose();
                    if (client != null) _Clients.Remove(client);
                    Warnings.Add("An optional MCP server could not be initialized for provider execution.");
                    if (spec.Required) throw new InvalidOperationException("Required MCP server failed during " + stage + " (" + error.GetType().Name + ").");
                }
            }
            if (_Config.ApprovalsEnabled && _Approver == null) throw new InvalidOperationException("Provider execution requires the Garrison permission-prompt hook when approvals are enabled.");
        }

        /// <summary>Resolve a function alias for normalized events.</summary>
        /// <param name="alias">Provider function name.</param>
        /// <returns>Canonical permission-rule name, or the unknown alias.</returns>
        public string DisplayName(string alias) { return _Bindings.TryGetValue(alias, out ProviderToolBinding? binding) ? binding.PermissionName : alias; }

        /// <summary>Validate model arguments, obtain approval when enabled, then call the bound tool.</summary>
        /// <param name="call">Completed provider function call.</param>
        /// <param name="token">Run cancellation.</param>
        /// <returns>Text-only MCP result.</returns>
        public async Task<ProviderToolResult> InvokeAsync(ToolCall call, CancellationToken token)
        {
            if (!_Bindings.TryGetValue(call.Name, out ProviderToolBinding? binding)) return Failure("Unknown MCP function.");
            try
            {
                Dictionary<string, object?>? arguments;
                try { arguments = Serializer.Deserialize<Dictionary<string, object?>>(call.ArgumentsJson); }
                catch (JsonException) { return Failure("Tool arguments do not match the advertised schema."); }
                OutputSchemaValidator validator = new OutputSchemaValidator { UnwrapCodeFence = false };
                if (arguments == null || !validator.Validate(Serializer.Serialize(binding.Tool.InputSchema), call.ArgumentsJson, null).Valid) return Failure("Tool arguments do not match the advertised schema.");
                if (_Config.ApprovalsEnabled)
                {
                    ProviderToolResult reply = await CallAsync(_Approver!, new { tool_name = binding.PermissionName, input = arguments, tool_use_id = call.Id }, token).ConfigureAwait(false);
                    ProviderApprovalDecision? decision = reply.IsError ? null : Serializer.Deserialize<ProviderApprovalDecision>(Text(reply));
                    if (decision?.Behavior != "allow") return Failure(decision?.Message ?? "Permission denied.");
                    if (decision.UpdatedInput != null)
                    {
                        arguments = decision.UpdatedInput;
                        if (!validator.Validate(Serializer.Serialize(binding.Tool.InputSchema), Serializer.Serialize(arguments), null).Valid) return Failure("Approved replacement arguments do not match the advertised schema.");
                    }
                }
                ProviderToolResult result = await CallAsync(binding, new { name = binding.Tool.Name, arguments }, token).ConfigureAwait(false);
                if (Text(result).Length > _Config.MaxToolResultChars) return Failure("MCP tool result exceeded the configured size limit.");
                return result;
            }
            catch (Exception) when (!token.IsCancellationRequested) { return Failure("MCP tool execution failed."); }
        }

        /// <summary>Return text content or serialize dynamic structured content.</summary>
        /// <param name="result">Tool result.</param>
        /// <returns>Tool text.</returns>
        public static string Text(ProviderToolResult result)
        {
            string text = String.Join("\n", result.Content.Where(c => c.Type == "text").Select(c => c.Text));
            return text.Length > 0 ? text : result.StructuredContent != null ? Serializer.Serialize(result.StructuredContent) : String.Empty;
        }
        /// <inheritdoc />
        public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
        /// <summary>Dispose the bridge-owned clients.</summary>
        /// <param name="disposing">Whether to release managed resources.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing) foreach (McpHttpClient client in _Clients) client.Dispose();
            _Disposed = true;
        }
        private static Task<ProviderToolResult> CallAsync(ProviderToolBinding binding, object arguments, CancellationToken token)
        {
            object request = binding.Tool.Name == "garrison_permission_prompt" ? new { name = binding.Tool.Name, arguments } : arguments;
            return binding.Client.CallAsync<ProviderToolResult>("tools/call", request, Math.Clamp(binding.Server.ToolTimeoutSeconds, 1, 86400) * 1000, token);
        }
        private static ProviderToolResult Failure(string text) { return new ProviderToolResult { IsError = true, Content = new List<ProviderToolContent> { new ProviderToolContent { Type = "text", Text = text } } }; }
    }
}
