namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Net;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Radiant;
    using Voltaic.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Garrison's MCP server on Voltaic (own listener, D-013). Authenticates with the same schemes as REST plus run
    /// tokens, authorizes every tool through the authorization service, and exposes agent discovery, invocation, and
    /// run tracking tools (plan section 10.2).
    /// </summary>
    public class GarrisonMcpServer : IDisposable
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly AgentInvoker _Invoker;
        private readonly RunService _Runs;
        private readonly RunEventService _Events;
        private readonly string _Header = "[Mcp] ";
        private McpHttpServer? _Server = null;
        private CancellationTokenSource? _Cts = null;
        private Task? _ServerTask = null;
        private List<ToolDefinition> _PublicTools = new List<ToolDefinition>();
        private List<ToolDefinition> _AdministratorTools = new List<ToolDefinition>();
        private bool _Disposed = false;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="invoker">Agent invoker.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="events">Run event service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public GarrisonMcpServer(ServerContext context, AgentInvoker invoker, RunService runs, RunEventService events)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Invoker = invoker ?? throw new ArgumentNullException(nameof(invoker));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Events = events ?? throw new ArgumentNullException(nameof(events));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Record tool scopes in the operation scope map.
        /// </summary>
        public void RecordScopes()
        {
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                OperationScope scope = new OperationScope();
                scope.Method = "MCP";
                scope.Path = tool.Name;
                scope.ResourceType = tool.ResourceType;
                scope.Operation = tool.Operation;
                scope.Authorization = RouteAuthorizationEnum.Scoped;
                scope.Tag = "MCP";
                scope.Summary = tool.DefaultDescription;
                _Context.Scopes.Add(scope);
            }
        }

        /// <summary>
        /// Seed built-in tool description templates and start listening.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task StartAsync(CancellationToken token)
        {
            if (!_Context.Settings.Mcp.Enable) return;

            Dictionary<string, string> descriptions = await LoadDescriptionsAsync(token).ConfigureAwait(false);

            _Cts = CancellationTokenSource.CreateLinkedTokenSource(token);
            _Server = new McpHttpServer(_Context.Settings.Mcp.Hostname, _Context.Settings.Mcp.Port, "/rpc", "/events", false, _Context.Settings.Mcp.Path);
            _Server.EnableLegacyEndpoints = false;
            _Server.ServerName = "Garrison";
            _Server.ServerVersion = Constants.ProductVersion;
            _Server.MaxMessageSize = _Context.Settings.Mcp.MaxMessageSize;
            _Server.EnableCors = true;
            _Server.AuthenticationHandler = AuthenticateAsync;
            _Server.Log += (_, message) => _Context.Logging.Debug(_Header + message);

            List<ToolDefinition> publicTools = new List<ToolDefinition>();
            List<ToolDefinition> administratorTools = new List<ToolDefinition>();
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                string description = descriptions.TryGetValue(tool.Name, out string? rendered) ? rendered : tool.DefaultDescription;
                McpToolDefinition captured = tool;
                using (JsonDocument schema = JsonDocument.Parse(tool.AdministratorInputSchemaJson))
                {
                    // Arguments are validated against the administrator schema, so a caller that sends tenantId anyway
                    // is accepted; DispatchAsync ignores it for anyone bound to a tenant.
                    _Server.RegisterTool(tool.Name, description, schema.RootElement.Clone(), (RpcParameters? args, RpcCallContext? call, CancellationToken ct) => DispatchAsync(captured, args, call, ct));
                    administratorTools.Add(Definition(tool.Name, description, schema.RootElement.Clone()));
                }
                using (JsonDocument schema = JsonDocument.Parse(tool.InputSchemaJson))
                {
                    publicTools.Add(Definition(tool.Name, description, schema.RootElement.Clone()));
                }
            }
            _PublicTools = publicTools;
            _AdministratorTools = administratorTools;

            // Voltaic lists the same tools to every session, so tools/list is answered here per caller: only system
            // administrators see the administrator-only tenantId argument (G-19).
            _Server.RegisterMethod("tools/list", (RpcParameters? args, RpcCallContext? call, CancellationToken ct) => Task.FromResult<object>(ListTools(PrincipalClaims.Decode(call?.Claims))));

            _ServerTask = _Server.StartAsync(_Cts.Token);
            await Task.Delay(100, token).ConfigureAwait(false);
            if (_ServerTask.IsFaulted) throw new InvalidOperationException("MCP server failed to start on port " + _Context.Settings.Mcp.Port + ": " + _ServerTask.Exception?.GetBaseException().Message);
            _Context.Logging.Info(_Header + "listening on " + _Context.Settings.Mcp.Hostname + ":" + _Context.Settings.Mcp.Port + _Context.Settings.Mcp.Path);
        }

        /// <summary>
        /// Stop listening.
        /// </summary>
        public void Stop()
        {
            try
            {
                _Cts?.Cancel();
                _Server?.Stop();
            }
            catch (Exception e)
            {
                _Context.Logging.Warn(_Header + "error stopping: " + e.Message);
            }
        }

        /// <summary>
        /// Dispose.
        /// </summary>
        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Whether the caller may see administrator-only tool arguments: system administrators that are not acting
        /// through a run token.
        /// </summary>
        /// <param name="ctx">Caller.</param>
        /// <returns>True for system administrators.</returns>
        public static bool SeesAdministratorArguments(RequestContext ctx)
        {
            if (ctx == null) return false;
            if (!ctx.IsAuthenticated || ctx.PrincipalType == PrincipalTypeEnum.Run) return false;
            return ctx.IsAdmin || ctx.PrincipalType == PrincipalTypeEnum.Administrator;
        }

        #endregion

        #region Protected-Methods

        /// <summary>
        /// Dispose pattern implementation.
        /// </summary>
        /// <param name="disposing">True when called from Dispose.</param>
        protected virtual void Dispose(bool disposing)
        {
            if (_Disposed) return;
            if (disposing)
            {
                Stop();
                _Server?.Dispose();
                _Cts?.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        private async Task<Dictionary<string, string>> LoadDescriptionsAsync(CancellationToken token)
        {
            Dictionary<string, string> descriptions = new Dictionary<string, string>(StringComparer.Ordinal);
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                PromptTemplate? template = await _Context.Database.PromptTemplates.ReadByNameAsync(_Context.DefaultTenantId, tool.DescriptionTemplate, token).ConfigureAwait(false);
                if (template == null)
                {
                    template = new PromptTemplate();
                    template.Id = "tpl_builtin_mcp_tool_" + tool.Name.Replace("garrison_", String.Empty);
                    template.TenantId = null;
                    template.Name = tool.DescriptionTemplate;
                    template.Description = "Description of the " + tool.Name + " MCP tool shown to harnesses.";
                    template.Kind = PromptTemplateKindEnum.ToolDescription;
                    template.Content = tool.DefaultDescription;
                    template.IsBuiltIn = true;
                    template.BuiltInKey = tool.DescriptionTemplate;
                    template.IsProtected = true;
                    await _Context.Database.PromptTemplates.CreateAsync(template, token).ConfigureAwait(false);
                    PromptTemplateVersion version = new PromptTemplateVersion();
                    version.TemplateId = template.Id;
                    version.Version = 1;
                    version.Content = template.Content;
                    version.ChangeNote = "Seeded.";
                    version.CreatedBy = "garrison";
                    await _Context.Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
                }
                else if (template.IsBuiltIn && template.TenantId == null && template.Content != tool.DefaultDescription)
                {
                    // Built-in descriptions are protected, so a difference means the release changed the text.
                    template.Content = tool.DefaultDescription;
                    template.CurrentVersion = template.CurrentVersion + 1;
                    await _Context.Database.PromptTemplates.UpdateAsync(template, token).ConfigureAwait(false);
                    PromptTemplateVersion version = new PromptTemplateVersion();
                    version.TemplateId = template.Id;
                    version.Version = template.CurrentVersion;
                    version.Content = template.Content;
                    version.ChangeNote = "Built-in refreshed from the release.";
                    version.CreatedBy = "garrison";
                    await _Context.Database.PromptTemplateVersions.CreateAsync(version, token).ConfigureAwait(false);
                }
                descriptions[tool.Name] = template.Content;
            }
            return descriptions;
        }

        private McpListToolsResult ListTools(RequestContext ctx)
        {
            McpListToolsResult result = new McpListToolsResult();
            result.Tools = new List<ToolDefinition>(SeesAdministratorArguments(ctx) ? _AdministratorTools : _PublicTools);
            result.CacheScope = "private";
            return result;
        }

        private static ToolDefinition Definition(string name, string description, JsonElement schema)
        {
            ToolDefinition definition = new ToolDefinition();
            definition.Name = name;
            definition.Description = description;
            definition.InputSchema = schema;
            return definition;
        }

        private async Task<AuthenticationResult> AuthenticateAsync(HttpListenerRequest request)
        {
            RequestContext ctx = await _Context.Authentication.ResolveAsync(request.Headers, request.HttpMethod, request.Url?.AbsolutePath ?? "/", request.Url?.Query?.TrimStart('?'), null, request.RemoteEndPoint?.Address?.ToString(), CancellationToken.None).ConfigureAwait(false);
            if (!ctx.IsAuthenticated) return AuthenticationResult.BearerChallenge(null, "invalid_token", "Authentication is required.");
            AuthenticationResult result = new AuthenticationResult();
            result.IsAuthenticated = true;
            result.Principal = ctx.PrincipalType + ":" + (ctx.PrincipalId ?? "admin");
            result.Claims = PrincipalClaims.Encode(ctx);
            return result;
        }

        private async Task<object> DispatchAsync(McpToolDefinition tool, RpcParameters? args, RpcCallContext? call, CancellationToken token)
        {
            RequestContext ctx = PrincipalClaims.Decode(call?.Claims);
            if (!ctx.IsAuthenticated) throw ToolError("Unauthorized", "Authentication is required.");
            string? tenantId = ctx.TenantId ?? args?.GetString("tenantId");
            if (String.IsNullOrEmpty(tenantId)) throw ToolError("TenantRequired", "No tenant could be resolved. System administrators must pass tenantId.");

            _Context.Telemetry.Increment("garrison.mcp.tool.calls", new RadiantTag("tool", tool.Name));
            try
            {
                object result;
                switch (tool.Name)
                {
                    case "garrison_list_agents":
                        result = await ListAgentsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_agent":
                        result = await GetAgentAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_invoke_agent":
                        result = await InvokeAsync(ctx, tenantId, args, true, token).ConfigureAwait(false);
                        break;
                    case "garrison_start_run":
                        result = await InvokeAsync(ctx, tenantId, args, false, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_run":
                        result = await SummarizeAsync(await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Read, token).ConfigureAwait(false), token).ConfigureAwait(false);
                        break;
                    case "garrison_get_run_events":
                        result = await EventsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_cancel_run":
                        Run toCancel = await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Update, token).ConfigureAwait(false);
                        result = await SummarizeAsync(await _Runs.CancelAsync(toCancel, token).ConfigureAwait(false), token).ConfigureAwait(false);
                        break;
                    case "garrison_list_runs":
                        result = await ListRunsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    default:
                        throw ToolError("UnknownTool", "Unknown tool " + tool.Name + ".");
                }
                _Context.Telemetry.Increment("garrison.mcp.tool.results", new RadiantTag("tool", tool.Name), new RadiantTag("result", "ok"));
                return McpToolCallResult.FromText(Serializer.SerializeReadable(result));
            }
            catch (McpToolException)
            {
                _Context.Telemetry.Increment("garrison.mcp.tool.results", new RadiantTag("tool", tool.Name), new RadiantTag("result", "error"));
                throw;
            }
            catch (Exception e) when (e is NotFoundException || e is ConflictException || e is ValidationException || e is ArgumentException)
            {
                _Context.Telemetry.Increment("garrison.mcp.tool.results", new RadiantTag("tool", tool.Name), new RadiantTag("result", "error"));
                if (e is ValidationException validation) throw ToolError("ValidationFailed", validation.Describe());
                if (e is ConflictException conflict) throw ToolError(conflict.Code, e.Message);
                if (e is NotFoundException) throw ToolError("NotFound", e.Message);
                throw ToolError("BadRequest", e.Message);
            }
        }

        private async Task Require(RequestContext ctx, string tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, CancellationToken token)
        {
            AuthorizationDecision decision = await _Context.Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, token).ConfigureAwait(false);
            if (!decision.Permitted) throw ToolError("Forbidden", "Not permitted: " + decision.Reason);
        }

        private async Task<object> ListAgentsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery();
            query.Search = args?.GetString("search");
            query.MaxResults = (int)Math.Clamp(args?.GetInt64("maxResults") ?? 25, 1, 100);
            query.ActiveOnly = true;
            EnumerationResult<Agent> page = await _Context.Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);

            List<Agent> visible = page.Objects;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId))
            {
                Run? parent = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
                Agent? caller = parent == null ? null : await _Context.Database.Agents.ReadAsync(tenantId, parent.AgentId, token).ConfigureAwait(false);
                if (caller == null || caller.DelegationMode == DelegationModeEnum.None) visible = new List<Agent>();
                else if (caller.DelegationMode == DelegationModeEnum.AllowList) visible = visible.Where(a => caller.DelegationAllowList.Contains(a.Name)).ToList();
                visible = visible.Where(a => a.Id != caller?.Id || caller.DelegationAllowRecursion).ToList();
            }

            McpAgentList list = new McpAgentList();
            list.Agents = visible.Select(Describe).ToList();
            list.TotalRecords = ctx.PrincipalType == PrincipalTypeEnum.Run ? list.Agents.Count : page.TotalRecords;
            return list;
        }

        private async Task<object> GetAgentAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            Agent agent = await _Invoker.ResolveAgentAsync(tenantId, args?.GetString("agent"), token).ConfigureAwait(false);
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Read, agent.Id, token).ConfigureAwait(false);
            return Describe(agent);
        }

        private async Task<object> InvokeAsync(RequestContext ctx, string tenantId, RpcParameters? args, bool wait, CancellationToken token)
        {
            Agent agent = await _Invoker.ResolveAgentAsync(tenantId, args?.GetString("agent"), token).ConfigureAwait(false);
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);

            InvocationOptions options = new InvocationOptions();
            options.Input = args?.GetString("input") ?? String.Empty;
            if (String.IsNullOrWhiteSpace(options.Input)) throw ToolError("ValidationFailed", "input is required.");
            options.DeploymentId = args?.GetString("deploymentId");
            options.Parameters = ReadParameters(args);
            options.Wait = wait;
            long requested = args?.GetInt64("waitSeconds") ?? _Context.Settings.Mcp.MaxToolWaitSeconds;
            options.WaitSeconds = (int)Math.Clamp(requested, 0, _Context.Settings.Mcp.MaxToolWaitSeconds);
            Run run = await _Invoker.InvokeAsync(ctx, tenantId, agent, options, token).ConfigureAwait(false);
            return await SummarizeAsync(run, token).ConfigureAwait(false);
        }

        private async Task<object> EventsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            Run run = await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Read, token).ConfigureAwait(false);
            long after = args?.GetInt64("afterSequence") ?? 0;
            int limit = (int)Math.Clamp(args?.GetInt64("limit") ?? 100, 1, 500);
            RunEventsResponse events = await _Events.ReadAsync(run, after, limit, token).ConfigureAwait(false);
            foreach (RunEvent evt in events.Events) evt.RawEventJson = null;
            return events;
        }

        private async Task<object> ListRunsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Run, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            RunFilter filter = new RunFilter();
            filter.TenantId = tenantId;
            string? status = args?.GetString("status");
            if (!String.IsNullOrEmpty(status) && Enum.TryParse<RunStatusEnum>(status, true, out RunStatusEnum parsed)) filter.Status = parsed;
            string? agentRef = args?.GetString("agent");
            if (!String.IsNullOrEmpty(agentRef)) filter.AgentId = (await _Invoker.ResolveAgentAsync(tenantId, agentRef, token).ConfigureAwait(false)).Id;
            filter.MaxResults = (int)Math.Clamp(args?.GetInt64("maxResults") ?? 25, 1, 100);
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId)) filter.RootRunId = await RootOfAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            McpRunList list = new McpRunList();
            BlockedRunService? blocked = _Context.TryGet<BlockedRunService>();
            if (blocked != null) await blocked.AnnotateManyAsync(page.Objects, token).ConfigureAwait(false);
            list.Runs = page.Objects.Select(Summarize).ToList();
            list.TotalRecords = page.TotalRecords;
            return list;
        }

        private async Task<Run> RequireRunAsync(RequestContext ctx, string tenantId, RpcParameters? args, OperationTypeEnum operation, CancellationToken token)
        {
            string? runId = args?.GetString("runId");
            if (String.IsNullOrEmpty(runId)) throw ToolError("ValidationFailed", "runId is required.");
            Run run = await _Context.Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run " + runId + " not found.");
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId))
            {
                string root = await RootOfAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
                if (run.Id != root && run.RootRunId != root) throw ToolError("NotFound", "Run " + runId + " not found.");
            }
            await Require(ctx, tenantId, ResourceTypeEnum.Run, operation, run.Id, token).ConfigureAwait(false);
            return run;
        }

        private async Task<string> RootOfAsync(string tenantId, string runId, CancellationToken token)
        {
            Run? run = await _Context.Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
            if (run == null) return runId;
            return String.IsNullOrEmpty(run.RootRunId) ? run.Id : run.RootRunId;
        }

        private static Dictionary<string, string> ReadParameters(RpcParameters? args)
        {
            Dictionary<string, string> parameters = new Dictionary<string, string>(StringComparer.Ordinal);
            if (args == null || String.IsNullOrEmpty(args.RawJson)) return parameters;
            using (JsonDocument document = JsonDocument.Parse(args.RawJson))
            {
                if (document.RootElement.ValueKind != JsonValueKind.Object) return parameters;
                if (!document.RootElement.TryGetProperty("parameters", out JsonElement element) || element.ValueKind != JsonValueKind.Object) return parameters;
                foreach (JsonProperty property in element.EnumerateObject())
                {
                    parameters[property.Name] = property.Value.ValueKind == JsonValueKind.String ? (property.Value.GetString() ?? String.Empty) : property.Value.GetRawText();
                }
            }
            return parameters;
        }

        private static McpAgentSummary Describe(Agent agent)
        {
            McpAgentSummary summary = new McpAgentSummary();
            summary.Id = agent.Id;
            summary.Name = agent.Name;
            summary.DisplayName = agent.DisplayName;
            summary.Description = agent.Description;
            summary.InputMode = agent.InputMode.ToString();
            summary.Skills = agent.Skills.Select(s => s.Name + (String.IsNullOrEmpty(s.Description) ? String.Empty : ": " + s.Description)).ToList();
            summary.InputSchemaJson = String.IsNullOrWhiteSpace(agent.InputSchemaJson) ? null : agent.InputSchemaJson;
            summary.OutputSchemaJson = String.IsNullOrWhiteSpace(agent.OutputSchemaJson) ? null : agent.OutputSchemaJson;
            summary.DisplayName = String.IsNullOrWhiteSpace(agent.DisplayName) ? null : agent.DisplayName;
            summary.Description = String.IsNullOrWhiteSpace(agent.Description) ? null : agent.Description;
            return summary;
        }

        private static McpToolException ToolError(string code, string message)
        {
            // Every tool error reads "Code: message" so callers can match the code (M1-30).
            return new McpToolException(code + ": " + message);
        }

        private async Task<McpRunSummary> SummarizeAsync(Run run, CancellationToken token)
        {
            BlockedRunService? blocked = _Context.TryGet<BlockedRunService>();
            if (blocked != null) await blocked.AnnotateAsync(run, token).ConfigureAwait(false);
            return Summarize(run);
        }

        private static McpRunSummary Summarize(Run run)
        {
            McpRunSummary summary = new McpRunSummary();
            summary.RunId = run.Id;
            summary.Agent = run.AgentName;
            summary.Status = run.Status.ToString();
            summary.Outcome = run.Outcome.ToString();
            summary.BlockedReason = run.BlockedReason?.ToString();
            summary.Finished = RunService.IsTerminal(run.Status);
            summary.Result = run.ResultText;
            summary.StructuredOutputJson = run.StructuredOutputJson;
            summary.OutputSchemaValid = run.OutputSchemaValid;
            summary.RepairAttempts = run.RepairAttempts;
            summary.Error = run.ErrorMessage;
            summary.InputTokens = run.InputTokens;
            summary.OutputTokens = run.OutputTokens;
            summary.CostUsd = run.CostUsd;
            summary.CachedTokens = run.CachedTokens;
            summary.ReasoningTokens = run.ReasoningTokens;
            summary.ToolCallCount = run.ToolCallCount;
            summary.ServedModel = run.ServedModel;
            summary.TimeToFirstTokenMs = run.TimeToFirstTokenMs;
            summary.StreamingMs = run.StreamingMs;
            summary.ExecutionMs = run.ExecutionMs;
            summary.QueueMs = run.QueueMs;
            summary.TotalMs = run.TotalMs;
            summary.DelegationWaitMs = run.DelegationWaitMs;
            summary.TimeToFirstTokenExcludingDelegationMs = run.TimeToFirstTokenExcludingDelegationMs;
            summary.OutputTokensPerSecond = run.OutputTokensPerSecond;
            summary.CreatedUtc = run.CreatedUtc;
            summary.CompletedUtc = run.CompletedUtc;
            return summary;
        }

        #endregion
    }
}
