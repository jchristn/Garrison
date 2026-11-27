namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net;
    using System.Net.Sockets;
    using System.Text;
    using System.Security.Cryptography;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Manifests;
    using Garrison.Core.Memory;
    using Garrison.Core.Organizations;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using Garrison.Core.Transcripts;
    using Garrison.Server.Routes;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using Radiant;
    using Voltaic.Core;
    using Voltaic.Mcp;

    /// <summary>
    /// Garrison's MCP server on Voltaic (own listener, D-013). Authenticates with the same schemes as REST plus run
    /// tokens, authorizes every tool through the authorization service, and exposes agent discovery, invocation, and
    /// run tracking tools (plan section 10.2). Voltaic listens on a loopback port; the public MCP port is served by
    /// <see cref="McpClusterProxy"/>, which makes MCP sessions work on every replica (G-1).
    /// </summary>
    public class GarrisonMcpServer : IDisposable
    {
        #region Public-Members

        /// <summary>
        /// The public MCP endpoint, or null before start or when MCP is disabled.
        /// </summary>
        public McpClusterProxy? Proxy
        {
            get
            {
                return _Proxy;
            }
        }

        /// <summary>
        /// Loopback port of the internal Voltaic endpoint, or 0 before start.
        /// </summary>
        public int InternalPort
        {
            get
            {
                return _InternalPort;
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Context;
        private readonly TenantConfigurationService _Mutations;
        private readonly AgentInvoker _Invoker;
        private readonly RunService _Runs;
        private readonly RunEventService _Events;
        private readonly string _Header = "[Mcp] ";
        private McpHttpServer? _Server = null;
        private CancellationTokenSource? _Cts = null;
        private Task? _ServerTask = null;
        private Dictionary<string, string> _BuiltInDescriptions = new Dictionary<string, string>(StringComparer.Ordinal);
        private Dictionary<string, JsonElement> _PublicSchemas = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        private Dictionary<string, JsonElement> _AdministratorSchemas = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
        private JsonElement _AgentToolPublicSchema;
        private JsonElement _AgentToolAdministratorSchema;
        private readonly HashSet<string> _RegisteredAgentTools = new HashSet<string>(StringComparer.Ordinal);
        private readonly object _AgentToolLock = new object();
        private McpClusterProxy? _Proxy = null;
        private int _InternalPort = 0;
        private readonly string _ProxySecret = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
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
            _Mutations = new TenantConfigurationService(_Context);
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

            OperationScope agentTools = new OperationScope();
            agentTools.Method = "MCP";
            agentTools.Path = "{mcpToolName}";
            agentTools.ResourceType = ResourceTypeEnum.Agent;
            agentTools.Operation = OperationTypeEnum.Execute;
            agentTools.Authorization = RouteAuthorizationEnum.Scoped;
            agentTools.Tag = "MCP";
            agentTools.Summary = "An agent offered as its own MCP tool (exposeMcpTool): invokes the agent and waits for its answer.";
            _Context.Scopes.Add(agentTools);
        }

        /// <summary>
        /// The MCP tool name of an agent offered as its own tool: its mcpToolName when set, otherwise its name.
        /// </summary>
        /// <param name="agent">Agent.</param>
        /// <returns>Tool name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when agent is null.</exception>
        public static string AgentToolName(Agent agent)
        {
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            return String.IsNullOrWhiteSpace(agent.McpToolName) ? agent.Name : agent.McpToolName!.Trim();
        }

        /// <summary>
        /// Whether a name can be used for an agent tool (see ConfigurationValidator.IsValidMcpToolName).
        /// </summary>
        /// <param name="name">Candidate name.</param>
        /// <returns>True when usable.</returns>
        public static bool IsValidAgentToolName(string? name)
        {
            return ConfigurationValidator.IsValidMcpToolName(name);
        }

        /// <summary>
        /// Resolve the description of a built-in tool for a caller's tenant (G-3): an active tenant prompt template of
        /// kind ToolDescription named mcp-tool-&lt;tool name&gt; replaces the built-in builtin/mcp-tool-&lt;tool name&gt;. The
        /// override is rendered with tool.name, tool.defaultDescription (the built-in text), tenant.id, and
        /// garrison.version; when it is missing, inactive, of another kind, or fails to render, the built-in is used.
        /// </summary>
        /// <param name="tenantId">Caller's tenant, or null for the built-in description.</param>
        /// <param name="tool">Built-in tool.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Description.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tool is null.</exception>
        public async Task<string> ToolDescriptionAsync(string? tenantId, McpToolDefinition tool, CancellationToken token = default)
        {
            if (tool == null) throw new ArgumentNullException(nameof(tool));
            string builtIn = _BuiltInDescriptions.TryGetValue(tool.Name, out string? loaded) ? loaded : tool.DefaultDescription;
            if (String.IsNullOrEmpty(tenantId)) return builtIn;
            PromptTemplate? template = await _Context.Database.PromptTemplates.ReadByNameAsync(tenantId, McpToolCatalog.TenantOverridePrefix + tool.Name, token).ConfigureAwait(false);
            if (template == null || template.TenantId != tenantId || !template.Active || template.Kind != PromptTemplateKindEnum.ToolDescription) return builtIn;
            TemplateContext context = new TemplateContext();
            context.Set("tool.name", tool.Name);
            context.Set("tool.defaultDescription", builtIn);
            context.Set("tenant.id", tenantId);
            context.Set("garrison.version", Constants.ProductVersion);
            try
            {
                string rendered = TemplateRenderer.Render(template.Content, context, new TemplateRenderOptions { TemplateName = template.Name }).Trim();
                return rendered.Length == 0 ? builtIn : rendered;
            }
            catch (TemplateException e)
            {
                _Context.Logging.Warn(_Header + "tool description override " + template.Name + " in tenant " + tenantId + " failed to render, using the built-in: " + e.Message);
                return builtIn;
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
            _InternalPort = _Context.Settings.Mcp.InternalPort > 0 ? _Context.Settings.Mcp.InternalPort : FreeLoopbackPort();
            _Server = new McpHttpServer("127.0.0.1", _InternalPort, "/rpc", "/events", false, _Context.Settings.Mcp.Path);
            _Server.EnableLegacyEndpoints = false;
            _Server.SessionTimeoutSeconds = Math.Max(10, _Context.Settings.Mcp.SessionIdleTimeoutSeconds);
            _Server.ClientIdentifier = ProxiedClient;
            _Server.ServerName = "Garrison";
            _Server.ServerVersion = Constants.ProductVersion;
            _Server.MaxMessageSize = _Context.Settings.Mcp.MaxMessageSize;
            _Server.EnableCors = true;
            _Server.AuthenticationHandler = AuthenticateAsync;
            _Server.Log += (_, message) => _Context.Logging.Debug(_Header + message);

            Dictionary<string, JsonElement> publicSchemas = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
            Dictionary<string, JsonElement> administratorSchemas = new Dictionary<string, JsonElement>(StringComparer.Ordinal);
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                string description = descriptions.TryGetValue(tool.Name, out string? rendered) ? rendered : tool.DefaultDescription;
                McpToolDefinition captured = tool;
                using (JsonDocument schema = JsonDocument.Parse(tool.AdministratorInputSchemaJson))
                {
                    // Arguments are validated against the administrator schema, so a caller that sends tenantId anyway
                    // is accepted; DispatchAsync ignores it for anyone bound to a tenant.
                    _Server.RegisterTool(tool.Name, description, schema.RootElement.Clone(), (RpcParameters? args, RpcCallContext? call, CancellationToken ct) => DispatchAsync(captured, args, call, ct));
                    administratorSchemas[tool.Name] = schema.RootElement.Clone();
                }
                using (JsonDocument schema = JsonDocument.Parse(tool.InputSchemaJson))
                {
                    publicSchemas[tool.Name] = schema.RootElement.Clone();
                }
            }
            using (JsonDocument schema = JsonDocument.Parse(McpToolCatalog.AgentToolInputSchemaJson))
            {
                _AgentToolPublicSchema = schema.RootElement.Clone();
            }
            using (JsonDocument schema = JsonDocument.Parse(McpToolCatalog.AgentToolAdministratorInputSchemaJson))
            {
                _AgentToolAdministratorSchema = schema.RootElement.Clone();
            }
            _BuiltInDescriptions = descriptions;
            _PublicSchemas = publicSchemas;
            _AdministratorSchemas = administratorSchemas;

            // Voltaic lists the same tools to every session, so tools/list is answered here per caller: only system
            // administrators see the administrator-only tenantId argument (G-19), descriptions honor the caller's
            // tenant overrides (G-3), and agents offered as their own tools are listed for their tenant (G-5).
            _Server.RegisterMethod("tools/list", (RpcParameters? args, RpcCallContext? call, CancellationToken ct) => ListToolsAsync(PrincipalClaims.Decode(call?.Claims), ct));

            _ServerTask = _Server.StartAsync(_Cts.Token);
            await Task.Delay(100, token).ConfigureAwait(false);
            if (_ServerTask.IsFaulted) throw new InvalidOperationException("MCP server failed to start on internal port " + _InternalPort + ": " + _ServerTask.Exception?.GetBaseException().Message);

            _Proxy = new McpClusterProxy(_Context, _InternalPort, _ProxySecret, localId => _Server?.RemoveSession(localId));
            _Proxy.BeforeForward = PrepareRequestAsync;
            _Proxy.Start();
            _Context.Logging.Info(_Header + "listening on " + _Context.Settings.Mcp.Hostname + ":" + _Context.Settings.Mcp.Port + _Context.Settings.Mcp.Path + " (internal endpoint 127.0.0.1:" + _InternalPort + ")");
        }

        /// <summary>
        /// Stop listening.
        /// </summary>
        public void Stop()
        {
            try
            {
                _Proxy?.Stop();
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
                _Proxy?.Dispose();
                _Server?.Dispose();
                _Cts?.Dispose();
            }
            _Disposed = true;
        }

        #endregion

        #region Private-Methods

        /// <summary>
        /// Seed any missing MCP tool description templates, refresh changed built-in ones, and return the description
        /// of every tool keyed by tool name. Runs under the database startup lock. Internal so tests can drive it.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Descriptions keyed by tool name.</returns>
        internal async Task<Dictionary<string, string>> LoadDescriptionsAsync(CancellationToken token)
        {
            // Replicas starting together on one database seed the tool description templates one at a time, so
            // the read-then-create below cannot insert the same built-in twice (P10.9).
            await using (DatabaseLockHandle startupLock = await _Context.Database.AcquireStartupLockAsync(token).ConfigureAwait(false))
            {
                return await LoadDescriptionsLockedAsync(token).ConfigureAwait(false);
            }
        }

        private async Task<Dictionary<string, string>> LoadDescriptionsLockedAsync(CancellationToken token)
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

        private async Task<object> ListToolsAsync(RequestContext ctx, CancellationToken token)
        {
            bool administrator = SeesAdministratorArguments(ctx);
            string? tenantId = ctx.IsAuthenticated ? ctx.TenantId : null;
            bool studio = ctx.PrincipalType != PrincipalTypeEnum.Run || await DraftGrantAsync(ctx, token).ConfigureAwait(false);
            bool shadow = ctx.PrincipalType == PrincipalTypeEnum.Run && await ShadowRunAsync(ctx, token).ConfigureAwait(false);
            List<ToolDefinition> tools = new List<ToolDefinition>();
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                if (shadow && ShadowRunPolicy.Refuses(tool)) continue;
                if (tool.Name.StartsWith("garrison_memory_", StringComparison.Ordinal) && !_Context.Settings.AgentMemory.Enabled) continue;
                if (tool.UserOnly && !ManagementCaller(ctx)) continue;
                if (tool.ResourceType == ResourceTypeEnum.StudioDraft && !studio) continue;
                if (tool.Name.StartsWith("garrison_keeper_", StringComparison.Ordinal) && await KeeperRunAsync(ctx, token).ConfigureAwait(false) == null) continue;
                if ((RunOnlyEscalationTool(tool.Name) || RunOnlyMessageTool(tool.Name)) && ctx.PrincipalType != PrincipalTypeEnum.Run) continue;
                if (tool.Name.StartsWith("garrison_org_", StringComparison.Ordinal) && ctx.PrincipalType == PrincipalTypeEnum.Run && !await OrgMemberRunAsync(ctx, token).ConfigureAwait(false)) continue;
                if (tool.Name == "garrison_list_change_rules" && ctx.PrincipalType == PrincipalTypeEnum.Run && await _Context.Get<ExecutiveAuthority>().ResolveRunAsync(ctx, token).ConfigureAwait(false) == null) continue;
                if (tool.Name == "garrison_subordinate_performance" && ctx.PrincipalType == PrincipalTypeEnum.Run && !await UnitLeadRunAsync(ctx, token).ConfigureAwait(false)) continue;
                if ((tool.Name == "garrison_run_eval" || tool.Name == "garrison_get_eval_run") && ctx.PrincipalType == PrincipalTypeEnum.Run && await _Context.Get<ExecutiveAuthority>().ResolveRunAsync(ctx, token).ConfigureAwait(false) == null) continue;
                string description = await ToolDescriptionAsync(tenantId, tool, token).ConfigureAwait(false);
                tools.Add(Definition(tool.Name, description, administrator ? _AdministratorSchemas[tool.Name] : _PublicSchemas[tool.Name], tool.Annotations));
            }
            if (!String.IsNullOrEmpty(tenantId) && !shadow)
            {
                AgentCardService cards = _Context.Get<AgentCardService>();
                foreach (Agent agent in await AgentToolsAsync(ctx, tenantId, token).ConfigureAwait(false))
                {
                    string description = await cards.ToolDescriptionAsync(tenantId, agent, token).ConfigureAwait(false);
                    tools.Add(Definition(AgentToolName(agent), description, administrator ? _AgentToolAdministratorSchema : _AgentToolPublicSchema));
                }
            }
            McpListToolsResult result = new McpListToolsResult();
            result.Tools = tools;
            result.CacheScope = "private";
            return result;
        }

        private async Task<bool> ShadowRunAsync(RequestContext ctx, CancellationToken token)
        {
            // AA-027, AA-074: a shadow or eval run is shown only the tools it may call.
            if (String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return false;
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            return ShadowRunPolicy.IsRestricted(run);
        }

        private async Task<bool> DraftGrantAsync(RequestContext ctx, CancellationToken token)
        {
            // Runs see the studio tools only when their deployment grants managementAccess Drafts (AD7.4) or OrgSubtree (AA8.1).
            if (String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return false;
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            if (run == null) return false;
            Deployment? deployment = await _Context.Database.Deployments.ReadAsync(ctx.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            return deployment != null && (deployment.ManagementAccess == ManagementAccessEnum.Drafts || deployment.ManagementAccess == ManagementAccessEnum.OrgSubtree);
        }

        private async Task<List<Agent>> AgentToolsAsync(RequestContext ctx, string tenantId, CancellationToken token)
        {
            // Agents offered as their own MCP tools that this caller may execute, one per tool name: when two agents
            // claim the same name, the older agent keeps it. Run principals see only agents they may delegate to.
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            query.ActiveOnly = true;
            EnumerationResult<Agent> page = await _Context.Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
            List<Agent> exposed = page.Objects
                .Where(a => a.ExposeMcpTool && a.Active && IsValidAgentToolName(AgentToolName(a)))
                .OrderBy(a => a.CreatedUtc)
                .ThenBy(a => a.Id, StringComparer.Ordinal)
                .ToList();
            exposed = await VisibleToRunAsync(ctx, tenantId, exposed, token).ConfigureAwait(false);

            List<Agent> tools = new List<Agent>();
            HashSet<string> names = new HashSet<string>(StringComparer.Ordinal);
            foreach (Agent agent in exposed)
            {
                if (!names.Add(AgentToolName(agent))) continue;
                AuthorizationDecision decision = await _Context.Authorization.AuthorizeAsync(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);
                if (decision.Permitted) tools.Add(agent);
            }
            return tools;
        }

        private async Task<List<Agent>> VisibleToRunAsync(RequestContext ctx, string tenantId, List<Agent> agents, CancellationToken token)
        {
            if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.RunId)) return agents;
            Run? parent = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
            Agent? caller = parent == null ? null : await EffectiveAgent.ForRunAsync(_Context.Database, parent, token).ConfigureAwait(false);
            if (caller == null || caller.DelegationMode == DelegationModeEnum.None) return new List<Agent>();
            List<Agent> visible = agents;
            if (caller.DelegationMode == DelegationModeEnum.AllowList) visible = visible.Where(a => caller.DelegationAllowList.Contains(a.Name)).ToList();
            return visible.Where(a => a.Id != caller.Id || caller.DelegationAllowRecursion).ToList();
        }

        private async Task PrepareRequestAsync(RequestContext caller, byte[] body, CancellationToken token)
        {
            // Voltaic answers tools/call only for registered tools, so an agent tool is registered on this replica the
            // first time any caller names one their tenant offers. Registration is permanent for the process; calls
            // still resolve the agent in the caller's tenant each time, so a stale registration only yields NotFound.
            if (_Server == null || body.Length > _Context.Settings.Mcp.MaxMessageSize) return;
            McpToolCallEnvelope? envelope = null;
            try
            {
                envelope = Serializer.Deserialize<McpToolCallEnvelope>(Encoding.UTF8.GetString(body));
            }
            catch (Exception e) when (e is JsonException || e is NotSupportedException || e is ArgumentException)
            {
                return;
            }
            if (envelope == null || !String.Equals(envelope.Method, "tools/call", StringComparison.Ordinal)) return;
            string? name = envelope.Params?.Name;
            if (!IsValidAgentToolName(name)) return;
            lock (_AgentToolLock)
            {
                if (_RegisteredAgentTools.Contains(name!)) return;
            }

            string? tenantId = caller.TenantId;
            if (String.IsNullOrEmpty(tenantId) && SeesAdministratorArguments(caller)) tenantId = envelope.Params?.Arguments?.TenantId;
            if (String.IsNullOrEmpty(tenantId)) return;
            List<Agent> offered = await AgentToolsAsync(caller, tenantId, token).ConfigureAwait(false);
            if (!offered.Any(a => AgentToolName(a) == name)) return;

            lock (_AgentToolLock)
            {
                if (!_RegisteredAgentTools.Add(name!)) return;
            }
            McpToolDefinition tool = new McpToolDefinition();
            tool.Name = name!;
            tool.ResourceType = ResourceTypeEnum.Agent;
            tool.Operation = OperationTypeEnum.Execute;
            tool.AgentTool = true;
            tool.InputSchemaJson = McpToolCatalog.AgentToolInputSchemaJson;
            tool.AdministratorInputSchemaJson = McpToolCatalog.AgentToolAdministratorInputSchemaJson;
            _Server.RegisterTool(tool.Name, "Garrison agent " + tool.Name + ".", _AgentToolAdministratorSchema, (RpcParameters? args, RpcCallContext? call, CancellationToken ct) => DispatchAsync(tool, args, call, ct));
        }

        private static ToolDefinition Definition(string name, string description, JsonElement schema, EffectToolMetadata? annotations = null)
        {
            ToolDefinition definition = new ToolDefinition();
            definition.Name = name;
            definition.Description = description;
            definition.InputSchema = schema;
            definition.Annotations = new McpAnnotations
            {
                ReadOnlyHint = annotations?.ReadOnlyHint,
                IdempotentHint = annotations?.IdempotentHint,
                DestructiveHint = annotations?.DestructiveHint
            };
            return definition;
        }

        private async Task<AuthenticationResult> AuthenticateAsync(HttpListenerRequest request)
        {
            // Requests relayed by the cluster proxy were authenticated there once (so signed-request nonces are used
            // once); the per-process secret proves the headers came from it.
            string? proxySecret = request.Headers[McpClusterProxy.ProxySecretHeader];
            if (proxySecret != null)
            {
                if (!PasswordHasher.FixedTimeEquals(proxySecret, _ProxySecret)) return AuthenticationResult.BearerChallenge(null, "invalid_token", "Authentication is required.");
                string? principal = request.Headers[McpClusterProxy.ProxyPrincipalHeader];
                string? encoded = request.Headers[McpClusterProxy.ProxyClaimsHeader];
                if (String.IsNullOrEmpty(principal) || String.IsNullOrEmpty(encoded)) return AuthenticationResult.BearerChallenge(null, "invalid_token", "Authentication is required.");
                Dictionary<string, string>? claims = null;
                try
                {
                    claims = Serializer.Deserialize<Dictionary<string, string>>(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(encoded)));
                }
                catch (Exception e) when (e is FormatException || e is JsonException || e is NotSupportedException)
                {
                    claims = null;
                }
                if (claims == null) return AuthenticationResult.BearerChallenge(null, "invalid_token", "Authentication is required.");
                AuthenticationResult proxied = new AuthenticationResult();
                proxied.IsAuthenticated = true;
                proxied.Principal = principal;
                proxied.Claims = claims;
                return proxied;
            }

            RequestContext ctx;
            try
            {
                ctx = await _Context.Authentication.ResolveAsync(request.Headers, request.HttpMethod, request.Url?.AbsolutePath ?? "/", request.Url?.Query?.TrimStart('?'), null, request.RemoteEndPoint?.Address?.ToString(), CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception e) when (DatabaseFailures.Classify(e) != DatabaseFailureEnum.None)
            {
                DatabaseFailureEnum failure = DatabaseFailures.Classify(e);
                _Context.Logging.Warn(_Header + "database " + failure.ToString().ToLowerInvariant() + " while authenticating an MCP request: " + e.Message);
                AuthenticationResult unavailable = new AuthenticationResult();
                unavailable.IsAuthenticated = false;
                unavailable.StatusCode = 503;
                unavailable.ErrorMessage = failure == DatabaseFailureEnum.Busy ? "DatabaseBusy: the database has no free connections right now; retry later." : "DatabaseUnavailable: the database cannot be reached right now; retry later.";
                unavailable.Headers["Retry-After"] = Math.Max(1, _Context.Settings.Rest.DatabaseRetryAfterSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
                return unavailable;
            }
            if (!ctx.IsAuthenticated) return AuthenticationResult.BearerChallenge(null, "invalid_token", "Authentication is required.");
            AuthenticationResult result = new AuthenticationResult();
            result.IsAuthenticated = true;
            result.Principal = PrincipalClaims.Principal(ctx);
            result.Claims = PrincipalClaims.Encode(ctx);
            return result;
        }

        private string? ProxiedClient(HttpListenerRequest request)
        {
            string? proxySecret = request.Headers[McpClusterProxy.ProxySecretHeader];
            if (proxySecret == null || !PasswordHasher.FixedTimeEquals(proxySecret, _ProxySecret)) return null;
            return request.Headers[McpClusterProxy.ProxyClientHeader];
        }

        private static int FreeLoopbackPort()
        {
            TcpListener listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            try
            {
                return ((IPEndPoint)listener.LocalEndpoint).Port;
            }
            finally
            {
                listener.Stop();
            }
        }

        private static McpToolCallResult Structured(object? result)
        {
            // The result is the record itself as structuredContent (MCP 2025-06-18), serialized the way REST serializes it,
            // with the same JSON in the text block (readable, quotes not escaped) for clients that read only text. A result
            // that is not an object (a list, a string) goes as text only, as MCP requires before 2026-07-28.
            string json = Serializer.SerializeReadable(result);
            using (JsonDocument document = JsonDocument.Parse(json))
            {
                if (document.RootElement.ValueKind != JsonValueKind.Object) return McpToolCallResult.FromText(json);
                McpToolCallResult structured = McpToolCallResult.FromText(json);
                structured.StructuredContent = document.RootElement.Clone();
                return structured;
            }
        }

        private async Task<object> DispatchAsync(McpToolDefinition tool, RpcParameters? args, RpcCallContext? call, CancellationToken token)
        {
            return await RunDatabaseTelemetry.MeasureAsync(_Context.Database, PrincipalClaims.Decode(call?.Claims).TenantId ?? string.Empty, PrincipalClaims.Decode(call?.Claims).RunId ?? string.Empty, "gateway", ct => GatewayOperation.MeasureAsync(inner => DispatchMeasuredCoreAsync(tool, args, call, inner), ct, PrincipalClaims.Decode(call?.Claims).PrincipalType == PrincipalTypeEnum.Run ? "run" : "operator"), token).ConfigureAwait(false);
        }

        private async Task<object> DispatchMeasuredCoreAsync(McpToolDefinition tool, RpcParameters? args, RpcCallContext? call, CancellationToken token)
        {
            RequestContext ctx = PrincipalClaims.Decode(call?.Claims);
            if (ctx.PrincipalType != PrincipalTypeEnum.Run) return await GatewayOperation.DispatchAsync(ct => DispatchCoreAsync(tool, args, call, ct), token).ConfigureAwait(false);
            // Session claims survive for an MCP session. Re-read the persisted session on every call rather than trusting
            // the epoch observed when the transport connected.
            if (String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId) || String.IsNullOrEmpty(ctx.SessionId)) throw ToolError("Unauthorized", "A current run session is required.");
            AuthSession? session = await ApplicationOperation.MeasureAsync("gateway", "session_validate", ct => _Context.Database.Sessions.ReadAsync(ctx.TenantId, ctx.SessionId, ct), token).ConfigureAwait(false);
            Run? run = await ApplicationOperation.MeasureAsync("gateway", "lease_validate", ct => _Context.Database.Runs.ReadRowAsync(ctx.RunId, ct), token).ConfigureAwait(false);
            if (session == null || session.RevokedUtc.HasValue || session.ExpiresUtc <= DateTime.UtcNow || !session.LeaseEpoch.HasValue
                || run == null || run.TenantId != ctx.TenantId || session.LeaseEpoch.Value != run.LeaseEpoch || !run.LeaseExpiresUtc.HasValue || run.LeaseExpiresUtc.Value <= DateTime.UtcNow
                || run.CancelRequested || (run.Status != RunStatusEnum.Running && run.Status != RunStatusEnum.Leased))
                throw ToolError("LeaseExpired", "The run session no longer holds an active lease.");
            // AA-027, AA-074: a shadow or eval run's token refuses every effect, checked on the run row read for this call.
            if (ShadowRunPolicy.IsRestricted(run) && ShadowRunPolicy.Refuses(tool)) throw ToolError(ShadowRunPolicy.RefusalCodeFor(run), ShadowRunPolicy.RefusalMessageFor(tool.Name, run));
            // Read operations cannot cause external effects. Every other tool is conservatively journaled.
            if (!EffectClassificationRules.RequiresJournal(tool.Operation, tool.AgentTool, tool.Annotations)) return await GatewayOperation.DispatchAsync(ct => DispatchCoreAsync(tool, args, call, ct), token).ConfigureAwait(false);
            EffectOperation operation = new EffectOperation
            {
                TenantId = ctx.TenantId, RunId = ctx.RunId, LeaseEpoch = session.LeaseEpoch.Value, Tool = tool.Name,
                ArgumentDigest = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(Serializer.Serialize(args))))
            };
            if (!await ApplicationOperation.MeasureAsync("gateway", "journal_authorize", ct => _Context.Database.EffectOperations.AuthorizeAsync(operation, ct), token).ConfigureAwait(false)) throw ToolError("LeaseExpired", "The run lease expired before authorization.");
            if (!await ApplicationOperation.MeasureAsync("gateway", "journal_dispatch", ct => _Context.Database.EffectOperations.TransitionAsync(operation.TenantId, operation.RunId, operation.Id, operation.LeaseEpoch,
                EffectOperationStateEnum.Authorized, EffectOperationStateEnum.Dispatched, null, ct), token).ConfigureAwait(false)) throw ToolError("LeaseExpired", "The run lease expired before dispatch.");
            try
            {
                object result = await GatewayOperation.DispatchAsync(ct => DispatchCoreAsync(tool, args, call, ct, operation.Id), token).ConfigureAwait(false);
                if (!await ApplicationOperation.MeasureAsync("gateway", "journal_complete", ct => _Context.Database.EffectOperations.TransitionAsync(operation.TenantId, operation.RunId, operation.Id, operation.LeaseEpoch,
                    EffectOperationStateEnum.Dispatched, EffectOperationStateEnum.Completed, "mcp:" + operation.Id, ct), token).ConfigureAwait(false))
                    throw ToolError("EffectOutcomeUnknown", "The gateway could not commit the operation result.");
                return result;
            }
            catch
            {
                // The durable Dispatched state is itself unsafe if this best-effort update cannot reach the database.
                try
                {
                    await _Context.Database.EffectOperations.TransitionAsync(operation.TenantId, operation.RunId, operation.Id, operation.LeaseEpoch,
                        EffectOperationStateEnum.Dispatched, EffectOperationStateEnum.Unknown, null, CancellationToken.None).ConfigureAwait(false);
                }
                catch (Exception e) { _Context.Logging.Warn(_Header + "effect " + operation.Id + " remains Dispatched: " + e.Message); }
                throw;
            }
        }

        private async Task<object> DispatchCoreAsync(McpToolDefinition tool, RpcParameters? args, RpcCallContext? call, CancellationToken token, string? gatewayOperationId = null)
        {
            RequestContext ctx = PrincipalClaims.Decode(call?.Claims);
            if (!ctx.IsAuthenticated) throw ToolError("Unauthorized", "Authentication is required.");
            string? tenantId = ctx.TenantId ?? args?.GetString("tenantId");
            if (String.IsNullOrEmpty(tenantId)) throw ToolError("TenantRequired", "No tenant could be resolved. System administrators must pass tenantId.");

            string toolLabel = tool.AgentTool ? "agent" : tool.Name;
            GarrisonMetrics.Count(GarrisonMetricCatalog.McpToolCalls, "tool", toolLabel, "tenant", tenantId);
            long start = Stopwatch.GetTimestamp();
            string outcome = "error";
            Activity? span = GarrisonTracing.Start("mcp " + toolLabel, ActivityKind.Internal);
            span?.SetTag("garrison.mcp.tool", tool.Name);
            span?.SetTag("garrison.tenant", tenantId);
            try
            {
                if (tool.ManagementTool && !ManagementCaller(ctx)) throw ToolError("Forbidden", "Management tools require a user or developer API credential; hosted run and node tokens cannot manage configuration.");
                if (tool.UserOnly && !ManagementCaller(ctx)) throw ToolError("Forbidden", tool.Name + " requires a user or API credential; hosted run and node tokens cannot use it.");
                object result;
                switch (tool.Name)
                {
                    case "garrison_get_agent_configuration":
                    case "garrison_create_agent":
                    case "garrison_update_agent":
                    case "garrison_delete_agent":
                        result = await ManageAgentAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_deployments":
                        await Require(ctx, tenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                        result = await _Context.Database.Deployments.EnumerateAsync(tenantId, new EnumerationQuery { Search = args?.GetString("search"), MaxResults = (int)Math.Clamp(args?.GetInt64("maxResults") ?? 25, 1, 100) }, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_deployment":
                    case "garrison_create_deployment":
                    case "garrison_update_deployment":
                    case "garrison_delete_deployment":
                        result = await ManageDeploymentAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_pipeline":
                    case "garrison_create_pipeline":
                    case "garrison_update_pipeline":
                    case "garrison_delete_pipeline":
                        result = await ManagePipelineAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_pipelines":
                        result = await ListPipelinesAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_start_pipeline":
                        result = await StartPipelineAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_pipeline_run":
                        result = await GetPipelineRunAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_pipeline_runs":
                        result = await ListPipelineRunsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_cancel_pipeline_run":
                        PipelineRun pipelineRunToCancel = await RequirePipelineRunAsync(ctx, tenantId, ManagementArguments<McpPipelineRunArguments>(args).PipelineRunId, OperationTypeEnum.Update, token).ConfigureAwait(false);
                        result = await _Context.Get<PipelineService>().CancelAsync(ctx, pipelineRunToCancel, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_pipeline_reviews":
                        result = await ListPipelineReviewsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_decide_pipeline_review":
                        result = await DecidePipelineReviewAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_trigger":
                    case "garrison_create_trigger":
                    case "garrison_update_trigger":
                    case "garrison_delete_trigger":
                        result = await ManageTriggerAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_triggers":
                        result = await ListTriggersAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_trigger_fires":
                        result = await ListTriggerFiresAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_fire_trigger":
                        result = await FireTriggerAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_rotate_trigger_secret":
                        result = await RotateTriggerSecretAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_rotate_notification_endpoint_secret":
                        result = await RotateNotificationEndpointSecretAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_test_notification_endpoint":
                        result = await TestNotificationEndpointAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_notification_endpoint":
                    case "garrison_create_notification_endpoint":
                    case "garrison_update_notification_endpoint":
                    case "garrison_delete_notification_endpoint":
                        result = await ManageNotificationEndpointAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_notification_endpoints":
                        result = await ListNotificationEndpointsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_notification_deliveries":
                        result = await ListNotificationDeliveriesAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_agent_revisions":
                    case "garrison_get_agent_revision":
                    case "garrison_publish_agent_revision":
                        result = await AgentRevisionToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_files_list":
                    case "garrison_files_read":
                    case "garrison_files_write":
                    case "garrison_files_delete":
                        result = await FileToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_apps":
                    case "garrison_get_app":
                    case "garrison_create_app":
                    case "garrison_update_app":
                        result = await AppToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_clone_prompt_template":
                    case "garrison_update_prompt_template":
                    case "garrison_reset_prompt_template":
                    case "garrison_render_prompt_template":
                        result = await PromptTemplateToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_studio_list_architects":
                    case "garrison_studio_get_architect":
                    case "garrison_studio_create_architect":
                    case "garrison_studio_update_architect":
                    case "garrison_studio_delete_architect":
                    case "garrison_studio_list_architect_prompts":
                    case "garrison_studio_get_architect_prompt":
                    case "garrison_studio_set_architect_prompt":
                        result = await ArchitectToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_studio_list_drafts":
                    case "garrison_studio_create_draft":
                    case "garrison_studio_get_draft":
                    case "garrison_studio_put_item":
                    case "garrison_studio_remove_item":
                    case "garrison_studio_graph":
                    case "garrison_studio_graph_operation":
                    case "garrison_studio_diff":
                    case "garrison_studio_validate":
                    case "garrison_studio_request_apply":
                    case "garrison_studio_playground_invoke":
                        result = await StudioToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_agent_assets":
                    case "garrison_get_agent_asset":
                    case "garrison_create_agent_asset":
                    case "garrison_update_agent_asset":
                    case "garrison_upload_agent_asset_version":
                    case "garrison_delete_agent_asset":
                        result = await AgentAssetToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_promote":
                    case "garrison_rollback_promotion":
                        result = await PromotionToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_apply_manifest":
                        result = await ApplyManifestAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_export_manifest":
                        result = await ExportManifestAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_upload_artifact":
                        result = await UploadArtifactAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_agents":
                        result = await ListAgentsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_fan_out":
                    case "garrison_gather":
                    case "garrison_cancel_fan_out":
                        result = await FanOutToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_capabilities":
                    case "garrison_describe_capability":
                    case "garrison_studio_list_capabilities":
                    case "garrison_studio_describe_capability":
                        result = await CapabilityToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_mandates":
                    case "garrison_get_mandate":
                    case "garrison_create_mandate":
                    case "garrison_update_mandate":
                    case "garrison_publish_mandate_revision":
                    case "garrison_pause_mandate":
                    case "garrison_resume_mandate":
                    case "garrison_wake_mandate":
                    case "garrison_list_mandate_ticks":
                        result = await MandateToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_keeper_context":
                    case "garrison_keeper_complete_tick":
                        result = await KeeperToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_escalate":
                    case "garrison_get_escalation":
                    case "garrison_list_my_escalations":
                    case "garrison_withdraw_escalation":
                    case "garrison_answer_escalation":
                    case "garrison_list_escalations":
                        result = await EscalationToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_file_report":
                    case "garrison_list_reports":
                    case "garrison_get_report":
                        result = await ReportToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_send_message":
                    case "garrison_reply_message":
                    case "garrison_read_inbox":
                    case "garrison_ack_message":
                        result = await MessageToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_org_chart":
                    case "garrison_org_whoami":
                    case "garrison_list_organizations":
                    case "garrison_get_organization":
                    case "garrison_create_organization":
                    case "garrison_update_organization":
                    case "garrison_publish_org_revision":
                    case "garrison_rollback_organization":
                    case "garrison_unit_cancel_all":
                        result = await OrganizationToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_board_get":
                    case "garrison_board_direct":
                        result = await BoardToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_subordinate_performance":
                        result = await PerformanceToolAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_change_rules":
                    case "garrison_get_change_rule":
                    case "garrison_create_change_rule":
                    case "garrison_update_change_rule":
                    case "garrison_delete_change_rule":
                    case "garrison_list_org_proposals":
                    case "garrison_get_org_proposal":
                    case "garrison_decide_org_proposal":
                        result = await ChangeRuleToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_run_eval":
                    case "garrison_get_eval_run":
                    case "garrison_list_eval_sets":
                    case "garrison_create_eval_set":
                    case "garrison_approve_eval_set":
                        result = await EvalToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_freezes":
                    case "garrison_freeze":
                    case "garrison_lift_freeze":
                        result = await FreezeToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_shadow_trials":
                    case "garrison_get_shadow_trial":
                    case "garrison_start_shadow_trial":
                    case "garrison_stop_shadow_trial":
                        result = await ShadowTrialToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_canary_releases":
                    case "garrison_get_canary_release":
                    case "garrison_start_canary":
                    case "garrison_abort_canary":
                        result = await CanaryToolAsync(ctx, tenantId, tool, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_memory_read":
                    case "garrison_memory_write":
                    case "garrison_memory_delete":
                    case "garrison_memory_list":
                    case "garrison_memory_search":
                        result = await MemoryAsync(ctx, tenantId, tool.Name, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_agent":
                        result = await GetAgentAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_invoke_agent":
                        result = await InvokeAsync(ctx, tenantId, args, true, token, gatewayOperationId).ConfigureAwait(false);
                        break;
                    case "garrison_start_run":
                        result = await InvokeAsync(ctx, tenantId, args, false, token, gatewayOperationId).ConfigureAwait(false);
                        break;
                    case "garrison_get_run":
                        result = await SummarizeAsync(await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Read, token).ConfigureAwait(false), token).ConfigureAwait(false);
                        break;
                    case "garrison_get_run_events":
                        result = await EventsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_run_transcript":
                        result = await RunTranscriptAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_conversation_transcript":
                        result = await ConversationTranscriptAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_cancel_run":
                        Run toCancel = await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Update, token).ConfigureAwait(false);
                        result = await SummarizeAsync(await _Runs.CancelAsync(toCancel, token).ConfigureAwait(false), token).ConfigureAwait(false);
                        break;
                    case "garrison_list_runs":
                        result = await ListRunsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_permission_prompt":
                        result = await PermissionPromptAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_list_approvals":
                        result = await ListApprovalsAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    case "garrison_get_approval":
                        result = await RequireApprovalAsync(ctx, tenantId, args, OperationTypeEnum.Read, token).ConfigureAwait(false);
                        break;
                    case "garrison_decide_approval":
                        result = await DecideApprovalAsync(ctx, tenantId, args, token).ConfigureAwait(false);
                        break;
                    default:
                        if (!tool.AgentTool) throw ToolError("UnknownTool", "Unknown tool " + tool.Name + ".");
                        result = await AgentToolCallAsync(ctx, tenantId, tool.Name, args, token, gatewayOperationId).ConfigureAwait(false);
                        break;
                }
                outcome = "ok";
                GarrisonTracing.Ok(span);
                return Structured(result);
            }
            catch (McpToolException e)
            {
                GarrisonTracing.Fail(span, e);
                throw;
            }
            catch (Exception e) when (e is NotFoundException || e is ConflictException || e is ValidationException || e is ArgumentException || e is PayloadTooLargeException)
            {
                GarrisonTracing.Fail(span, e);
                if (e is ValidationException validation) throw ToolError("ValidationFailed", validation.Describe());
                if (e is ConflictException conflict) throw ToolError(conflict.Code, e.Message);
                if (e is NotFoundException) throw ToolError("NotFound", e.Message);
                if (e is PayloadTooLargeException tooLarge) throw ToolError(tooLarge.Code, e.Message);
                throw ToolError("BadRequest", e.Message);
            }
            catch (Exception e) when (DatabaseFailures.Classify(e) != DatabaseFailureEnum.None)
            {
                // A database outage or an exhausted pool is a retryable tool error, not an internal error (G-25).
                GarrisonTracing.Fail(span, e);
                if (DatabaseFailures.Classify(e) == DatabaseFailureEnum.Busy) throw ToolError("DatabaseBusy", "The database has no free connections right now. Retry in a few seconds.");
                throw ToolError("DatabaseUnavailable", "The database cannot be reached right now. Retry in a few seconds.");
            }
            catch (Exception e)
            {
                GarrisonTracing.Fail(span, e);
                throw;
            }
            finally
            {
                span?.Dispose();
                TagList tags = GarrisonMetrics.Tags("tool", toolLabel, "result", outcome);
                GarrisonMetrics.Count(GarrisonMetricCatalog.McpToolResults, 1, tags);
                GarrisonMetrics.Observe(GarrisonMetricCatalog.McpToolDuration, GarrisonMetrics.SecondsSince(start), tags);
            }
        }

        private static bool ManagementCaller(RequestContext ctx)
        {
            return ctx.PrincipalType == PrincipalTypeEnum.User || ctx.PrincipalType == PrincipalTypeEnum.Credential || ctx.PrincipalType == PrincipalTypeEnum.Administrator;
        }

        private static T ManagementArguments<T>(RpcParameters? args) where T : new()
        {
            if (String.IsNullOrWhiteSpace(args?.RawJson)) return new T();
            try { return Serializer.Deserialize<T>(args.RawJson) ?? new T(); }
            catch (JsonException) { throw ToolError("ValidationFailed", "The tool arguments do not match the tool's typed input contract."); }
        }

        private async Task<object> AgentRevisionToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpAgentRevisionArguments arguments = ManagementArguments<McpAgentRevisionArguments>(args);
            if (String.IsNullOrWhiteSpace(arguments.Agent)) throw ToolError("ValidationFailed", "agent is required.");
            Agent agent = await _Context.Database.Agents.ReadAsync(tenantId, arguments.Agent, token).ConfigureAwait(false)
                ?? await _Context.Database.Agents.ReadByNameAsync(tenantId, arguments.Agent, token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Agent " + arguments.Agent + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.AgentRevision, tool.Operation, agent.Id, token).ConfigureAwait(false);
            AgentRevisionService revisions = _Context.Get<AgentRevisionService>();
            if (tool.Name == "garrison_list_agent_revisions")
            {
                EnumerationQuery query = new EnumerationQuery { MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                return await revisions.EnumerateAsync(tenantId, agent, query, token).ConfigureAwait(false);
            }
            if (String.IsNullOrWhiteSpace(arguments.Revision)) throw ToolError("ValidationFailed", "revision is required.");
            if (tool.Name == "garrison_get_agent_revision") return await revisions.ReadAsync(tenantId, agent, arguments.Revision, token).ConfigureAwait(false);
            return await revisions.PublishAsync(ctx, tenantId, agent, arguments.Revision, arguments.ChangeNote, token).ConfigureAwait(false);
        }

        private async Task<object> FileToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpFileArguments arguments = ManagementArguments<McpFileArguments>(args);
            FileSpaceService files = _Context.Get<FileSpaceService>();
            ConversationFileSpace space;
            string? writerRunId = null;
            long? writerEpoch = null;
            string? writer = ctx.PrincipalName;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                // A run token reaches only its own tree's space (AD3.5).
                Run run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId ?? String.Empty, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run not found.");
                space = await files.ForRunAsync(run, token).ConfigureAwait(false);
                writerRunId = run.Id;
                writerEpoch = run.LeaseEpoch;
                writer = run.AgentName;
            }
            else if (!String.IsNullOrEmpty(arguments.ConversationId))
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Conversation, tool.Operation == OperationTypeEnum.Read ? OperationTypeEnum.Read : OperationTypeEnum.Update, arguments.ConversationId, token).ConfigureAwait(false);
                Conversation conversation = await _Context.Database.Conversations.ReadAsync(tenantId, arguments.ConversationId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Conversation not found.");
                space = await files.ForConversationAsync(tenantId, conversation, token).ConfigureAwait(false);
            }
            else if (!String.IsNullOrEmpty(arguments.RunId))
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Run, tool.Operation == OperationTypeEnum.Read ? OperationTypeEnum.Read : OperationTypeEnum.Update, arguments.RunId, token).ConfigureAwait(false);
                Run run = await _Context.Database.Runs.ReadAsync(tenantId, arguments.RunId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run not found.");
                space = await files.ForRunAsync(run, token).ConfigureAwait(false);
            }
            else
            {
                throw ToolError("ValidationFailed", "conversationId or runId is required outside a run.");
            }

            if (tool.Name == "garrison_files_list")
            {
                FileSpaceListing listing = new FileSpaceListing { FileSpaceId = space.Id, FileCount = space.FileCount, TotalBytes = space.TotalBytes };
                listing.Files = await _Context.Database.FileSpaces.ListFilesAsync(tenantId, space.Id, arguments.IncludeDeleted, token).ConfigureAwait(false);
                return listing;
            }
            if (String.IsNullOrWhiteSpace(arguments.Path)) throw ToolError("ValidationFailed", "path is required.");
            if (tool.Name == "garrison_files_write")
            {
                byte[] content;
                if (arguments.ContentBase64 != null)
                {
                    try { content = Convert.FromBase64String(arguments.ContentBase64); }
                    catch (FormatException) { throw ToolError("ValidationFailed", "contentBase64 is not valid base64."); }
                }
                else if (arguments.Content != null) content = Encoding.UTF8.GetBytes(arguments.Content);
                else throw ToolError("ValidationFailed", "content or contentBase64 is required.");
                return await files.WriteAsync(space, arguments.Path, content, arguments.MediaType, arguments.BaseVersion, writerRunId, writerEpoch, writer, token).ConfigureAwait(false);
            }
            if (tool.Name == "garrison_files_delete")
            {
                if (!await files.DeleteAsync(space, arguments.Path, token).ConfigureAwait(false)) throw ToolError("NotFound", "File " + arguments.Path + " not found.");
                return new McpConfigurationDeletion { Id = arguments.Path, Deleted = true };
            }
            ConversationFile file = await _Context.Database.FileSpaces.ReadFileAsync(tenantId, space.Id, arguments.Path, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "File " + arguments.Path + " not found.");
            FileSpaceContent read = await files.ReadAsync(space, file, arguments.Version, token).ConfigureAwait(false);
            McpFileContent result = new McpFileContent { Path = file.Path, Version = read.Version.Number, Sha256 = read.Version.Sha256, MediaType = read.Version.MediaType, SizeBytes = read.Version.SizeBytes };
            if (MediaTypes.IsText(read.Version.MediaType)) result.Content = Encoding.UTF8.GetString(read.Content);
            else result.ContentBase64 = Convert.ToBase64String(read.Content);
            return result;
        }

        private async Task<object> AgentAssetToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpAgentAssetArguments arguments = ManagementArguments<McpAgentAssetArguments>(args);
            AgentAssetService assets = _Context.Get<AgentAssetService>();
            if (tool.Name == "garrison_list_agent_assets")
            {
                await Require(ctx, tenantId, ResourceTypeEnum.AgentAsset, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                AgentAssetKindEnum? kind = null;
                if (!String.IsNullOrEmpty(arguments.Kind))
                {
                    if (!Enum.TryParse(arguments.Kind, true, out AgentAssetKindEnum parsed)) throw ToolError("ValidationFailed", "kind is SystemPrompt, Skill, ReferenceFile, or DocumentTemplate.");
                    kind = parsed;
                }
                EnumerationQuery query = new EnumerationQuery { Search = arguments.Search, MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                return await _Context.Database.AgentAssets.EnumerateAsync(tenantId, kind, query, token).ConfigureAwait(false);
            }
            if (tool.Name == "garrison_create_agent_asset")
            {
                await Require(ctx, tenantId, ResourceTypeEnum.AgentAsset, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                return await assets.CreateAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            if (String.IsNullOrWhiteSpace(arguments.Asset)) throw ToolError("ValidationFailed", "asset is required.");
            AgentAsset asset = await _Context.Database.AgentAssets.ReadAsync(tenantId, arguments.Asset, token).ConfigureAwait(false)
                ?? await _Context.Database.AgentAssets.ReadByNameAsync(tenantId, arguments.Asset, token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Asset " + arguments.Asset + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.AgentAsset, tool.Operation, asset.Id, token).ConfigureAwait(false);
            switch (tool.Name)
            {
                case "garrison_get_agent_asset":
                    McpAgentAssetDetail detail = new McpAgentAssetDetail { Asset = asset };
                    int number = arguments.Version ?? asset.CurrentVersion;
                    if (number > 0) detail.Version = await _Context.Database.AgentAssets.ReadVersionAsync(tenantId, asset.Id, number, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Version " + number + " of asset " + asset.Name + " not found.");
                    return detail;
                case "garrison_update_agent_asset":
                    return await assets.UpdateAsync(ctx, tenantId, asset, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
                case "garrison_upload_agent_asset_version":
                    List<AgentAssetFile> files = new List<AgentAssetFile>();
                    foreach (AgentAssetFileSpec file in arguments.Files ?? new List<AgentAssetFileSpec>())
                    {
                        string? base64 = file.ContentBase64 ?? (file.Content != null ? Convert.ToBase64String(Encoding.UTF8.GetBytes(file.Content)) : null);
                        files.Add(new AgentAssetFile { Path = file.Path, MediaType = file.MediaType ?? String.Empty, ContentBase64 = base64 });
                    }
                    return (await assets.UploadVersionAsync(ctx, tenantId, asset, files, null, arguments.ChangeNote, token).ConfigureAwait(false)).Version;
                default:
                    await assets.DeleteAsync(ctx, tenantId, asset, token).ConfigureAwait(false);
                    return new McpConfigurationDeletion { Id = asset.Id, Deleted = true };
            }
        }

        private async Task<object> PromotionToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpPromotionArguments arguments = ManagementArguments<McpPromotionArguments>(args);
            PromotionService promotions = _Context.Get<PromotionService>();
            Func<string, Task<bool>> authorizeTarget = async environment =>
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, environment, token).ConfigureAwait(false);
                return true;
            };
            PromotionRecord? record;
            if (tool.Name == "garrison_rollback_promotion")
            {
                if (String.IsNullOrWhiteSpace(arguments.PromotionId)) throw ToolError("ValidationFailed", "promotionId is required.");
                record = await promotions.RollbackAsync(ctx, tenantId, arguments.PromotionId, arguments.Note, authorizeTarget, token).ConfigureAwait(false);
            }
            else
            {
                PromotionRequest request = new PromotionRequest();
                request.AgentId = arguments.AgentId ?? String.Empty;
                request.SourceEnvironment = arguments.SourceEnvironment ?? String.Empty;
                request.TargetEnvironment = arguments.TargetEnvironment;
                request.AgentRevisionId = arguments.AgentRevisionId;
                request.AllowSkip = arguments.AllowSkip;
                request.Note = arguments.Note;
                record = await promotions.PromoteAsync(ctx, tenantId, request, authorizeTarget, token).ConfigureAwait(false);
            }
            return record ?? throw ToolError("Forbidden", "Not permitted.");
        }

        private async Task<object> ManageAgentAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpAgentConfigurationArguments arguments = ManagementArguments<McpAgentConfigurationArguments>(args);
            if (tool.Operation == OperationTypeEnum.Create)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Agent, tool.Operation, null, token).ConfigureAwait(false);
                return await _Mutations.CreateAgentAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            Agent existing = await _Invoker.ResolveAgentAsync(tenantId, arguments.Agent, token).ConfigureAwait(false);
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, tool.Operation, existing.Id, token).ConfigureAwait(false);
            if (tool.Operation == OperationTypeEnum.Read) return existing;
            if (tool.Operation == OperationTypeEnum.Update)
                return await _Mutations.UpdateAgentAsync(ctx, tenantId, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            return new McpConfigurationDeletion { Id = existing.Id, Deleted = await _Mutations.DeleteAgentAsync(ctx, tenantId, existing, token).ConfigureAwait(false) };
        }

        private async Task<object> ManageDeploymentAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpDeploymentConfigurationArguments arguments = ManagementArguments<McpDeploymentConfigurationArguments>(args);
            if (tool.Operation == OperationTypeEnum.Create)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Deployment, tool.Operation, null, token).ConfigureAwait(false);
                return await _Mutations.CreateDeploymentAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            if (String.IsNullOrWhiteSpace(arguments.DeploymentId)) throw ToolError("ValidationFailed", "deploymentId is required.");
            Deployment existing = await _Context.Database.Deployments.ReadAsync(tenantId, arguments.DeploymentId, token).ConfigureAwait(false) ?? throw new NotFoundException("Deployment not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.Deployment, tool.Operation, existing.Id, token).ConfigureAwait(false);
            if (tool.Operation == OperationTypeEnum.Read) return existing;
            if (tool.Operation == OperationTypeEnum.Update)
                return await _Mutations.UpdateDeploymentAsync(ctx, tenantId, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            return new McpConfigurationDeletion { Id = existing.Id, Deleted = await _Mutations.DeleteDeploymentAsync(ctx, tenantId, existing, token).ConfigureAwait(false) };
        }

        private async Task<object> ManagePipelineAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpPipelineConfigurationArguments arguments = ManagementArguments<McpPipelineConfigurationArguments>(args);
            if (tool.Operation == OperationTypeEnum.Create)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Pipeline, tool.Operation, null, token).ConfigureAwait(false);
                return await _Mutations.CreatePipelineAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            Pipeline existing = await RequirePipelineAsync(ctx, tenantId, arguments.Pipeline, tool.Operation, token).ConfigureAwait(false);
            if (tool.Operation == OperationTypeEnum.Read) return existing;
            if (tool.Operation == OperationTypeEnum.Update)
                return await _Mutations.UpdatePipelineAsync(ctx, tenantId, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            return new McpConfigurationDeletion { Id = existing.Id, Deleted = await _Mutations.DeletePipelineAsync(ctx, tenantId, existing, token).ConfigureAwait(false) };
        }

        private async Task<object> ManageTriggerAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpTriggerConfigurationArguments arguments = ManagementArguments<McpTriggerConfigurationArguments>(args);
            Func<ResourceTypeEnum, string, Task<bool>> target = async (resourceType, resourceId) =>
            {
                await Require(ctx, tenantId, resourceType, OperationTypeEnum.Execute, resourceId, token).ConfigureAwait(false);
                return true;
            };
            if (tool.Operation == OperationTypeEnum.Create)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Trigger, tool.Operation, null, token).ConfigureAwait(false);
                Trigger? created = await _Mutations.CreateTriggerAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), target, token).ConfigureAwait(false);
                return created ?? throw ToolError("Forbidden", "Not permitted to run the trigger's target.");
            }
            Trigger existing = await RequireTriggerAsync(ctx, tenantId, arguments.Trigger, tool.Operation, token).ConfigureAwait(false);
            if (tool.Operation == OperationTypeEnum.Read) return existing;
            if (tool.Operation == OperationTypeEnum.Update)
            {
                Trigger? updated = await _Mutations.UpdateTriggerAsync(ctx, tenantId, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), target, token).ConfigureAwait(false);
                return updated ?? throw ToolError("Forbidden", "Not permitted to run the trigger's target.");
            }
            return new McpConfigurationDeletion { Id = existing.Id, Deleted = await _Mutations.DeleteTriggerAsync(ctx, tenantId, existing, token).ConfigureAwait(false) };
        }

        private async Task<Trigger> RequireTriggerAsync(RequestContext ctx, string tenantId, string? idOrName, OperationTypeEnum operation, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) throw ToolError("ValidationFailed", "trigger is required.");
            string reference = idOrName.Trim();
            Trigger? trigger = await _Context.Database.Triggers.ReadAsync(tenantId, reference, token).ConfigureAwait(false);
            if (trigger == null) trigger = await _Context.Database.Triggers.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
            if (trigger == null) throw ToolError("NotFound", "Trigger " + reference + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.Trigger, operation, trigger.Id, token).ConfigureAwait(false);
            return trigger;
        }

        private async Task<object> ListTriggersAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Trigger, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpTriggerListArguments arguments = ManagementArguments<McpTriggerListArguments>(args);
            TriggerTypeEnum? type = null;
            if (!String.IsNullOrWhiteSpace(arguments.Type))
            {
                if (!Enum.TryParse<TriggerTypeEnum>(arguments.Type, true, out TriggerTypeEnum parsed) || !Enum.IsDefined(parsed)) throw ToolError("ValidationFailed", "type must be Cron or Webhook.");
                type = parsed;
            }
            EnumerationQuery query = new EnumerationQuery();
            query.Search = String.IsNullOrWhiteSpace(arguments.Search) ? null : arguments.Search.Trim();
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.Triggers.EnumerateAsync(tenantId, type, query, token).ConfigureAwait(false);
        }

        private async Task<object> ListTriggerFiresAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpTriggerFireListArguments arguments = ManagementArguments<McpTriggerFireListArguments>(args);
            Trigger trigger = await RequireTriggerAsync(ctx, tenantId, arguments.Trigger, OperationTypeEnum.Read, token).ConfigureAwait(false);
            TriggerFireOutcomeEnum? outcome = null;
            if (!String.IsNullOrWhiteSpace(arguments.Outcome))
            {
                if (!Enum.TryParse<TriggerFireOutcomeEnum>(arguments.Outcome, true, out TriggerFireOutcomeEnum parsed) || !Enum.IsDefined(parsed)) throw ToolError("ValidationFailed", "outcome must be Started, Failed, or Skipped.");
                outcome = parsed;
            }
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.TriggerFires.EnumerateAsync(tenantId, trigger.Id, outcome, query, token).ConfigureAwait(false);
        }

        private async Task<object> FireTriggerAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpTriggerFireArguments arguments = ManagementArguments<McpTriggerFireArguments>(args);
            Trigger trigger = await RequireTriggerAsync(ctx, tenantId, arguments.Trigger, OperationTypeEnum.Execute, token).ConfigureAwait(false);
            TriggerService triggers = _Context.Get<TriggerService>();
            byte[]? body = String.IsNullOrEmpty(arguments.Body) ? null : System.Text.Encoding.UTF8.GetBytes(arguments.Body);
            if (body != null && body.Length > triggers.Options.WebhookMaxBodyBytes) throw ToolError("ValidationFailed", "body is larger than " + triggers.Options.WebhookMaxBodyBytes + " bytes (Triggers.WebhookMaxBodyBytes).");
            TriggerFire fire = await triggers.FireAsync(trigger, TriggerFireSourceEnum.Manual, DateTime.UtcNow, null, body, arguments.ContentType, token).ConfigureAwait(false);
            await _Context.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "Trigger", trigger.Id,
                "Fired trigger " + trigger.Name + " by hand: " + fire.Outcome + (fire.ErrorCode != null ? " (" + fire.ErrorCode + ")" : String.Empty) + ".", tenantId, token).ConfigureAwait(false);
            return fire;
        }

        private async Task<object> RotateTriggerSecretAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpTriggerConfigurationArguments arguments = ManagementArguments<McpTriggerConfigurationArguments>(args);
            Trigger existing = await RequireTriggerAsync(ctx, tenantId, arguments.Trigger, OperationTypeEnum.Update, token).ConfigureAwait(false);
            return await _Mutations.RotateTriggerSecretAsync(ctx, tenantId, existing, token).ConfigureAwait(false);
        }

        private async Task<object> RotateNotificationEndpointSecretAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpNotificationEndpointConfigurationArguments arguments = ManagementArguments<McpNotificationEndpointConfigurationArguments>(args);
            NotificationEndpoint existing = await RequireNotificationEndpointAsync(ctx, tenantId, arguments.Endpoint, OperationTypeEnum.Update, token).ConfigureAwait(false);
            return await _Mutations.RotateNotificationEndpointSecretAsync(ctx, tenantId, existing, token).ConfigureAwait(false);
        }

        private async Task<object> TestNotificationEndpointAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpNotificationEndpointConfigurationArguments arguments = ManagementArguments<McpNotificationEndpointConfigurationArguments>(args);
            NotificationEndpoint endpoint = await RequireNotificationEndpointAsync(ctx, tenantId, arguments.Endpoint, OperationTypeEnum.Execute, token).ConfigureAwait(false);
            return await _Context.Get<NotificationService>().SendTestAsync(endpoint, token).ConfigureAwait(false);
        }

        private async Task<object> ManageNotificationEndpointAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpNotificationEndpointConfigurationArguments arguments = ManagementArguments<McpNotificationEndpointConfigurationArguments>(args);
            if (tool.Operation == OperationTypeEnum.Create)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.NotificationEndpoint, tool.Operation, null, token).ConfigureAwait(false);
                return await _Mutations.CreateNotificationEndpointAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            NotificationEndpoint existing = await RequireNotificationEndpointAsync(ctx, tenantId, arguments.Endpoint, tool.Operation, token).ConfigureAwait(false);
            if (tool.Operation == OperationTypeEnum.Read) return existing;
            if (tool.Operation == OperationTypeEnum.Update)
                return await _Mutations.UpdateNotificationEndpointAsync(ctx, tenantId, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            return new McpConfigurationDeletion { Id = existing.Id, Deleted = await _Mutations.DeleteNotificationEndpointAsync(ctx, tenantId, existing, token).ConfigureAwait(false) };
        }

        private async Task<NotificationEndpoint> RequireNotificationEndpointAsync(RequestContext ctx, string tenantId, string? idOrName, OperationTypeEnum operation, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) throw ToolError("ValidationFailed", "endpoint is required.");
            string reference = idOrName.Trim();
            NotificationEndpoint? endpoint = await _Context.Database.NotificationEndpoints.ReadAsync(tenantId, reference, token).ConfigureAwait(false);
            if (endpoint == null) endpoint = await _Context.Database.NotificationEndpoints.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
            if (endpoint == null) throw ToolError("NotFound", "Notification endpoint " + reference + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.NotificationEndpoint, operation, endpoint.Id, token).ConfigureAwait(false);
            return endpoint;
        }

        private async Task<object> ListNotificationEndpointsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.NotificationEndpoint, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpNotificationEndpointListArguments arguments = ManagementArguments<McpNotificationEndpointListArguments>(args);
            EnumerationQuery query = new EnumerationQuery();
            query.Search = String.IsNullOrWhiteSpace(arguments.Search) ? null : arguments.Search.Trim();
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.NotificationEndpoints.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
        }

        private async Task<object> ListNotificationDeliveriesAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpNotificationDeliveryListArguments arguments = ManagementArguments<McpNotificationDeliveryListArguments>(args);
            NotificationEndpoint endpoint = await RequireNotificationEndpointAsync(ctx, tenantId, arguments.Endpoint, OperationTypeEnum.Read, token).ConfigureAwait(false);
            NotificationDeliveryStatusEnum? status = null;
            if (!String.IsNullOrWhiteSpace(arguments.Status))
            {
                if (!Enum.TryParse<NotificationDeliveryStatusEnum>(arguments.Status, true, out NotificationDeliveryStatusEnum parsed) || !Enum.IsDefined(parsed)) throw ToolError("ValidationFailed", "status must be Pending, Delivering, Succeeded, or Failed.");
                status = parsed;
            }
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.NotificationDeliveries.EnumerateAsync(tenantId, endpoint.Id, status, query, token).ConfigureAwait(false);
        }

        private async Task<Pipeline> RequirePipelineAsync(RequestContext ctx, string tenantId, string? idOrName, OperationTypeEnum operation, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(idOrName)) throw ToolError("ValidationFailed", "pipeline is required.");
            string reference = idOrName.Trim();
            Pipeline? pipeline = await _Context.Database.Pipelines.ReadAsync(tenantId, reference, token).ConfigureAwait(false);
            if (pipeline == null) pipeline = await _Context.Database.Pipelines.ReadByNameAsync(tenantId, reference, token).ConfigureAwait(false);
            if (pipeline == null) throw ToolError("NotFound", "Pipeline " + reference + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.Pipeline, operation, pipeline.Id, token).ConfigureAwait(false);
            return pipeline;
        }

        private async Task<object> ListPipelinesAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Pipeline, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpPipelineListArguments arguments = ManagementArguments<McpPipelineListArguments>(args);
            EnumerationQuery query = new EnumerationQuery();
            query.Search = String.IsNullOrWhiteSpace(arguments.Search) ? null : arguments.Search.Trim();
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.Pipelines.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
        }

        private async Task<object> StartPipelineAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpPipelineStartArguments arguments = ManagementArguments<McpPipelineStartArguments>(args);
            Pipeline pipeline = await RequirePipelineAsync(ctx, tenantId, arguments.Pipeline, OperationTypeEnum.Execute, token).ConfigureAwait(false);
            if (String.IsNullOrWhiteSpace(arguments.Input)) throw ToolError("ValidationFailed", "input is required.");

            // Starting a pipeline runs every stage agent on the caller's behalf, so the caller needs Agent Execute on each.
            foreach (string agentId in pipeline.Stages.Select(s => s.AgentId).Distinct(StringComparer.Ordinal))
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId, token).ConfigureAwait(false);
            }

            PipelineStartRequest request = new PipelineStartRequest();
            request.Input = arguments.Input;
            request.InputContentType = arguments.InputContentType;
            request.Priority = arguments.Priority ?? 0;
            request.WaitSeconds = PipelineWaitSeconds(arguments.WaitSeconds);
            request.Wait = request.WaitSeconds > 0;
            return await _Context.Get<PipelineService>().StartAsync(ctx, pipeline, request, arguments.IdempotencyKey, token).ConfigureAwait(false);
        }

        private async Task<object> GetPipelineRunAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpPipelineRunArguments arguments = ManagementArguments<McpPipelineRunArguments>(args);
            PipelineRun run = await RequirePipelineRunAsync(ctx, tenantId, arguments.PipelineRunId, OperationTypeEnum.Read, token).ConfigureAwait(false);
            PipelineService pipelines = _Context.Get<PipelineService>();
            int waitSeconds = PipelineWaitSeconds(arguments.WaitSeconds);
            if (waitSeconds > 0) run = await pipelines.WaitAsync(tenantId, run.Id, waitSeconds, token).ConfigureAwait(false) ?? run;
            return await pipelines.DetailAsync(run, token).ConfigureAwait(false);
        }

        private int PipelineWaitSeconds(int? requested)
        {
            if (!requested.HasValue || requested.Value <= 0) return 0;
            return Math.Clamp(requested.Value, 0, Math.Min(600, _Context.Settings.Mcp.MaxToolWaitSeconds));
        }

        private async Task<PipelineRun> RequirePipelineRunAsync(RequestContext ctx, string tenantId, string? pipelineRunId, OperationTypeEnum operation, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(pipelineRunId)) throw ToolError("ValidationFailed", "pipelineRunId is required.");
            await Require(ctx, tenantId, ResourceTypeEnum.PipelineRun, operation, pipelineRunId, token).ConfigureAwait(false);
            return await _Context.Database.PipelineRuns.ReadAsync(tenantId, pipelineRunId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Pipeline run " + pipelineRunId + " not found.");
        }

        private async Task<object> ListPipelineRunsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpPipelineRunListArguments arguments = ManagementArguments<McpPipelineRunListArguments>(args);
            PipelineRunFilter filter = new PipelineRunFilter();
            filter.TenantId = tenantId;
            if (!String.IsNullOrWhiteSpace(arguments.Pipeline))
            {
                filter.PipelineId = (await RequirePipelineAsync(ctx, tenantId, arguments.Pipeline, OperationTypeEnum.Read, token).ConfigureAwait(false)).Id;
            }
            if (!String.IsNullOrWhiteSpace(arguments.Status))
            {
                if (!Enum.TryParse<PipelineRunStatusEnum>(arguments.Status, true, out PipelineRunStatusEnum status) || !Enum.IsDefined(status)) throw ToolError("ValidationFailed", "status must be Running, AwaitingReview, Cancelling, Succeeded, Failed, Cancelled, or TimedOut.");
                filter.Status = status;
            }
            filter.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.PipelineRuns.EnumerateAsync(filter, token).ConfigureAwait(false);
        }

        private async Task<object> ListPipelineReviewsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Approval, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpPipelineReviewListArguments arguments = ManagementArguments<McpPipelineReviewListArguments>(args);
            PipelineReviewFilter filter = new PipelineReviewFilter();
            filter.TenantId = tenantId;
            if (!String.IsNullOrWhiteSpace(arguments.Status))
            {
                if (!Enum.TryParse<PipelineReviewStatusEnum>(arguments.Status, true, out PipelineReviewStatusEnum status) || !Enum.IsDefined(status)) throw ToolError("ValidationFailed", "status must be Pending, Approved, ChangesRequested, Rejected, Expired, or Cancelled.");
                filter.Status = status;
            }
            filter.PipelineRunId = String.IsNullOrWhiteSpace(arguments.PipelineRunId) ? null : arguments.PipelineRunId.Trim();
            filter.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            return await _Context.Database.PipelineReviews.EnumerateAsync(filter, token).ConfigureAwait(false);
        }

        private async Task<object> DecidePipelineReviewAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpPipelineReviewDecideArguments arguments = ManagementArguments<McpPipelineReviewDecideArguments>(args);
            if (String.IsNullOrWhiteSpace(arguments.ReviewId)) throw ToolError("ValidationFailed", "reviewId is required.");
            if (String.IsNullOrWhiteSpace(arguments.Decision)
                || !Enum.TryParse<PipelineReviewDecisionEnum>(arguments.Decision, true, out PipelineReviewDecisionEnum decision)
                || !Enum.IsDefined(decision))
            {
                throw ToolError("ValidationFailed", "decision must be Approve, RequestChanges, or Reject.");
            }
            await Require(ctx, tenantId, ResourceTypeEnum.Approval, OperationTypeEnum.Update, arguments.ReviewId, token).ConfigureAwait(false);
            PipelineReview review = await _Context.Database.PipelineReviews.ReadAsync(tenantId, arguments.ReviewId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Pipeline review " + arguments.ReviewId + " not found.");
            PipelineReviewDecideRequest request = new PipelineReviewDecideRequest();
            request.Decision = decision;
            request.Comment = arguments.Comment;
            return await _Context.Get<PipelineService>().DecideAsync(ctx, review, request, token).ConfigureAwait(false);
        }

        private async Task<object> ExportManifestAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Manifest, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            McpManifestExportArguments arguments = ManagementArguments<McpManifestExportArguments>(args);
            ManifestExportOptions options = new ManifestExportOptions();
            foreach (string kind in arguments.Kinds ?? new List<string>()) options.Kinds.Add(kind);
            foreach (string selector in arguments.Resources ?? new List<string>()) options.Resources.Add(ManifestRoutes.Selector(selector));
            options.FollowReferences = arguments.FollowReferences;
            options.IncludeBuiltIn = arguments.IncludeBuiltIn;
            ManifestExportResult export = await _Context.Get<ManifestService>().ExportAsync(tenantId, options, token).ConfigureAwait(false);
            McpManifestExport result = new McpManifestExport();
            result.Manifest = export.Yaml;
            result.FileName = ManifestRoutes.FileName(tenantId);
            result.RequiredSecrets = export.Bundle.RequiredSecrets.Select(r => r.Name).ToList();
            return result;
        }

        private async Task<object> ApplyManifestAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Manifest, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
            McpManifestArguments arguments = ManagementArguments<McpManifestArguments>(args);
            if (String.IsNullOrWhiteSpace(arguments.Manifest)) throw ToolError("ValidationFailed", "manifest is required.");
            if (arguments.AllowSecretValues) await Require(ctx, tenantId, ResourceTypeEnum.Secret, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
            ManifestApply result = await _Context.Get<ManifestService>().ApplyAsync(tenantId, arguments.Manifest, new ManifestApplyOptions { DryRun = arguments.DryRun, AllowSecretValues = arguments.AllowSecretValues, PrincipalName = ctx.PrincipalName, PrincipalType = ctx.PrincipalType, PrincipalId = ctx.PrincipalType == PrincipalTypeEnum.Administrator ? null : ctx.PrincipalId, SecretUse = _Context.Authorization.SecretUse(ctx, tenantId) }, token).ConfigureAwait(false);
            await _Context.Audit.WriteAsync(ctx, AuditEventTypeEnum.ManifestApplied, "Manifest", result.Id,
                (arguments.DryRun ? "Dry-run manifest apply: " : "Manifest apply: ") + result.CreatedCount + " created, " + result.UpdatedCount + " updated, " + result.UnchangedCount + " unchanged, " + result.FailedCount + " failed.", tenantId, token).ConfigureAwait(false);
            return result;
        }

        private async Task Require(RequestContext ctx, string tenantId, ResourceTypeEnum resourceType, OperationTypeEnum operation, string? resourceId, CancellationToken token)
        {
            AuthorizationDecision decision = await _Context.Authorization.AuthorizeAsync(ctx, tenantId, resourceType, operation, resourceId, token).ConfigureAwait(false);
            if (!decision.Permitted) throw ToolError("Forbidden", "Not permitted: " + decision.Reason);
        }

        private async Task<object> MemoryAsync(RequestContext ctx, string tenantId, string tool, RpcParameters? args, CancellationToken token)
        {
            if (!_Context.Settings.AgentMemory.Enabled) throw ToolError("MemoryDisabled", "Agent memory is disabled on this server.");
            McpMemoryArguments arguments = ManagementArguments<McpMemoryArguments>(args);
            MemoryService memory = _Context.Get<MemoryService>();
            MemoryAccessPolicy policy = _Context.Get<MemoryAccessPolicy>();
            string operation = tool.Substring("garrison_memory_".Length);
            bool mutation = operation == "write" || operation == "delete";
            MemoryScopeKindEnum kind = MemoryScopeKindEnum.Agent;
            if (!String.IsNullOrWhiteSpace(arguments.Scope))
            {
                if (!Enum.TryParse<MemoryScopeKindEnum>(arguments.Scope.Trim(), true, out kind) || !Enum.IsDefined(kind)) throw ToolError("ValidationFailed", "scope must be Agent, App, OrgUnit, or Organization.");
            }
            if (kind != MemoryScopeKindEnum.Agent && !memory.Options.ScopedEnabled)
                throw ToolError("ScopedMemoryDisabled", "Shared memory scopes are turned off on this server (Memory.Scoped.Enabled).");

            string scopeId;
            MemoryWriter writer = new MemoryWriter();
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                Run? run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId!, token).ConfigureAwait(false);
                if (run == null) throw ToolError("NotFound", "The active run was not found.");
                Agent agent = await _Context.Database.Agents.ReadAsync(tenantId, run.AgentId, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "The run agent was not found.");
                if (arguments.Agent != null && arguments.Agent != agent.Id && arguments.Agent != agent.Name) throw ToolError("Forbidden", "Run memory is scoped to its own agent.");
                if (kind == MemoryScopeKindEnum.Agent)
                {
                    string? named = arguments.ScopeId;
                    if (named != null && named != agent.Id && named != agent.Name) throw ToolError("Forbidden", "A run uses only its own agent's Agent scope.");
                    scopeId = agent.Id;
                }
                else if (kind == MemoryScopeKindEnum.App)
                {
                    scopeId = await RunAppScopeAsync(tenantId, agent, arguments.ScopeId, token).ConfigureAwait(false);
                }
                else
                {
                    scopeId = await RunOrgScopeAsync(tenantId, agent, kind, arguments.ScopeId, token).ConfigureAwait(false);
                }
                MemoryAccessDecision decision = await policy.CheckRunAsync(tenantId, agent.Id, kind, scopeId, mutation, memory.Options.ScopedEnabled, token).ConfigureAwait(false);
                if (!decision.Permitted) throw ToolError(decision.Code, decision.Reason);
                writer.PrincipalType = PrincipalTypeEnum.Run;
                writer.PrincipalId = run.Id;
                writer.Name = agent.Name;
                writer.AgentId = agent.Id;
                writer.RunId = run.Id;
            }
            else
            {
                if (kind == MemoryScopeKindEnum.Agent)
                {
                    string? reference = arguments.Agent ?? arguments.ScopeId;
                    if (String.IsNullOrWhiteSpace(reference)) throw ToolError("BadRequest", "An agent is required for user memory calls.");
                    Agent agent = await _Invoker.ResolveAgentAsync(tenantId, reference, token).ConfigureAwait(false);
                    await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);
                    scopeId = agent.Id;
                }
                else if (kind != MemoryScopeKindEnum.App)
                {
                    scopeId = await UserOrgScopeAsync(tenantId, kind, arguments.ScopeId, token).ConfigureAwait(false);
                }
                else
                {
                    if (String.IsNullOrWhiteSpace(arguments.ScopeId)) throw ToolError("ValidationFailed", "scopeId is required for the App scope: the app identifier or name.");
                    AgenticApp app = await _Context.Database.Apps.ReadAsync(tenantId, arguments.ScopeId.Trim(), token).ConfigureAwait(false)
                        ?? await _Context.Database.Apps.ReadByNameAsync(tenantId, arguments.ScopeId.Trim(), token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "App " + arguments.ScopeId + " not found.");
                    scopeId = app.Id;
                }
                await Require(ctx, tenantId, ResourceTypeEnum.Memory, MemoryAccessPolicy.PermissionFor(operation), null, token).ConfigureAwait(false);
                writer.PrincipalType = ctx.PrincipalType;
                writer.PrincipalId = ctx.PrincipalId;
                writer.Name = ctx.PrincipalName;
            }

            if (operation == "list")
            {
                MemoryEntryFilter filter = new MemoryEntryFilter { TenantId = tenantId, ScopeKind = kind, ScopeId = scopeId };
                filter.Category = String.IsNullOrWhiteSpace(arguments.Category) ? null : arguments.Category.Trim();
                filter.Tag = String.IsNullOrWhiteSpace(arguments.Tag) ? null : arguments.Tag.Trim();
                filter.Search = String.IsNullOrWhiteSpace(arguments.Query) ? null : arguments.Query.Trim();
                filter.KeyPrefix = String.IsNullOrEmpty(arguments.KeyPrefix) ? null : arguments.KeyPrefix;
                filter.Skip = Math.Max(0, arguments.Skip ?? 0);
                filter.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
                Garrison.Core.Enumeration.EnumerationResult<MemoryEntry> page = await memory.ListAsync(filter, token).ConfigureAwait(false);
                McpMemoryList list = new McpMemoryList();
                list.Scope = kind.ToString();
                list.ScopeId = scopeId;
                list.Entries = page.Objects;
                list.TotalCount = page.TotalRecords;
                return list;
            }
            if (operation == "search")
            {
                if (String.IsNullOrWhiteSpace(arguments.Query)) throw ToolError("ValidationFailed", "query is required: the keyword to look for.");
                McpMemorySearchResult found = new McpMemorySearchResult();
                found.Scope = kind.ToString();
                found.ScopeId = scopeId;
                found.Hits = await memory.SearchAsync(tenantId, kind, scopeId, arguments.Query, Math.Clamp(arguments.MaxResults ?? 25, 1, 100), token).ConfigureAwait(false);
                return found;
            }

            string? key = arguments.Key;
            if (String.IsNullOrWhiteSpace(key) || key.Length > 256) throw ToolError("BadRequest", "Memory key must contain 1 to 256 characters.");
            AgentMemoryResult result = new AgentMemoryResult { Key = key, Scope = kind.ToString(), ScopeId = scopeId };
            if (operation == "read")
            {
                MemoryReadResult read = await memory.ReadAsync(tenantId, kind, scopeId, key, token).ConfigureAwait(false);
                result.Found = read.Found;
                result.Value = read.Value;
                result.Entry = read.Entry;
                result.Version = read.Entry?.Version ?? 0;
            }
            else if (operation == "write")
            {
                if (arguments.Value == null) throw ToolError("BadRequest", "A memory value within the configured UTF-8 byte limit is required.");
                MemoryWriteRequest request = new MemoryWriteRequest();
                request.TenantId = tenantId;
                request.ScopeKind = kind;
                request.ScopeId = scopeId;
                request.Key = key;
                request.Value = arguments.Value;
                request.Category = arguments.Category;
                request.Tags = arguments.Tags;
                request.TtlSeconds = arguments.TtlSeconds;
                request.ExpectedVersion = arguments.ExpectedVersion;
                MemoryEntry entry = await memory.WriteAsync(request, writer, token).ConfigureAwait(false);
                result.Found = true;
                result.Entry = entry;
                result.Version = entry.Version;
            }
            else
            {
                await memory.DeleteAsync(tenantId, kind, scopeId, key, arguments.ExpectedVersion, writer, token).ConfigureAwait(false);
                result.Found = true;
            }
            return result;
        }

        private async Task<string> RunAppScopeAsync(string tenantId, Agent agent, string? named, CancellationToken token)
        {
            List<string> apps = await _Context.Database.Apps.AppIdsWithMemberAsync(tenantId, agent.Id, token).ConfigureAwait(false);
            if (String.IsNullOrWhiteSpace(named))
            {
                if (apps.Count == 1) return apps[0];
                throw ToolError("ValidationFailed", apps.Count == 0
                    ? "Your agent is not a member of any app, so it has no App scope."
                    : "Your agent is a member of " + apps.Count + " apps; pass scopeId with the app's identifier or name.");
            }
            string trimmed = named.Trim();
            if (apps.Contains(trimmed)) return trimmed;
            AgenticApp? app = await _Context.Database.Apps.ReadByNameAsync(tenantId, trimmed, token).ConfigureAwait(false);
            return app?.Id ?? trimmed;
        }

        private async Task<string> RunOrgScopeAsync(string tenantId, Agent agent, MemoryScopeKindEnum kind, string? named, CancellationToken token)
        {
            ChainOfCommand chain = _Context.Get<ChainOfCommand>();
            List<OrgTree> trees = await chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false);
            List<OrgTree> mine = trees.Where(t => t.PositionOf(agent.Id) != null).ToList();
            if (String.IsNullOrWhiteSpace(named))
            {
                if (mine.Count == 1) return kind == MemoryScopeKindEnum.Organization ? mine[0].Organization.Id : mine[0].PositionOf(agent.Id)!.UnitId;
                throw ToolError("ValidationFailed", mine.Count == 0
                    ? "Your agent holds no position in a live organization, so it has no " + kind + " scope."
                    : "Your agent holds positions in " + mine.Count + " organizations; pass scopeId with the " + (kind == MemoryScopeKindEnum.Organization ? "organization" : "unit") + "'s identifier or name.");
            }
            string trimmed = named.Trim();
            foreach (OrgTree tree in mine)
            {
                if (kind == MemoryScopeKindEnum.Organization)
                {
                    if (tree.Organization.Id == trimmed || String.Equals(tree.Organization.Name, trimmed, StringComparison.OrdinalIgnoreCase)) return tree.Organization.Id;
                }
                else
                {
                    OrgUnit? unit = tree.Unit(trimmed) ?? tree.UnitByName(trimmed);
                    if (unit != null) return unit.Id;
                }
            }
            return trimmed;
        }

        private async Task<string> UserOrgScopeAsync(string tenantId, MemoryScopeKindEnum kind, string? named, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(named)) throw ToolError("ValidationFailed", "scopeId is required for the " + kind + " scope: the " + (kind == MemoryScopeKindEnum.Organization ? "organization" : "unit") + " identifier or name.");
            string trimmed = named.Trim();
            if (kind == MemoryScopeKindEnum.Organization)
            {
                Organization organization = await _Context.Get<OrganizationService>().FindAsync(tenantId, trimmed, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "Organization " + trimmed + " not found.");
                return organization.Id;
            }
            OrgUnit? unit = await _Context.Database.Organizations.ReadUnitAsync(tenantId, trimmed, token).ConfigureAwait(false);
            if (unit != null) return unit.Id;
            foreach (OrgTree tree in await _Context.Get<ChainOfCommand>().LiveTreesAsync(tenantId, token).ConfigureAwait(false))
            {
                OrgUnit? live = tree.Unit(trimmed) ?? tree.UnitByName(trimmed);
                if (live != null) return live.Id;
            }
            throw ToolError("NotFound", "Unit " + trimmed + " not found.");
        }

        private async Task<object> MandateToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            MandateService mandates = _Context.Get<MandateService>();
            McpMandateArguments arguments = ManagementArguments<McpMandateArguments>(args);
            Func<string, Task<bool>> agentCheck = async agentId =>
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId, token).ConfigureAwait(false);
                return true;
            };
            if (tool.Name == "garrison_list_mandates")
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Mandate, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                MandateStatusEnum? status = null;
                if (!String.IsNullOrWhiteSpace(arguments.Status))
                {
                    if (!Enum.TryParse<MandateStatusEnum>(arguments.Status, true, out MandateStatusEnum parsed) || !Enum.IsDefined(parsed)) throw ToolError("ValidationFailed", "status must be Draft, Active, Paused, Frozen, CapReached, or Retired.");
                    status = parsed;
                }
                EnumerationQuery query = new EnumerationQuery();
                query.Search = String.IsNullOrWhiteSpace(arguments.Search) ? null : arguments.Search.Trim();
                query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
                return await _Context.Database.Mandates.EnumerateAsync(tenantId, status, String.IsNullOrWhiteSpace(arguments.Agent) ? null : arguments.Agent.Trim(), null, query, token).ConfigureAwait(false);
            }
            if (tool.Name == "garrison_create_mandate")
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Mandate, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                Mandate? created = await mandates.CreateAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), agentCheck, token).ConfigureAwait(false);
                return created ?? throw ToolError("Forbidden", "Not permitted to run the mandate's agent.");
            }

            if (String.IsNullOrWhiteSpace(arguments.Mandate)) throw ToolError("ValidationFailed", "mandate is required.");
            Mandate existing = await mandates.FindAsync(tenantId, arguments.Mandate.Trim(), token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Mandate " + arguments.Mandate.Trim() + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.Mandate, tool.Operation, existing.Id, token).ConfigureAwait(false);
            switch (tool.Name)
            {
                case "garrison_get_mandate":
                    return existing;
                case "garrison_update_mandate":
                    Mandate? updated = await mandates.UpdateAsync(ctx, existing, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), agentCheck, token).ConfigureAwait(false);
                    return updated ?? throw ToolError("Forbidden", "Not permitted to run the mandate's agent.");
                case "garrison_publish_mandate_revision":
                    MandateRevision draft = await mandates.CreateRevisionAsync(ctx, existing, arguments.Revision ?? throw ToolError("ValidationFailed", "revision is required."), MandateRevisionSourceEnum.Human, token).ConfigureAwait(false);
                    return await mandates.PublishRevisionAsync(ctx, existing, draft, token).ConfigureAwait(false);
                case "garrison_pause_mandate":
                    return await mandates.PauseAsync(ctx, existing, token).ConfigureAwait(false);
                case "garrison_resume_mandate":
                    return await mandates.ResumeAsync(ctx, existing, token).ConfigureAwait(false);
                case "garrison_wake_mandate":
                    return await mandates.WakeAsync(ctx, existing, token).ConfigureAwait(false);
                default:
                    TickOutcomeEnum? outcome = null;
                    if (!String.IsNullOrWhiteSpace(arguments.Outcome))
                    {
                        if (!Enum.TryParse<TickOutcomeEnum>(arguments.Outcome, true, out TickOutcomeEnum parsedOutcome) || !Enum.IsDefined(parsedOutcome)) throw ToolError("ValidationFailed", "outcome must be Quiet, Acted, Attention, Escalated, Failed, Skipped, or Unreported.");
                        outcome = parsedOutcome;
                    }
                    EnumerationQuery ticks = new EnumerationQuery();
                    ticks.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
                    return await _Context.Database.MandateTicks.EnumerateAsync(tenantId, existing.Id, outcome, ticks, token).ConfigureAwait(false);
            }
        }

        private async Task<object> KeeperToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            Run run = await KeeperRunAsync(ctx, token).ConfigureAwait(false)
                ?? throw ToolError("Forbidden", tool.Name + " is available only to keeper tick runs.");
            if (run.TenantId != tenantId) throw ToolError("Forbidden", tool.Name + " is available only to keeper tick runs.");
            McpKeeperArguments arguments = ManagementArguments<McpKeeperArguments>(args);
            MandateTick tick = await _Context.Database.MandateTicks.ReadAsync(tenantId, run.MandateTickId!, token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "The tick of this run was not found.");
            if (tool.Name == "garrison_keeper_context")
            {
                MandateService mandates = _Context.Get<MandateService>();
                Mandate mandate = await mandates.FindAsync(tenantId, run.MandateId, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "The mandate of this run was not found.");
                McpKeeperContext context = new McpKeeperContext();
                context.Mandate = mandate;
                context.Tick = tick;
                context.RecentTicks = await _Context.Database.MandateTicks.ListRecentAsync(tenantId, mandate.Id, Math.Clamp(arguments.RecentTicks ?? 10, 1, 100), token).ConfigureAwait(false);
                return context;
            }

            if (String.IsNullOrWhiteSpace(arguments.Outcome)
                || !Enum.TryParse<TickOutcomeEnum>(arguments.Outcome, true, out TickOutcomeEnum reported)
                || (reported != TickOutcomeEnum.Quiet && reported != TickOutcomeEnum.Acted && reported != TickOutcomeEnum.Attention && reported != TickOutcomeEnum.Escalated))
            {
                throw ToolError("ValidationFailed", "outcome must be Quiet, Acted, Attention, or Escalated.");
            }
            if (arguments.Summary != null && arguments.Summary.Length > 4000) throw ToolError("ValidationFailed", "summary is limited to 4000 characters.");
            if (arguments.NextWakeSeconds.HasValue && (arguments.NextWakeSeconds.Value < 1 || arguments.NextWakeSeconds.Value > 2592000)) throw ToolError("ValidationFailed", "nextWakeSeconds must be 1 to 2592000.");
            bool accepted = await _Context.Database.MandateTicks.TryReportAsync(tenantId, tick.Id, reported, arguments.Summary, arguments.NextWakeSeconds, token).ConfigureAwait(false);
            MandateTick current = await _Context.Database.MandateTicks.ReadAsync(tenantId, tick.Id, token).ConfigureAwait(false) ?? tick;
            McpKeeperTickResult result = new McpKeeperTickResult();
            result.TickId = tick.Id;
            result.Outcome = current.Outcome?.ToString();
            result.Accepted = accepted;
            result.Message = accepted
                ? "Recorded " + reported + ". Finish your reply; Garrison schedules your next wake when this run ends."
                : "This tick already has an outcome (" + (current.Outcome?.ToString() ?? "finished") + "); nothing changed.";
            return result;
        }

        private static bool RunOnlyMessageTool(string name)
        {
            return name == "garrison_reply_message" || name == "garrison_ack_message";
        }

        private async Task<bool> OrgMemberRunAsync(RequestContext ctx, CancellationToken token)
        {
            // Runs see the organization tools only while their agent holds a position in a live organization (AA7.8).
            if (String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return false;
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            if (run == null) return false;
            return (await _Context.Get<ChainOfCommand>().PositionsAsync(ctx.TenantId, run.AgentId, token).ConfigureAwait(false)).Count > 0;
        }

        private async Task<object> ChangeRuleToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            ChangeRuleService rules = _Context.Get<ChangeRuleService>();
            McpChangeRuleArguments arguments = ManagementArguments<McpChangeRuleArguments>(args);
            if (tool.Name == "garrison_list_change_rules" && ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                // AA8.9: an executive reads the rules that bear on its own subtree through its own identity.
                ExecutivePosition position = await _Context.Get<ExecutiveAuthority>().ResolveRunAsync(ctx, token).ConfigureAwait(false)
                    ?? throw ToolError("NotAnExecutive", "Only an executive run (a deployment with managementAccess OrgSubtree whose agent leads a unit) reads change rules.");
                return await rules.ForExecutiveAsync(tenantId, position, token).ConfigureAwait(false);
            }
            await Require(ctx, tenantId, tool.ResourceType, tool.Operation, null, token).ConfigureAwait(false);
            RequestContext caller = ctx;
            switch (tool.Name)
            {
                case "garrison_list_change_rules":
                {
                    EnumerationQuery query = new EnumerationQuery { Search = arguments.Search, ActiveOnly = arguments.ActiveOnly == true, Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    return await ToolCallAsync(() => rules.EnumerateAsync(tenantId, arguments.Organization, arguments.Unit, query, token)).ConfigureAwait(false);
                }
                case "garrison_get_change_rule":
                    return await ToolCallAsync(() => rules.ReadAsync(tenantId, arguments.RuleId, token)).ConfigureAwait(false);
                case "garrison_create_change_rule":
                {
                    ChangeRule body = new ChangeRule
                    {
                        OrganizationId = arguments.Organization ?? String.Empty, UnitId = arguments.Unit ?? String.Empty, Name = arguments.Name ?? String.Empty,
                        Description = arguments.Description, Active = arguments.Active ?? true, ExpiresUtc = arguments.ExpiresUtc,
                        Classes = ParseClasses(arguments.Classes), Limits = arguments.Limits ?? new List<ChangeRuleLimit>(),
                        GateEvalSet = arguments.GateEvalSet, GateThreshold = arguments.GateThreshold
                    };
                    return await ToolCallAsync(() => rules.CreateAsync(caller, tenantId, body, token)).ConfigureAwait(false);
                }
                case "garrison_update_change_rule":
                {
                    ChangeRule existing = await ToolCallAsync(() => rules.ReadAsync(tenantId, arguments.RuleId, token)).ConfigureAwait(false);
                    ChangeRule body = new ChangeRule
                    {
                        OrganizationId = existing.OrganizationId, UnitId = arguments.Unit ?? existing.UnitId, Name = arguments.Name ?? existing.Name,
                        Description = arguments.Description ?? existing.Description, Active = arguments.Active ?? existing.Active, ExpiresUtc = arguments.ExpiresUtc ?? existing.ExpiresUtc,
                        Classes = arguments.Classes != null ? ParseClasses(arguments.Classes) : existing.Classes, Limits = arguments.Limits ?? existing.Limits,
                        GateEvalSet = arguments.GateEvalSet ?? existing.GateEvalSet,
                        GateThreshold = arguments.GateEvalSet != null && arguments.GateEvalSet.Trim().Length == 0 ? null : arguments.GateThreshold ?? existing.GateThreshold
                    };
                    return await ToolCallAsync(() => rules.UpdateAsync(caller, existing, body, token)).ConfigureAwait(false);
                }
                case "garrison_delete_change_rule":
                {
                    ChangeRule existing = await ToolCallAsync(() => rules.ReadAsync(tenantId, arguments.RuleId, token)).ConfigureAwait(false);
                    bool deleted = await ToolCallAsync(() => rules.DeleteAsync(caller, existing, token)).ConfigureAwait(false);
                    return new Dictionary<string, object?> { ["deleted"] = deleted, ["ruleId"] = existing.Id };
                }
            }

            OrganizationService organizations = _Context.Get<OrganizationService>();
            OrgProposalService proposals = _Context.Get<OrgProposalService>();
            Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
            switch (tool.Name)
            {
                case "garrison_list_org_proposals":
                {
                    EnumerationQuery query = new EnumerationQuery { Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    StudioDraftStatusEnum? status = String.IsNullOrWhiteSpace(arguments.Status) ? null : ParseOr(arguments.Status, StudioDraftStatusEnum.Open, "status");
                    return await proposals.EnumerateAsync(organization, query, status, token).ConfigureAwait(false);
                }
                case "garrison_get_org_proposal":
                    return await ToolCallAsync(() => proposals.ReadAsync(caller, organization, arguments.DraftId, token)).ConfigureAwait(false);
                default:
                    if (!arguments.Allow.HasValue) throw ToolError("ValidationFailed", "allow is required: true to apply the proposal, false to send it back.");
                    return await ToolCallAsync(() => proposals.DecideAsync(caller, organization, arguments.DraftId, arguments.Allow.Value, arguments.Reason, token)).ConfigureAwait(false);
            }
        }

        private async Task<object> ShadowTrialToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // Run tokens never see these tools; the check stays here in case a caller names one anyway.
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw ToolError("Forbidden", tool.Name + " is available only to people and API credentials.");
            await Require(ctx, tenantId, tool.ResourceType, tool.Operation, null, token).ConfigureAwait(false);
            ShadowTrialService trials = _Context.Get<ShadowTrialService>();
            McpShadowTrialArguments arguments = ManagementArguments<McpShadowTrialArguments>(args);
            switch (tool.Name)
            {
                case "garrison_list_shadow_trials":
                {
                    EnumerationQuery query = new EnumerationQuery { Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    ShadowTrialStatusEnum? status = String.IsNullOrWhiteSpace(arguments.Status) ? null : ParseOr(arguments.Status, ShadowTrialStatusEnum.Running, "status");
                    return await trials.EnumerateAsync(tenantId, arguments.SourceDeployment, arguments.CandidateDeployment, status, query, token).ConfigureAwait(false);
                }
                case "garrison_get_shadow_trial":
                    return await ToolCallAsync(() => trials.ReadAsync(tenantId, arguments.TrialId, token)).ConfigureAwait(false);
                case "garrison_start_shadow_trial":
                {
                    ShadowTrial body = new ShadowTrial
                    {
                        Name = arguments.Name, SourceDeploymentId = arguments.SourceDeployment ?? String.Empty, CandidateDeploymentId = arguments.CandidateDeployment ?? String.Empty,
                        EndsUtc = arguments.EndsUtc, ComparisonEvalSetId = arguments.ComparisonEvalSetId, UseJudge = arguments.UseJudge ?? false
                    };
                    if (arguments.SamplePercent.HasValue) body.SamplePercent = arguments.SamplePercent.Value;
                    return await ToolCallAsync(() => trials.CreateAsync(ctx, tenantId, body, token)).ConfigureAwait(false);
                }
                default:
                {
                    ShadowTrial existing = await ToolCallAsync(() => trials.ReadAsync(tenantId, arguments.TrialId, token)).ConfigureAwait(false);
                    return await ToolCallAsync(() => trials.StopAsync(ctx, existing, arguments.Reason, token)).ConfigureAwait(false);
                }
            }
        }

        private async Task<object> CanaryToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // Run tokens never see these tools; the check stays here in case a caller names one anyway.
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw ToolError("Forbidden", tool.Name + " is available only to people and API credentials.");
            await Require(ctx, tenantId, tool.ResourceType, tool.Operation, null, token).ConfigureAwait(false);
            CanaryService canaries = _Context.Get<CanaryService>();
            McpCanaryArguments arguments = ManagementArguments<McpCanaryArguments>(args);
            switch (tool.Name)
            {
                case "garrison_list_canary_releases":
                {
                    EnumerationQuery query = new EnumerationQuery { Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    CanaryStatusEnum? status = String.IsNullOrWhiteSpace(arguments.Status) ? null : ParseOr(arguments.Status, CanaryStatusEnum.Running, "status");
                    return await canaries.EnumerateAsync(tenantId, arguments.Agent, status, query, token).ConfigureAwait(false);
                }
                case "garrison_get_canary_release":
                    return await ToolCallAsync(() => canaries.ReadAsync(tenantId, arguments.ReleaseId, token)).ConfigureAwait(false);
                case "garrison_start_canary":
                {
                    CanaryRelease body = new CanaryRelease
                    {
                        AgentId = arguments.Agent ?? String.Empty, CandidateDeploymentId = arguments.CandidateDeployment ?? String.Empty, BaselineDeploymentId = arguments.BaselineDeployment ?? String.Empty,
                        Steps = arguments.Steps ?? new List<CanaryReleaseStep>(), MinEvalScore = arguments.MinEvalScore, EvalSetId = arguments.EvalSetId
                    };
                    if (arguments.MaxErrorRatePercent.HasValue) body.MaxErrorRatePercent = arguments.MaxErrorRatePercent.Value;
                    return await ToolCallAsync(() => canaries.StartAsync(ctx, tenantId, body, token)).ConfigureAwait(false);
                }
                default:
                {
                    CanaryRelease existing = await ToolCallAsync(() => canaries.ReadAsync(tenantId, arguments.ReleaseId, token)).ConfigureAwait(false);
                    return await ToolCallAsync(() => canaries.AbortAsync(ctx, existing, arguments.Reason, token)).ConfigureAwait(false);
                }
            }
        }

        private async Task<object> EvalToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // AA9.12: executive runs evaluate their own drafts and read their own eval runs (hidden cases as scores only);
            // people with EvalSet and EvalRun permissions use every eval tool. Approving is for people only.
            McpEvalArguments arguments = ManagementArguments<McpEvalArguments>(args);
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && await _Context.Get<ExecutiveAuthority>().ResolveRunAsync(ctx, token).ConfigureAwait(false) == null)
                throw ToolError("NotAnExecutive", "Only an executive run (a deployment with managementAccess OrgSubtree whose agent leads a unit) runs evals.");
            await Require(ctx, tenantId, tool.ResourceType, tool.Operation, null, token).ConfigureAwait(false);
            EvalSetService sets = _Context.Get<EvalSetService>();
            EvalRunService runs = _Context.Get<EvalRunService>();
            try
            {
                switch (tool.Name)
                {
                    case "garrison_run_eval":
                    {
                        EvalRunRequest request = new EvalRunRequest
                        {
                            SetId = arguments.Set, SetVersion = arguments.SetVersion, AgentId = arguments.Agent, AgentRevisionId = arguments.AgentRevisionId, DeploymentId = arguments.Deployment,
                            StudioDraftId = arguments.StudioDraftId, Threshold = arguments.Threshold, BudgetUsd = arguments.BudgetUsd,
                            InputMode = String.IsNullOrWhiteSpace(arguments.InputMode) ? EvalRunInputModeEnum.Cases : ParseOr(arguments.InputMode, EvalRunInputModeEnum.Cases, "inputMode")
                        };
                        if (arguments.RecentInputCount.HasValue) request.RecentInputCount = arguments.RecentInputCount.Value;
                        return await ToolCallAsync(() => runs.CreateAsync(ctx, tenantId, request, token)).ConfigureAwait(false);
                    }
                    case "garrison_get_eval_run":
                    {
                        EvalRun run = await ToolCallAsync(() => runs.ReadAsync(ctx, tenantId, arguments.EvalRunId, token)).ConfigureAwait(false);
                        McpEvalRunDetail detail = new McpEvalRunDetail { EvalRun = run };
                        if (arguments.IncludeResults != false) detail.Results = await runs.ResultsAsync(ctx, run, token).ConfigureAwait(false);
                        return detail;
                    }
                    case "garrison_list_eval_sets":
                    {
                        EnumerationQuery query = new EnumerationQuery { Search = arguments.Search, Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                        EvalSetStateEnum? state = String.IsNullOrWhiteSpace(arguments.State) ? null : ParseOr(arguments.State, EvalSetStateEnum.Draft, "state");
                        EvalSetOriginEnum? origin = String.IsNullOrWhiteSpace(arguments.Origin) ? null : ParseOr(arguments.Origin, EvalSetOriginEnum.Human, "origin");
                        return await sets.EnumerateAsync(tenantId, state, origin, arguments.Tag, arguments.LatestOnly == true, query, token).ConfigureAwait(false);
                    }
                    case "garrison_create_eval_set":
                    {
                        EvalSetRequest body = new EvalSetRequest
                        {
                            Name = arguments.Name, Description = arguments.Description, JudgeAgent = arguments.JudgeAgent, Tags = arguments.Tags, Cases = arguments.Cases,
                            Origin = String.IsNullOrWhiteSpace(arguments.Origin) ? null : ParseOr(arguments.Origin, EvalSetOriginEnum.Human, "origin")
                        };
                        return await ToolCallAsync(() => sets.CreateAsync(ctx, tenantId, body, token)).ConfigureAwait(false);
                    }
                    default:
                    {
                        EvalSet set = await ToolCallAsync(() => sets.ReadAsync(tenantId, arguments.Set, token)).ConfigureAwait(false);
                        return await ToolCallAsync(() => sets.ApproveAsync(ctx, set, token)).ConfigureAwait(false);
                    }
                }
            }
            catch (AppAccessException e)
            {
                throw ToolError(e.Code, e.Message);
            }
        }

        private List<ChangeRuleClass> ParseClasses(List<string>? classes)
        {
            List<ChangeRuleClass> result = new List<ChangeRuleClass>();
            foreach (string value in classes ?? new List<string>())
            {
                if (!Enum.TryParse(value?.Trim(), true, out ChangeClassEnum parsed)) throw ToolError("ValidationFailed", "Unknown change class " + value + "; use " + String.Join(", ", Enum.GetNames(typeof(ChangeClassEnum))) + ".");
                result.Add(new ChangeRuleClass { Class = parsed });
            }
            return result;
        }

        private async Task<object> OrganizationToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            OrganizationService organizations = _Context.Get<OrganizationService>();
            ChainOfCommand chain = _Context.Get<ChainOfCommand>();
            McpOrganizationArguments arguments = ManagementArguments<McpOrganizationArguments>(args);
            if (tool.Name == "garrison_org_chart" || tool.Name == "garrison_org_whoami")
            {
                string agentId;
                if (ctx.PrincipalType == PrincipalTypeEnum.Run)
                {
                    Run run = (String.IsNullOrEmpty(ctx.RunId) ? null : await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false))
                        ?? throw ToolError("Forbidden", tool.Name + " needs a run token.");
                    agentId = run.AgentId;
                    List<OrgTree> mine = (await chain.LiveTreesAsync(tenantId, token).ConfigureAwait(false)).Where(t => t.PositionOf(agentId) != null).ToList();
                    if (mine.Count == 0) throw ToolError("NotAMember", "Your agent holds no position in a live organization.");
                    OrgTree? chosen = mine.Count == 1 && String.IsNullOrWhiteSpace(arguments.Organization) ? mine[0]
                        : mine.FirstOrDefault(t => t.Organization.Id == arguments.Organization?.Trim() || String.Equals(t.Organization.Name, arguments.Organization?.Trim(), StringComparison.OrdinalIgnoreCase));
                    if (chosen == null)
                    {
                        throw ToolError(String.IsNullOrWhiteSpace(arguments.Organization) ? "ValidationFailed" : "NotAMember", String.IsNullOrWhiteSpace(arguments.Organization)
                            ? "Your agent belongs to " + mine.Count + " organizations; pass organization with the identifier or name of one."
                            : "Your agent holds no position in organization " + arguments.Organization + ".");
                    }
                    if (tool.Name == "garrison_org_chart") return await organizations.ChartAsync(chosen.Organization, token).ConfigureAwait(false);
                    return await organizations.WhoAmIAsync(tenantId, agentId, chosen.Organization.Id, token).ConfigureAwait(false)
                        ?? throw ToolError("NotAMember", "Your agent holds no position in organization " + chosen.Organization.Name + ".");
                }
                await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                if (tool.Name == "garrison_org_chart")
                {
                    Organization named = await organizations.FindAsync(tenantId, arguments.Organization, token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Organization " + (arguments.Organization ?? String.Empty) + " not found.");
                    return await organizations.ChartAsync(named, token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(arguments.Agent)) throw ToolError("ValidationFailed", "agent is required for people: the agent to describe.");
                Agent agent = await _Invoker.ResolveAgentAsync(tenantId, arguments.Agent, token).ConfigureAwait(false);
                string? organizationId = null;
                if (!String.IsNullOrWhiteSpace(arguments.Organization))
                {
                    Organization named = await organizations.FindAsync(tenantId, arguments.Organization, token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Organization " + arguments.Organization + " not found.");
                    organizationId = named.Id;
                }
                return await organizations.WhoAmIAsync(tenantId, agent.Id, organizationId, token).ConfigureAwait(false)
                    ?? throw ToolError("NotAMember", "Agent " + agent.Name + " holds no position in a live organization.");
            }

            RequestContext caller = ctx;
            switch (tool.Name)
            {
                case "garrison_list_organizations":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    EnumerationQuery query = new EnumerationQuery { Search = arguments.Search, Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    return await organizations.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                }
                case "garrison_get_organization":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                    await organizations.AttachUnitsAsync(organization, token).ConfigureAwait(false);
                    return organization;
                }
                case "garrison_create_organization":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    if (arguments.Units != null && arguments.Units.Count > 0) await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Update, null, token).ConfigureAwait(false);
                    Organization body = new Organization { Name = arguments.Name ?? String.Empty, Description = arguments.Description, Mission = arguments.Mission, BudgetFreezeMarginPercent = arguments.BudgetFreezeMarginPercent ?? 10 };
                    Organization organization = await ToolCallAsync(() => organizations.CreateAsync(caller, tenantId, body, token)).ConfigureAwait(false);
                    if (arguments.Units != null && arguments.Units.Count > 0)
                    {
                        await ToolCallAsync(() => organizations.ReplaceTreeAsync(caller, organization, arguments.Units, token)).ConfigureAwait(false);
                    }
                    await organizations.AttachUnitsAsync(organization, token).ConfigureAwait(false);
                    return organization;
                }
                case "garrison_update_organization":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Update, null, token).ConfigureAwait(false);
                    Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                    Organization body = new Organization
                    {
                        Name = arguments.Name ?? organization.Name,
                        Description = arguments.Description ?? organization.Description,
                        Mission = arguments.Mission ?? organization.Mission,
                        BudgetFreezeMarginPercent = arguments.BudgetFreezeMarginPercent ?? organization.BudgetFreezeMarginPercent,
                        Status = String.IsNullOrWhiteSpace(arguments.Status) ? organization.Status : ParseOr(arguments.Status, organization.Status, "status")
                    };
                    organization = await ToolCallAsync(() => organizations.UpdateAsync(caller, organization, body, token)).ConfigureAwait(false);
                    if (arguments.Units != null)
                    {
                        Organization target = organization;
                        await ToolCallAsync(() => organizations.ReplaceTreeAsync(caller, target, arguments.Units, token)).ConfigureAwait(false);
                    }
                    await organizations.AttachUnitsAsync(organization, token).ConfigureAwait(false);
                    return organization;
                }
                case "garrison_publish_org_revision":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Update, null, token).ConfigureAwait(false);
                    Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                    OrgRevision revision;
                    if (String.IsNullOrWhiteSpace(arguments.RevisionId))
                    {
                        revision = await ToolCallAsync(() => organizations.CreateRevisionAsync(caller, organization, arguments.Note, token)).ConfigureAwait(false);
                    }
                    else
                    {
                        OrgRevision? named = await _Context.Database.Organizations.ReadRevisionAsync(tenantId, arguments.RevisionId.Trim(), token).ConfigureAwait(false);
                        if (named == null || named.OrganizationId != organization.Id) throw ToolError("NotFound", "Revision " + arguments.RevisionId + " not found in organization " + organization.Name + ".");
                        revision = named;
                    }
                    OrgRevision draft = revision;
                    return await ToolCallAsync(() => organizations.PublishAsync(caller, organization, draft, token)).ConfigureAwait(false);
                }
                case "garrison_unit_cancel_all":
                {
                    // AA11.4: people only; run tokens never see this tool, and the check stays here in case one names it.
                    if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw ToolError("Forbidden", tool.Name + " is available only to people and API credentials.");
                    Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Update, organization.Id, token).ConfigureAwait(false);
                    if (String.IsNullOrWhiteSpace(arguments.UnitId)) throw ToolError("ValidationFailed", "unitId is required: the unit identifier or name in the live tree.");
                    OrgBrakeService brakes = _Context.Get<OrgBrakeService>();
                    return await ToolCallAsync(() => brakes.CancelAllAsync(caller, organization, arguments.UnitId, arguments.Reason, token)).ConfigureAwait(false);
                }
                default:
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Update, null, token).ConfigureAwait(false);
                    Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                    RollbackActiveTicksEnum activeTicks = String.IsNullOrWhiteSpace(arguments.ActiveTicks) ? RollbackActiveTicksEnum.Finish : ParseOr(arguments.ActiveTicks, RollbackActiveTicksEnum.Finish, "activeTicks");
                    return await ToolCallAsync(() => organizations.RollbackAsync(caller, organization, arguments.RevisionId, arguments.Note, activeTicks, token)).ConfigureAwait(false);
                }
            }
        }

        private async Task<object> BoardToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // Run tokens never see these tools; the check stays here in case a caller names one anyway.
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw ToolError("Forbidden", tool.Name + " is available only to people and API credentials.");
            McpBoardArguments arguments = ManagementArguments<McpBoardArguments>(args);
            OrganizationService organizations = _Context.Get<OrganizationService>();
            BoardService board = _Context.Get<BoardService>();
            Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
            await Require(ctx, tenantId, tool.ResourceType, tool.Operation, organization.Id, token).ConfigureAwait(false);
            if (tool.Name == "garrison_board_get") return await ToolCallAsync(() => board.GetAsync(organization, arguments.Limit, token)).ConfigureAwait(false);
            BoardDirectionRequest request = new BoardDirectionRequest { Direction = arguments.Direction, ChangeNote = arguments.ChangeNote };
            return await ToolCallAsync(() => board.DirectAsync(ctx, organization, request, token)).ConfigureAwait(false);
        }

        private async Task<bool> UnitLeadRunAsync(RequestContext ctx, CancellationToken token)
        {
            // AA11.2: a run sees garrison_subordinate_performance only while its agent leads a unit in a live organization.
            if (String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return false;
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            if (run == null) return false;
            return (await _Context.Get<ChainOfCommand>().PositionsAsync(ctx.TenantId, run.AgentId, token).ConfigureAwait(false)).Any(p => p.IsLead);
        }

        private async Task<object> PerformanceToolAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpPerformanceArguments arguments = ManagementArguments<McpPerformanceArguments>(args);
            PerformanceService performance = _Context.Get<PerformanceService>();
            PerformanceQuery query = new PerformanceQuery { FromUtc = arguments.FromUtc, ToUtc = arguments.ToUtc, UnitId = arguments.UnitId };
            if (ctx.PrincipalType != PrincipalTypeEnum.Run)
            {
                OrganizationService organizations = _Context.Get<OrganizationService>();
                Organization organization = await LoadOrganizationAsync(organizations, tenantId, arguments.Organization, token).ConfigureAwait(false);
                await Require(ctx, tenantId, ResourceTypeEnum.Organization, OperationTypeEnum.Read, organization.Id, token).ConfigureAwait(false);
                return await ToolCallAsync(() => performance.GetAsync(organization, query, token)).ConfigureAwait(false);
            }

            // A unit lead's run reads its own subtree, resolved through its own identity; it never names the organization.
            Run run = (String.IsNullOrEmpty(ctx.RunId) ? null : await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false))
                ?? throw ToolError("Forbidden", "garrison_subordinate_performance needs a run token.");
            List<OrgTree> led = (await _Context.Get<ChainOfCommand>().LiveTreesAsync(tenantId, token).ConfigureAwait(false))
                .Where(t => t.PositionOf(run.AgentId)?.IsLead == true).ToList();
            if (led.Count == 0) throw ToolError("NotAUnitLead", "Your agent leads no unit in a live organization, so it has no subtree to report on.");
            OrgTree tree = led[0];
            OrgUnit leadUnit = tree.Unit(tree.PositionOf(run.AgentId)!.UnitId)!;
            OrgUnit unit = leadUnit;
            if (!String.IsNullOrWhiteSpace(arguments.UnitId))
            {
                string key = arguments.UnitId.Trim();
                OrgUnit? found = null;
                foreach (OrgTree candidate in led)
                {
                    OrgUnit mine = candidate.Unit(candidate.PositionOf(run.AgentId)!.UnitId)!;
                    OrgUnit? named = candidate.Unit(key) ?? candidate.Subtree(mine.Id).FirstOrDefault(u => String.Equals(u.Name, key, StringComparison.OrdinalIgnoreCase));
                    if (named != null && candidate.InSubtree(named.Id, mine.Id))
                    {
                        tree = candidate;
                        found = named;
                        break;
                    }
                }
                // The same answer whether the unit exists elsewhere or not at all.
                unit = found ?? throw ToolError("OutsideSubtree", "Unit " + key + " is not inside your unit's subtree.");
            }
            return await ToolCallAsync(() => performance.GetSubtreeAsync(tree, unit, query, token)).ConfigureAwait(false);
        }

        private async Task<Organization> LoadOrganizationAsync(OrganizationService organizations, string tenantId, string? reference, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(reference)) throw ToolError("ValidationFailed", "organization is required: the organization identifier or name.");
            return await organizations.FindAsync(tenantId, reference, token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Organization " + reference + " not found.");
        }

        private static async Task<T> ToolCallAsync<T>(Func<Task<T>> call)
        {
            try
            {
                return await call().ConfigureAwait(false);
            }
            catch (ConflictException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                throw ToolError("ValidationFailed", e.Message + (e.Fields.Count > 0 ? " " + String.Join("; ", e.Fields.Select(f => f.Key + ": " + f.Value)) : String.Empty));
            }
            catch (NotFoundException e)
            {
                throw ToolError("NotFound", e.Message);
            }
        }

        private async Task<object> MessageToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // AA6.6: runs send, reply, read, and acknowledge as their own agent under the line policy and loop guards;
            // people with AgentMessage.Create write to any agent and with AgentMessage.Read list an agent's messages.
            MessageService messages = _Context.Get<MessageService>();
            McpMessageArguments arguments = ManagementArguments<McpMessageArguments>(args);
            Run? run = null;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                if (String.IsNullOrEmpty(ctx.RunId)) throw ToolError("Forbidden", tool.Name + " needs a run token.");
                run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false)
                    ?? throw ToolError("Forbidden", tool.Name + " needs a run token.");
            }
            else if (RunOnlyMessageTool(tool.Name))
            {
                throw ToolError("Forbidden", tool.Name + " is available only to runs.");
            }
            switch (tool.Name)
            {
                case "garrison_send_message":
                case "garrison_reply_message":
                {
                    AgentMessageSendRequest request = new AgentMessageSendRequest();
                    request.Recipient = arguments.Recipient;
                    request.Subject = arguments.Subject;
                    request.Body = arguments.Body;
                    request.Urgency = String.IsNullOrWhiteSpace(arguments.Urgency) ? MessageUrgencyEnum.Normal : ParseOr(arguments.Urgency, MessageUrgencyEnum.Normal, "urgency");
                    request.ArtifactIds = arguments.ArtifactIds ?? new List<string>();
                    request.TtlSeconds = arguments.TtlSeconds;
                    if (tool.Name == "garrison_reply_message")
                    {
                        if (String.IsNullOrWhiteSpace(arguments.MessageId)) throw ToolError("ValidationFailed", "messageId is required.");
                        request.ParentMessageId = arguments.MessageId;
                        return await messages.ReplyFromRunAsync(run!, request, token).ConfigureAwait(false);
                    }
                    if (run != null)
                    {
                        if (!String.IsNullOrWhiteSpace(arguments.IdempotencyKey) || !String.IsNullOrWhiteSpace(arguments.ParentMessageId))
                            throw ToolError("ValidationFailed", "Runs answer a message with garrison_reply_message; parentMessageId and idempotencyKey are for people.");
                        return await messages.SendFromRunAsync(run, request, token).ConfigureAwait(false);
                    }
                    await Require(ctx, tenantId, ResourceTypeEnum.AgentMessage, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    request.ParentMessageId = arguments.ParentMessageId;
                    request.IdempotencyKey = arguments.IdempotencyKey;
                    return await messages.SendFromPersonAsync(ctx, tenantId, request, token).ConfigureAwait(false);
                }
                case "garrison_ack_message":
                {
                    if (String.IsNullOrWhiteSpace(arguments.MessageId)) throw ToolError("ValidationFailed", "messageId is required.");
                    return await messages.AcknowledgeForRunAsync(run!, arguments.MessageId, token).ConfigureAwait(false);
                }
                default:
                {
                    if (run != null)
                    {
                        if (!String.IsNullOrWhiteSpace(arguments.Agent)) throw ToolError("ValidationFailed", "A run reads only its own agent's inbox; agent is for people.");
                        return await messages.ReadInboxForRunAsync(run, arguments.MaxResults, token).ConfigureAwait(false);
                    }
                    if (String.IsNullOrWhiteSpace(arguments.Agent)) throw ToolError("ValidationFailed", "agent is required.");
                    string agentId = await ReportRoutes.AgentIdAsync(_Context.Database, tenantId, arguments.Agent, token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Agent " + arguments.Agent.Trim() + " not found.");
                    await Require(ctx, tenantId, ResourceTypeEnum.AgentMessage, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    AgentMessageFilter filter = new AgentMessageFilter { TenantId = tenantId, RecipientAgentId = agentId, FromUtc = arguments.Since, Skip = Math.Max(0, arguments.Skip ?? 0), MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    if (!String.IsNullOrWhiteSpace(arguments.Status)) filter.Status = ParseOr(arguments.Status, MessageStatusEnum.Queued, "status");
                    if (!String.IsNullOrWhiteSpace(arguments.Urgency)) filter.Urgency = ParseOr(arguments.Urgency, MessageUrgencyEnum.Normal, "urgency");
                    Garrison.Core.Enumeration.EnumerationResult<AgentMessage> page = await _Context.Database.AgentMessages.EnumerateAsync(filter, token).ConfigureAwait(false);
                    McpMessageList list = new McpMessageList();
                    list.Messages = page.Objects;
                    list.TotalCount = page.TotalRecords;
                    return list;
                }
            }
        }

        private static bool RunOnlyEscalationTool(string name)
        {
            return name == "garrison_escalate" || name == "garrison_list_my_escalations" || name == "garrison_withdraw_escalation";
        }

        private async Task<object> ReportToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // AA5.4: runs file as their own agent and read their own and their subordinates' reports (ReportVisibility);
            // people need Report.Create or Report.Read and see the whole tenant.
            ReportService reports = _Context.Get<ReportService>();
            McpReportArguments arguments;
            try
            {
                arguments = ManagementArguments<McpReportArguments>(args);
            }
            catch (ArgumentException e)
            {
                throw ToolError("ValidationFailed", e.Message);
            }
            Run? run = null;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                if (String.IsNullOrEmpty(ctx.RunId)) throw ToolError("Forbidden", tool.Name + " needs a run token.");
                run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false)
                    ?? throw ToolError("Forbidden", tool.Name + " needs a run token.");
            }
            switch (tool.Name)
            {
                case "garrison_file_report":
                {
                    Report request = new Report();
                    try
                    {
                        request.Title = arguments.Title ?? String.Empty;
                    }
                    catch (ArgumentException e)
                    {
                        throw ToolError("ValidationFailed", e.Message);
                    }
                    request.Body = arguments.Body ?? String.Empty;
                    request.Kind = ParseOr(arguments.Kind, ReportKindEnum.Status, "kind");
                    request.Health = ParseOr(arguments.Health, ReportHealthEnum.Unknown, "health");
                    request.Audience = ParseOr(arguments.Audience, ReportAudienceEnum.Manager, "audience");
                    request.PeriodStartUtc = arguments.PeriodStartUtc;
                    request.PeriodEndUtc = arguments.PeriodEndUtc;
                    request.Metrics = arguments.Metrics ?? new List<ReportMetric>();
                    request.Issues = arguments.Issues ?? new List<ReportIssue>();
                    request.Decisions = arguments.Decisions ?? new List<ReportDecision>();
                    if (!String.IsNullOrWhiteSpace(arguments.App))
                        request.AppId = await ReportRoutes.AppIdAsync(_Context.Database, tenantId, arguments.App, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "App " + arguments.App.Trim() + " not found.");
                    if (run != null)
                    {
                        if (!String.IsNullOrWhiteSpace(arguments.Agent) || !String.IsNullOrWhiteSpace(arguments.IdempotencyKey)) throw ToolError("ValidationFailed", "Runs file reports as their own agent; agent and idempotencyKey are for people.");
                        return await reports.FileFromRunAsync(run, request, token).ConfigureAwait(false);
                    }
                    await Require(ctx, tenantId, ResourceTypeEnum.Report, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    if (!String.IsNullOrWhiteSpace(arguments.Agent))
                        request.AuthorAgentId = await ReportRoutes.AgentIdAsync(_Context.Database, tenantId, arguments.Agent, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Agent " + arguments.Agent.Trim() + " not found.");
                    return await reports.FileFromPersonAsync(ctx, tenantId, request, arguments.IdempotencyKey, token).ConfigureAwait(false);
                }
                case "garrison_get_report":
                {
                    if (String.IsNullOrWhiteSpace(arguments.ReportId)) throw ToolError("ValidationFailed", "reportId is required.");
                    if (run != null) return await reports.ReadForRunAsync(run, arguments.ReportId, token).ConfigureAwait(false);
                    await Require(ctx, tenantId, ResourceTypeEnum.Report, OperationTypeEnum.Read, arguments.ReportId.Trim(), token).ConfigureAwait(false);
                    return await _Context.Database.Reports.ReadAsync(tenantId, arguments.ReportId.Trim(), token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Report not found.");
                }
                default:
                {
                    ReportFilter filter = new ReportFilter { TenantId = tenantId, MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100), Skip = Math.Max(0, arguments.Skip ?? 0), FromUtc = arguments.Since };
                    if (!String.IsNullOrWhiteSpace(arguments.Kind)) filter.Kind = ParseOr(arguments.Kind, ReportKindEnum.Status, "kind");
                    if (!String.IsNullOrWhiteSpace(arguments.Health)) filter.Health = ParseOr(arguments.Health, ReportHealthEnum.Unknown, "health");
                    if (!String.IsNullOrWhiteSpace(arguments.Agent))
                        filter.AuthorAgentId = await ReportRoutes.AgentIdAsync(_Context.Database, tenantId, arguments.Agent, token).ConfigureAwait(false) ?? arguments.Agent.Trim();
                    Garrison.Core.Enumeration.EnumerationResult<Report> page;
                    if (run != null)
                    {
                        page = await reports.ListForRunAsync(run, filter, arguments.IncludeOwn ?? true, token).ConfigureAwait(false);
                    }
                    else
                    {
                        await Require(ctx, tenantId, ResourceTypeEnum.Report, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                        if (!String.IsNullOrWhiteSpace(arguments.App))
                            filter.AppId = await ReportRoutes.AppIdAsync(_Context.Database, tenantId, arguments.App, token).ConfigureAwait(false) ?? arguments.App.Trim();
                        page = await reports.ListAsync(filter, token).ConfigureAwait(false);
                    }
                    McpReportList list = new McpReportList();
                    list.Reports = page.Objects;
                    list.TotalCount = page.TotalRecords;
                    return list;
                }
            }
        }

        private async Task<object> FreezeToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            // Run tokens never see these tools; the check stays here in case a caller names one anyway (AA-022).
            if (ctx.PrincipalType == PrincipalTypeEnum.Run) throw ToolError("Forbidden", tool.Name + " is available only to people and API credentials.");
            FreezeService freezes = _Context.Get<FreezeService>();
            McpFreezeArguments arguments = ManagementArguments<McpFreezeArguments>(args);
            switch (tool.Name)
            {
                case "garrison_freeze":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Freeze, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    if (String.IsNullOrWhiteSpace(arguments.TargetKind)) throw ToolError("ValidationFailed", "targetKind is required.");
                    Freeze request = new Freeze();
                    request.TargetKind = ParseOr(arguments.TargetKind, FreezeTargetKindEnum.Agent, "targetKind");
                    request.TargetId = arguments.Target ?? String.Empty;
                    request.Reason = arguments.Reason;
                    request.CancelActiveRuns = arguments.CancelActiveRuns ?? false;
                    return await freezes.ApplyAsync(ctx, tenantId, request, token).ConfigureAwait(false);
                }
                case "garrison_lift_freeze":
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Freeze, OperationTypeEnum.Update, arguments.FreezeId, token).ConfigureAwait(false);
                    if (String.IsNullOrWhiteSpace(arguments.FreezeId)) throw ToolError("ValidationFailed", "freezeId is required.");
                    Freeze freeze = await _Context.Database.Freezes.ReadAsync(tenantId, arguments.FreezeId.Trim(), token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Freeze not found.");
                    return await freezes.LiftAsync(ctx, freeze, arguments.Reason, token).ConfigureAwait(false);
                }
                default:
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Freeze, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    FreezeFilter filter = new FreezeFilter { TenantId = tenantId, MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100), Active = arguments.Active };
                    if (!String.IsNullOrWhiteSpace(arguments.TargetKind)) filter.TargetKind = ParseOr(arguments.TargetKind, FreezeTargetKindEnum.Agent, "targetKind");
                    filter.TargetId = String.IsNullOrWhiteSpace(arguments.Target) ? null : arguments.Target.Trim();
                    Garrison.Core.Enumeration.EnumerationResult<Freeze> page = await _Context.Database.Freezes.EnumerateAsync(filter, token).ConfigureAwait(false);
                    McpFreezeList list = new McpFreezeList();
                    list.Freezes = page.Objects;
                    list.TotalCount = page.TotalRecords;
                    list.KillSwitchEnabled = (await freezes.ReadKillSwitchAsync(tenantId, token).ConfigureAwait(false)).Enabled;
                    return list;
                }
            }
        }

        private async Task<object> EscalationToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            EscalationService escalations = _Context.Get<EscalationService>();
            McpEscalationArguments arguments = ManagementArguments<McpEscalationArguments>(args);
            Run? run = null;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                if (String.IsNullOrEmpty(ctx.RunId)) throw ToolError("Forbidden", tool.Name + " needs a run token.");
                run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false)
                    ?? throw ToolError("Forbidden", tool.Name + " needs a run token.");
            }
            else if (RunOnlyEscalationTool(tool.Name))
            {
                throw ToolError("Forbidden", tool.Name + " is available only to runs.");
            }

            switch (tool.Name)
            {
                case "garrison_escalate":
                {
                    Escalation request = new Escalation();
                    request.Question = arguments.Question ?? String.Empty;
                    request.Context = arguments.Context;
                    request.Options = arguments.Options ?? new List<EscalationOption>();
                    request.Severity = ParseOr(arguments.Severity, EscalationSeverityEnum.Warning, "severity");
                    request.Mode = ParseOr(arguments.Mode, EscalationModeEnum.NonBlocking, "mode");
                    request.TimeoutAction = ParseOr(arguments.TimeoutAction, EscalationTimeoutActionEnum.EscalateUp, "timeoutAction");
                    if (!String.IsNullOrWhiteSpace(arguments.TargetKind)) request.TargetKind = ParseOr(arguments.TargetKind, EscalationTargetKindEnum.User, "targetKind");
                    request.TargetId = arguments.TargetId;
                    if (!String.IsNullOrWhiteSpace(arguments.TargetKind) && request.TargetKind != EscalationTargetKindEnum.Manager && String.IsNullOrWhiteSpace(arguments.TargetId))
                        throw ToolError("ValidationFailed", "targetId is required with targetKind " + request.TargetKind + ".");
                    request.DefaultAnswer = arguments.DefaultAnswer;
                    request.TimeoutSeconds = arguments.TimeoutSeconds ?? 0;
                    Escalation raised = await escalations.RaiseAsync(run!, request, token).ConfigureAwait(false);
                    McpEscalationResult result = new McpEscalationResult();
                    result.Escalation = raised;
                    if (raised.Status != EscalationStatusEnum.Open)
                    {
                        result.Message = "You already asked this; it is " + raised.Status + ". Read the answer in this escalation.";
                    }
                    else if (raised.Mode == EscalationModeEnum.Blocking)
                    {
                        result.Message = "Escalation " + raised.Id + " is open. This run suspends until it is answered.";
                        result.ContinuationInstruction = await _Context.Get<ContinuationService>().WaitInstructionAsync(run!, "Escalation", token).ConfigureAwait(false);
                    }
                    else
                    {
                        result.Message = "Escalation " + raised.Id + " is open. Continue your work; " + (String.IsNullOrEmpty(run!.MandateId)
                            ? "check for the answer with garrison_get_escalation."
                            : "the answer wakes you and arrives in your next tick's input.");
                    }
                    return result;
                }
                case "garrison_get_escalation":
                {
                    Escalation escalation = await VisibleEscalationAsync(ctx, tenantId, run, arguments.EscalationId, OperationTypeEnum.Read, token).ConfigureAwait(false);
                    return escalation;
                }
                case "garrison_list_my_escalations":
                {
                    int max = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
                    EscalationStatusEnum? status = String.IsNullOrWhiteSpace(arguments.Status) ? null : ParseOr(arguments.Status, EscalationStatusEnum.Open, "status");
                    List<Escalation> mine = new List<Escalation>();
                    EscalationFilter raisedFilter = new EscalationFilter { TenantId = tenantId, Status = status, MaxResults = max };
                    if (!String.IsNullOrEmpty(run!.MandateId)) raisedFilter.MandateId = run.MandateId;
                    else raisedFilter.RaisingRunId = run.Id;
                    mine.AddRange((await _Context.Database.Escalations.EnumerateAsync(raisedFilter, token).ConfigureAwait(false)).Objects);
                    EscalationFilter addressed = new EscalationFilter { TenantId = tenantId, Status = status, TargetKind = EscalationTargetKindEnum.Agent, TargetId = run.AgentId, MaxResults = max };
                    foreach (Escalation e in (await _Context.Database.Escalations.EnumerateAsync(addressed, token).ConfigureAwait(false)).Objects)
                        if (!mine.Any(m => m.Id == e.Id)) mine.Add(e);
                    McpEscalationList list = new McpEscalationList();
                    list.Escalations = mine.OrderBy(e => e.Status == EscalationStatusEnum.Open ? 0 : 1).ThenByDescending(e => e.CreatedUtc).Take(max).ToList();
                    list.TotalCount = list.Escalations.Count;
                    return list;
                }
                case "garrison_withdraw_escalation":
                {
                    Escalation escalation = await VisibleEscalationAsync(ctx, tenantId, run, arguments.EscalationId, OperationTypeEnum.Update, token).ConfigureAwait(false);
                    return await escalations.WithdrawAsync(run!, escalation, arguments.Reason, token).ConfigureAwait(false);
                }
                case "garrison_answer_escalation":
                {
                    if (String.IsNullOrWhiteSpace(arguments.EscalationId)) throw ToolError("ValidationFailed", "escalationId is required.");
                    Escalation escalation = await _Context.Database.Escalations.ReadAsync(tenantId, arguments.EscalationId, token).ConfigureAwait(false)
                        ?? throw ToolError("NotFound", "Escalation not found.");
                    EscalationResolutionSourceEnum source = EscalationResolutionSourceEnum.User;
                    if (run != null)
                    {
                        if (escalation.TargetKind != EscalationTargetKindEnum.Agent || escalation.TargetId != run.AgentId) throw ToolError("NotFound", "Escalation not found.");
                        source = EscalationResolutionSourceEnum.Agent;
                        ctx.PrincipalName = run.AgentName;
                    }
                    else
                    {
                        await Require(ctx, tenantId, ResourceTypeEnum.Escalation, OperationTypeEnum.Update, escalation.Id, token).ConfigureAwait(false);
                    }
                    EscalationAnswerRequest answer = new EscalationAnswerRequest { Choice = arguments.Choice, Text = arguments.Text };
                    return await escalations.AnswerAsync(ctx, escalation, answer, source, token).ConfigureAwait(false);
                }
                default:
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Escalation, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    EscalationFilter filter = new EscalationFilter { TenantId = tenantId, MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) };
                    if (!String.IsNullOrWhiteSpace(arguments.Status)) filter.Status = ParseOr(arguments.Status, EscalationStatusEnum.Open, "status");
                    if (!String.IsNullOrWhiteSpace(arguments.Severity)) filter.Severity = ParseOr(arguments.Severity, EscalationSeverityEnum.Warning, "severity");
                    filter.AgentId = String.IsNullOrWhiteSpace(arguments.Agent) ? null : arguments.Agent.Trim();
                    filter.MandateId = String.IsNullOrWhiteSpace(arguments.Mandate) ? null : arguments.Mandate.Trim();
                    Garrison.Core.Enumeration.EnumerationResult<Escalation> page = await _Context.Database.Escalations.EnumerateAsync(filter, token).ConfigureAwait(false);
                    McpEscalationList list = new McpEscalationList();
                    list.Escalations = page.Objects;
                    list.TotalCount = page.TotalRecords;
                    return list;
                }
            }
        }

        private async Task<Escalation> VisibleEscalationAsync(RequestContext ctx, string tenantId, Run? run, string? escalationId, OperationTypeEnum operation, CancellationToken token)
        {
            if (String.IsNullOrWhiteSpace(escalationId)) throw ToolError("ValidationFailed", "escalationId is required.");
            Escalation escalation = await _Context.Database.Escalations.ReadAsync(tenantId, escalationId.Trim(), token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Escalation not found.");
            if (run == null)
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Escalation, operation, escalation.Id, token).ConfigureAwait(false);
                return escalation;
            }
            bool raised = escalation.RaisingRunId == run.Id || (!String.IsNullOrEmpty(run.MandateId) && escalation.MandateId == run.MandateId);
            bool addressed = operation == OperationTypeEnum.Read && escalation.TargetKind == EscalationTargetKindEnum.Agent && escalation.TargetId == run.AgentId;
            if (!raised && !addressed) throw ToolError("NotFound", "Escalation not found.");
            return escalation;
        }

        private static T ParseOr<T>(string? value, T fallback, string field) where T : struct, Enum
        {
            if (String.IsNullOrWhiteSpace(value)) return fallback;
            if (Enum.TryParse<T>(value.Trim(), true, out T parsed) && Enum.IsDefined(parsed)) return parsed;
            throw ToolError("ValidationFailed", field + " must be one of " + String.Join(", ", Enum.GetNames<T>()) + ".");
        }

        private async Task<Run?> KeeperRunAsync(RequestContext ctx, CancellationToken token)
        {
            if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.TenantId) || String.IsNullOrEmpty(ctx.RunId)) return null;
            Run? run = await _Context.Database.Runs.ReadAsync(ctx.TenantId, ctx.RunId, token).ConfigureAwait(false);
            if (run == null || run.Kind != RunKindEnum.Keeper || String.IsNullOrEmpty(run.MandateId) || String.IsNullOrEmpty(run.MandateTickId)) return null;
            return run;
        }

        private async Task<object> ListAgentsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery();
            query.Search = args?.GetString("search");
            query.MaxResults = (int)Math.Clamp(args?.GetInt64("maxResults") ?? 25, 1, 100);
            query.ActiveOnly = true;
            EnumerationResult<Agent> page = await _Context.Database.Agents.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);

            List<Agent> visible = await VisibleToRunAsync(ctx, tenantId, page.Objects, token).ConfigureAwait(false);

            McpAgentList list = new McpAgentList();
            list.Agents = visible.Select(Describe).ToList();
            // Hints come from the capability catalog (AD4.5); an agent without a descriptor yet has none.
            List<CapabilityDescriptor> descriptors = await _Context.Database.Capabilities.ListInScopeAsync(tenantId, CapabilityKindEnum.Agent, CapabilityOriginEnum.Derived, token).ConfigureAwait(false);
            Dictionary<string, CapabilityHints> hints = new Dictionary<string, CapabilityHints>(StringComparer.Ordinal);
            foreach (CapabilityDescriptor descriptor in descriptors.Where(d => d.SourceAgentId != null)) hints[descriptor.SourceAgentId!] = descriptor.Hints;
            foreach (McpAgentSummary summary in list.Agents) summary.Hints = hints.TryGetValue(summary.Id, out CapabilityHints? found) ? found : null;
            list.TotalRecords = ctx.PrincipalType == PrincipalTypeEnum.Run ? list.Agents.Count : page.TotalRecords;
            return list;
        }

        private async Task<object> FanOutToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            FanOutService fanOuts = _Context.Get<FanOutService>();
            if (tool.Name == "garrison_fan_out")
            {
                // Members are children of the calling run, so only a run token can fan out (AD5.2).
                if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.RunId)) throw ToolError("Forbidden", "Only a run can fan out; its members become its child runs.");
                Run parent = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run not found.");
                FanOutRequest request = ManagementArguments<FanOutRequest>(args);
                try
                {
                    return await fanOuts.StartAsync(ctx, parent, request, (agent, ct) => Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, ct), token).ConfigureAwait(false);
                }
                catch (DelegationCapacityExhaustedException e)
                {
                    throw ToolError(e.Code, e.Message);
                }
                catch (ConflictException e)
                {
                    throw ToolError(e.Code, e.Message);
                }
                catch (ValidationException e)
                {
                    throw ToolError(e.Code ?? "ValidationFailed", e.Message);
                }
                catch (NotFoundException e)
                {
                    throw ToolError("NotFound", e.Message);
                }
            }
            McpFanOutArguments arguments = ManagementArguments<McpFanOutArguments>(args);
            if (String.IsNullOrWhiteSpace(arguments.FanOutGroupId))
            {
                // A run may omit the identifier to use the group it started most recently.
                if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.RunId)) throw ToolError("ValidationFailed", "fanOutGroupId is required.");
                List<FanOutGroup> mine = await _Context.Database.FanOuts.ListByParentAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
                arguments.FanOutGroupId = mine.LastOrDefault()?.Id ?? throw ToolError("NotFound", "This run has not started a fan-out group.");
            }
            FanOutGroup group = await _Context.Database.FanOuts.ReadAsync(tenantId, arguments.FanOutGroupId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Fan-out group not found.");
            Run? groupParent = await _Context.Database.Runs.ReadAsync(tenantId, group.ParentRunId, token).ConfigureAwait(false);
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                // A run reaches only the groups it started.
                if (group.ParentRunId != ctx.RunId) throw ToolError("NotFound", "Fan-out group not found.");
            }
            else
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Run, tool.Operation == OperationTypeEnum.Read ? OperationTypeEnum.Read : OperationTypeEnum.Update, group.ParentRunId, token).ConfigureAwait(false);
            }
            if (tool.Name == "garrison_cancel_fan_out") return await fanOuts.CancelAsync(group, String.IsNullOrWhiteSpace(arguments.Reason) ? "Cancelled with garrison_cancel_fan_out." : arguments.Reason.Trim(), token).ConfigureAwait(false);

            int maxWait = _Context.Settings.Mcp.MaxToolWaitSeconds;
            int waitSeconds = Math.Clamp(arguments.WaitSeconds ?? maxWait, 0, maxWait);
            bool durable = false;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && groupParent != null)
            {
                Deployment? deployment = await _Context.Database.Deployments.ReadAsync(tenantId, groupParent.DeploymentId, token).ConfigureAwait(false);
                // A parent that can suspend does not hold its slot while members run (AD5.5): it finishes its turn and is
                // resumed when the group ends.
                durable = deployment?.SuspensionEnabled == true;
                if (durable) waitSeconds = 0;
            }
            FanOutGroupView view = await fanOuts.GatherAsync(group, waitSeconds, token).ConfigureAwait(false);
            if (durable && view.Status == FanOutGroupStatusEnum.Running)
            {
                view.ContinuationMarker = "GARRISON_CONTINUATION_WAIT";
                view.ContinuationInstruction = await _Context.Get<ContinuationService>().WaitInstructionAsync(groupParent!, "Child", token).ConfigureAwait(false);
            }
            return view;
        }

        private async Task<object> AppToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpAppArguments arguments = ManagementArguments<McpAppArguments>(args);
            AgenticAppService apps = _Context.Get<AgenticAppService>();
            try
            {
                if (tool.Name == "garrison_list_apps")
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    return await _Context.Database.Apps.EnumerateAsync(tenantId, new EnumerationQuery { Search = arguments.Search, MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100) }, token).ConfigureAwait(false);
                }
                if (tool.Name == "garrison_create_app")
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    return await apps.CreateAsync(ctx, tenantId, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(arguments.App)) throw ToolError("ValidationFailed", "app is required.");
                AgenticApp app = await apps.ResolveAsync(tenantId, arguments.App, token).ConfigureAwait(false);
                await Require(ctx, tenantId, ResourceTypeEnum.AgenticApp, tool.Operation, app.Id, token).ConfigureAwait(false);
                if (tool.Name == "garrison_get_app") return app;
                return await apps.UpdateAsync(ctx, tenantId, app, arguments.Configuration ?? throw ToolError("ValidationFailed", "configuration is required."), token).ConfigureAwait(false);
            }
            catch (NotFoundException e)
            {
                throw ToolError("NotFound", e.Message);
            }
            catch (ConflictException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                throw ToolError(e.Code ?? "ValidationFailed", e.Message);
            }
        }

        private async Task<object> PromptTemplateToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpPromptTemplateArguments arguments = ManagementArguments<McpPromptTemplateArguments>(args);
            PromptTemplateService templates = _Context.Get<PromptTemplateService>();
            try
            {
                await Require(ctx, tenantId, ResourceTypeEnum.PromptTemplate, tool.Operation, null, token).ConfigureAwait(false);
                if (tool.Name == "garrison_render_prompt_template" && String.IsNullOrWhiteSpace(arguments.Template))
                {
                    if (arguments.Content == null) throw ToolError("ValidationFailed", "template or content is required.");
                    return await templates.RenderAsync(tenantId, "ad hoc", arguments.Content, new PromptRenderRequest { Content = arguments.Content, Context = arguments.Context }, token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(arguments.Template)) throw ToolError("ValidationFailed", "template is required.");
                PromptTemplate template = await _Context.Database.PromptTemplates.ReadAsync(tenantId, arguments.Template, token).ConfigureAwait(false)
                    ?? await _Context.Database.PromptTemplates.ReadByNameAsync(tenantId, arguments.Template, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "Prompt template " + arguments.Template + " not found.");
                switch (tool.Name)
                {
                    case "garrison_clone_prompt_template":
                        if (String.IsNullOrWhiteSpace(arguments.Name)) throw ToolError("ValidationFailed", "name is required.");
                        return await templates.CloneAsync(ctx, tenantId, template, arguments.Name, token).ConfigureAwait(false);
                    case "garrison_reset_prompt_template":
                        return await templates.ResetAsync(ctx, tenantId, template, token).ConfigureAwait(false);
                    case "garrison_render_prompt_template":
                        return await templates.RenderAsync(tenantId, template.Name, arguments.Content ?? template.Content, new PromptRenderRequest { Context = arguments.Context }, token).ConfigureAwait(false);
                    default:
                        PromptTemplateRequest update = new PromptTemplateRequest
                        {
                            Name = arguments.Name ?? template.Name, Description = arguments.Description ?? template.Description, Kind = arguments.Kind ?? template.Kind,
                            Content = arguments.Content ?? template.Content, ChangeNote = arguments.ChangeNote, Variables = arguments.Content == null ? template.Variables : new List<PromptTemplateVariable>()
                        };
                        return await templates.UpdateAsync(ctx, tenantId, template, update, token).ConfigureAwait(false);
                }
            }
            catch (NotFoundException e)
            {
                throw ToolError("NotFound", e.Message);
            }
            catch (ConflictException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                throw ToolError(e.Code ?? "ValidationFailed", e.Message);
            }
        }

        private static EnumerationQuery ToolPage(McpArchitectArguments arguments)
        {
            EnumerationQuery query = new EnumerationQuery();
            query.Search = String.IsNullOrWhiteSpace(arguments.Search) ? null : arguments.Search;
            query.MaxResults = Math.Clamp(arguments.MaxResults ?? 25, 1, 100);
            query.Skip = Math.Max(arguments.Skip ?? 0, 0);
            return query;
        }

        private async Task<object> ArchitectToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpArchitectArguments arguments = ManagementArguments<McpArchitectArguments>(args);
            ArchitectService architects = _Context.Get<ArchitectService>();
            try
            {
                if (tool.Name == "garrison_studio_list_architect_prompts")
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    return await architects.EnumeratePromptsAsync(tenantId, ToolPage(arguments), token).ConfigureAwait(false);
                }
                if (tool.Name == "garrison_studio_list_architects")
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                    EnumerationQuery query = ToolPage(arguments);
                    query.ActiveOnly = arguments.ActiveOnly ?? false;
                    return await architects.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
                }
                if (tool.Name == "garrison_studio_create_architect")
                {
                    await Require(ctx, tenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
                    ArchitectRequest create = new ArchitectRequest
                    {
                        Name = arguments.Name ?? String.Empty, Description = arguments.Description, HarnessProfileId = arguments.HarnessProfileId ?? String.Empty, Model = arguments.Model,
                        Active = arguments.Active ?? true, ArchitectPromptTemplateId = arguments.ArchitectPromptTemplateId, ArchitectPromptVersion = arguments.ArchitectPromptVersion,
                        CredentialSecretId = arguments.CredentialSecretId, EndpointName = arguments.EndpointName, InferenceEndpoint = arguments.InferenceEndpoint
                    };
                    return await architects.CreateAsync(ctx, tenantId, create, token).ConfigureAwait(false);
                }
                if (tool.Name == "garrison_studio_get_architect" || tool.Name == "garrison_studio_update_architect" || tool.Name == "garrison_studio_delete_architect")
                {
                    if (String.IsNullOrWhiteSpace(arguments.Architect)) throw ToolError("ValidationFailed", "architect is required.");
                    Deployment existing = await architects.ResolveAsync(tenantId, arguments.Architect, token).ConfigureAwait(false);
                    await Require(ctx, tenantId, ResourceTypeEnum.Deployment, tool.Operation, existing.Id, token).ConfigureAwait(false);
                    if (tool.Name == "garrison_studio_get_architect") return await architects.ReadAsync(tenantId, existing.Id, token).ConfigureAwait(false);
                    if (tool.Name == "garrison_studio_delete_architect")
                    {
                        await architects.DeleteAsync(ctx, tenantId, existing, token).ConfigureAwait(false);
                        return new McpConfigurationDeletion { Id = existing.Id, Deleted = true };
                    }
                    Architect current = await architects.ReadAsync(tenantId, existing.Id, token).ConfigureAwait(false);
                    ArchitectRequest update = new ArchitectRequest
                    {
                        Name = arguments.Name ?? current.Name, Description = arguments.Description ?? current.Description, HarnessProfileId = arguments.HarnessProfileId ?? current.HarnessProfileId,
                        Model = arguments.Model ?? current.Model, Active = arguments.Active ?? current.Active, ArchitectPromptTemplateId = arguments.ArchitectPromptTemplateId, ArchitectPromptVersion = arguments.ArchitectPromptVersion,
                        CredentialSecretId = arguments.CredentialSecretId, EndpointName = arguments.EndpointName, InferenceEndpoint = arguments.InferenceEndpoint
                    };
                    return await architects.UpdateAsync(ctx, tenantId, existing, update, token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(arguments.Deployment)) throw ToolError("ValidationFailed", "deployment is required.");
                Deployment deployment = await _Context.Database.Deployments.ReadAsync(tenantId, arguments.Deployment, token).ConfigureAwait(false)
                    ?? await _Context.Database.Deployments.ReadByNameAsync(tenantId, arguments.Deployment, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "Deployment " + arguments.Deployment + " not found.");
                await Require(ctx, tenantId, ResourceTypeEnum.Deployment, tool.Operation, deployment.Id, token).ConfigureAwait(false);
                if (tool.Name == "garrison_studio_get_architect_prompt") return await architects.GetPromptAsync(tenantId, deployment, token).ConfigureAwait(false);
                ArchitectPromptRequest request = new ArchitectPromptRequest { ArchitectPromptTemplateId = arguments.ArchitectPromptTemplateId ?? String.Empty, ArchitectPromptVersion = arguments.ArchitectPromptVersion };
                return await architects.SetPromptAsync(ctx, tenantId, deployment, request, token).ConfigureAwait(false);
            }
            catch (NotFoundException e)
            {
                throw ToolError("NotFound", e.Message);
            }
            catch (ConflictException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                throw ToolError(e.Code ?? "ValidationFailed", e.Message);
            }
        }

        private async Task<object> StudioToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpStudioArguments arguments = ManagementArguments<McpStudioArguments>(args);
            StudioService studio = _Context.Get<StudioService>();
            try
            {
                await Require(ctx, tenantId, ResourceTypeEnum.StudioDraft, tool.Operation, null, token).ConfigureAwait(false);
                if (tool.Name == "garrison_studio_list_drafts")
                {
                    string? owner = null;
                    if (ctx.PrincipalType == PrincipalTypeEnum.Run) StudioService.Owner(ctx, out owner, out string? _);
                    EnumerationResult<StudioDraft> drafts = await _Context.Database.StudioDrafts.EnumerateAsync(tenantId, owner, new EnumerationQuery { Search = arguments.Title, MaxResults = 100 }, null, token).ConfigureAwait(false);
                    if (ctx.PrincipalType == PrincipalTypeEnum.Run)
                    {
                        // An executive sees only its own proposals; any other run never sees them (AA8.3).
                        List<StudioDraft> visible = new List<StudioDraft>();
                        foreach (StudioDraft candidate in drafts.Objects)
                        {
                            if (await studio.RunMayUseAsync(ctx, candidate, token).ConfigureAwait(false)) visible.Add(candidate);
                        }
                        drafts.TotalRecords -= drafts.Objects.Count - visible.Count;
                        drafts.Objects = visible;
                    }
                    return drafts;
                }
                if (tool.Name == "garrison_studio_create_draft")
                {
                    StudioDraftCreateRequest create = new StudioDraftCreateRequest { Title = arguments.Title, FromApp = arguments.FromApp };
                    if (ctx.PrincipalType == PrincipalTypeEnum.Run)
                    {
                        Run? run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId ?? String.Empty, token).ConfigureAwait(false);
                        create.ConversationId = run?.ConversationId;
                    }
                    return await studio.CreateAsync(ctx, tenantId, create, token).ConfigureAwait(false);
                }
                if (String.IsNullOrWhiteSpace(arguments.DraftId)) throw ToolError("ValidationFailed", "draftId is required.");
                StudioDraft draft = await studio.ReadAsync(tenantId, arguments.DraftId, token).ConfigureAwait(false);
                // A run works only on drafts of the person it acts for (AD-017); an executive only on its own proposals (AA8.3).
                if (!await studio.RunMayUseAsync(ctx, draft, token).ConfigureAwait(false)) throw ToolError("NotFound", "Draft not found.");
                int version = arguments.Version ?? draft.Version;
                if (tool.Name == "garrison_studio_playground_invoke")
                {
                    if (String.IsNullOrWhiteSpace(arguments.Input)) throw ToolError("ValidationFailed", "input is required.");
                    await Require(ctx, tenantId, ResourceTypeEnum.AgentRevision, OperationTypeEnum.Update, null, token).ConfigureAwait(false);
                    PlaygroundInvokeRequest play = new PlaygroundInvokeRequest { Input = arguments.Input, Agent = arguments.Agent, ConversationId = arguments.ConversationId, WaitSeconds = arguments.WaitSeconds ?? 120 };
                    return await _Context.Get<PlaygroundService>().InvokeDraftAsync(ctx, tenantId, draft, play, token).ConfigureAwait(false);
                }
                switch (tool.Name)
                {
                    case "garrison_studio_get_draft":
                        return draft;
                    case "garrison_studio_graph":
                        return StudioService.Graph(draft);
                    case "garrison_studio_diff":
                    case "garrison_studio_validate":
                        return await studio.DiffAsync(ctx, tenantId, draft, token).ConfigureAwait(false);
                }
                if (!arguments.Version.HasValue) throw ToolError("ValidationFailed", "version is required: the draft version you read.");
                switch (tool.Name)
                {
                    case "garrison_studio_put_item":
                        if (String.IsNullOrWhiteSpace(arguments.Kind) || String.IsNullOrWhiteSpace(arguments.Name)) throw ToolError("ValidationFailed", "kind and name are required.");
                        return await studio.PutItemAsync(tenantId, draft.Id, arguments.Kind, arguments.Name, new StudioDraftItemRequest { Version = version, Operation = arguments.Operation, Document = arguments.Document ?? String.Empty }, token).ConfigureAwait(false);
                    case "garrison_studio_remove_item":
                        if (String.IsNullOrWhiteSpace(arguments.Kind) || String.IsNullOrWhiteSpace(arguments.Name)) throw ToolError("ValidationFailed", "kind and name are required.");
                        return await studio.RemoveItemAsync(tenantId, draft.Id, arguments.Kind, arguments.Name, version, token).ConfigureAwait(false);
                    case "garrison_studio_graph_operation":
                        if (!arguments.GraphOperation.HasValue) throw ToolError("ValidationFailed", "graphOperation is required.");
                        StudioGraphOperationRequest operation = new StudioGraphOperationRequest
                        {
                            Version = version, Operation = arguments.GraphOperation.Value, App = arguments.App, Agent = arguments.Agent, Role = arguments.Role,
                            From = arguments.From, To = arguments.To, FanOut = arguments.FanOut, NodeKey = arguments.NodeKey, X = arguments.X ?? 0, Y = arguments.Y ?? 0,
                            Organization = arguments.Organization, Unit = arguments.Unit, Parent = arguments.Parent
                        };
                        return await studio.ApplyGraphOperationAsync(tenantId, draft.Id, operation, token).ConfigureAwait(false);
                    default:
                        return await studio.RequestApplyAsync(ctx, tenantId, draft.Id, version, token).ConfigureAwait(false);
                }
            }
            catch (NotFoundException e)
            {
                throw ToolError("NotFound", e.Message);
            }
            catch (ConflictException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (AppAccessException e)
            {
                throw ToolError(e.Code, e.Message);
            }
            catch (ValidationException e)
            {
                throw ToolError(e.Code ?? "ValidationFailed", e.Message);
            }
        }

        private async Task<object> CapabilityToolAsync(RequestContext ctx, string tenantId, McpToolDefinition tool, RpcParameters? args, CancellationToken token)
        {
            McpCapabilityArguments arguments = ManagementArguments<McpCapabilityArguments>(args);
            CapabilityService capabilities = _Context.Get<CapabilityService>();
            bool designCatalog = tool.ResourceType == ResourceTypeEnum.StudioDraft;
            bool listing = tool.Name == "garrison_list_capabilities" || tool.Name == "garrison_studio_list_capabilities";
            Run? caller = null;
            if (designCatalog)
            {
                if (ctx.PrincipalType == PrincipalTypeEnum.Run && !await DraftGrantAsync(ctx, token).ConfigureAwait(false))
                    throw ToolError("Forbidden", "Design capability discovery requires managementAccess Drafts.");
                await Require(ctx, tenantId, ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            }
            else if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                // Run tokens see only what they may use (AD4.6): the discovery permission they already hold decides access.
                await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
                caller = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId ?? String.Empty, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run not found.");
            }
            else
            {
                await Require(ctx, tenantId, ResourceTypeEnum.Capability, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            }
            CapabilityKindEnum? kind = null;
            if (!String.IsNullOrEmpty(arguments.Kind))
            {
                if (!Enum.TryParse(arguments.Kind, true, out CapabilityKindEnum parsed)) throw ToolError("ValidationFailed", "kind is Agent, McpTool, or HarnessBuiltIn.");
                kind = parsed;
            }
            List<CapabilityDescriptor> list = await capabilities.ListAsync(tenantId, listing ? kind : null, arguments.Tag, arguments.Search, token).ConfigureAwait(false);
            if (caller != null) list = await capabilities.VisibleToRunAsync(caller, list, token).ConfigureAwait(false);
            if (listing) return new McpCapabilityList { Capabilities = list, TotalRecords = list.Count };
            if (String.IsNullOrWhiteSpace(arguments.Capability)) throw ToolError("ValidationFailed", "capability is required.");
            CapabilityDescriptor? match = list.FirstOrDefault(d => d.Id == arguments.Capability)
                ?? list.Where(d => d.Name == arguments.Capability).OrderBy(d => d.Kind).ThenBy(d => d.TenantId == null ? 1 : 0).FirstOrDefault();
            return match ?? throw ToolError("NotFound", "No capability you may use is named " + arguments.Capability + ".");
        }

        private async Task<object> GetAgentAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            Agent agent = await _Invoker.ResolveAgentAsync(tenantId, args?.GetString("agent"), token).ConfigureAwait(false);
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Read, agent.Id, token).ConfigureAwait(false);
            return Describe(agent);
        }

        private async Task<object> InvokeAsync(RequestContext ctx, string tenantId, RpcParameters? args, bool wait, CancellationToken token, string? gatewayOperationId = null)
        {
            Agent agent = await _Invoker.ResolveAgentAsync(tenantId, args?.GetString("agent"), token).ConfigureAwait(false);
            await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);
            return await InvokeAgentAsync(ctx, tenantId, agent, args, wait, wait ? "garrison_invoke_agent" : "garrison_start_run", token, gatewayOperationId).ConfigureAwait(false);
        }

        private async Task<object> AgentToolCallAsync(RequestContext ctx, string tenantId, string toolName, RpcParameters? args, CancellationToken token, string? gatewayOperationId = null)
        {
            List<Agent> offered = await AgentToolsAsync(ctx, tenantId, token).ConfigureAwait(false);
            Agent agent = offered.FirstOrDefault(a => AgentToolName(a) == toolName) ?? throw ToolError("NotFound", "No agent you may invoke is offered as the MCP tool " + toolName + " in this tenant.");
            return await InvokeAgentAsync(ctx, tenantId, agent, args, true, toolName, token, gatewayOperationId).ConfigureAwait(false);
        }

        private async Task<object> InvokeAgentAsync(RequestContext ctx, string tenantId, Agent agent, RpcParameters? args, bool wait, string toolName, CancellationToken token, string? gatewayOperationId = null)
        {

            InvocationOptions options = new InvocationOptions();
            options.Input = args?.GetString("input") ?? String.Empty;
            if (String.IsNullOrWhiteSpace(options.Input)) throw ToolError("ValidationFailed", "input is required.");
            options.DeploymentId = args?.GetString("deploymentId");
            options.IdempotencyKey = args?.GetString("idempotencyKey") ?? gatewayOperationId;
            options.Parameters = ReadParameters(args);
            options.ConversationId = args?.GetString("conversationId");
            options.StartConversation = args?.GetBoolean("startConversation") ?? false;
            options.Wait = wait;
            long requested = args?.GetInt64("waitSeconds") ?? _Context.Settings.Mcp.MaxToolWaitSeconds;
            options.WaitSeconds = (int)Math.Clamp(requested, 0, _Context.Settings.Mcp.MaxToolWaitSeconds);
            // Voltaic cancels the tool call's token when the client sends notifications/cancelled for it or the MCP
            // session is deleted or closed; garrison_invoke_agent (and an agent tool) then cancels the run it is waiting on.
            options.CancelOnDisconnect = wait;
            options.CallerGone = () => !_Context.IsDraining;
            options.DisconnectReason = "the MCP client cancelled " + toolName + " or closed its session";
            options.Surface = "mcp";
            bool durableWait = false;
            if (wait && ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId))
            {
                Run? parent = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
                Deployment? parentDeployment = parent == null ? null : await _Context.Database.Deployments.ReadAsync(tenantId, parent.DeploymentId, token).ConfigureAwait(false);
                durableWait = parentDeployment?.SuspensionEnabled == true;
                if (durableWait)
                {
                    // Persist the child wait but return the checkpoint boundary instead of holding a resident caller.
                    options.Wait = false;
                    options.CallerWaits = true;
                    options.DurableWait = true;
                    options.CancelOnDisconnect = false;
                }
            }
            Run run = await _Invoker.InvokeAsync(ctx, tenantId, agent, options, token).ConfigureAwait(false);
            if (durableWait)
            {
                McpRunSummary suspended = await SummarizeAsync(run, token).ConfigureAwait(false);
                suspended.ContinuationMarker = "GARRISON_CONTINUATION_WAIT";
                Run parent = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId!, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Parent run not found.");
                suspended.ContinuationInstruction = await _Context.Get<ContinuationService>().WaitInstructionAsync(parent, "Child", token).ConfigureAwait(false);
                return suspended;
            }
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

        private async Task<object> RunTranscriptAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpTranscriptArguments arguments = ManagementArguments<McpTranscriptArguments>(args);
            TranscriptFormatEnum format = TranscriptResponder.Parse(arguments.Format);
            Run run = await RequireRunAsync(ctx, tenantId, args, OperationTypeEnum.Read, token).ConfigureAwait(false);
            Transcript transcript = await _Context.Get<TranscriptService>().BuildRunAsync(run, arguments.IncludeThinking, token).ConfigureAwait(false);
            return TranscriptResult(transcript, format);
        }

        private async Task<object> ConversationTranscriptAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            McpTranscriptArguments arguments = ManagementArguments<McpTranscriptArguments>(args);
            TranscriptFormatEnum format = TranscriptResponder.Parse(arguments.Format);
            if (String.IsNullOrWhiteSpace(arguments.ConversationId)) throw ToolError("ValidationFailed", "conversationId is required.");
            Conversation conversation = await _Context.Database.Conversations.ReadAsync(tenantId, arguments.ConversationId, token).ConfigureAwait(false)
                ?? throw ToolError("NotFound", "Conversation " + arguments.ConversationId + " not found.");
            await Require(ctx, tenantId, ResourceTypeEnum.Conversation, OperationTypeEnum.Read, conversation.Id, token).ConfigureAwait(false);
            Transcript transcript = await _Context.Get<TranscriptService>().BuildConversationAsync(conversation, arguments.IncludeThinking, token).ConfigureAwait(false);
            return TranscriptResult(transcript, format);
        }

        private static McpTranscriptExport TranscriptResult(Transcript transcript, TranscriptFormatEnum format)
        {
            McpTranscriptExport export = new McpTranscriptExport();
            export.Format = format == TranscriptFormatEnum.Json ? "json" : "markdown";
            export.MediaType = format == TranscriptFormatEnum.Json ? "application/json" : "text/markdown";
            export.FileName = TranscriptService.FileName(transcript, format);
            export.Truncated = transcript.Truncated;
            if (format == TranscriptFormatEnum.Json) export.Transcript = transcript;
            else export.Markdown = TranscriptMarkdownWriter.Write(transcript);
            return export;
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
            string? evalRunId = args?.GetString("evalRunId");
            if (!String.IsNullOrWhiteSpace(evalRunId)) filter.EvalRunId = evalRunId.Trim();
            string? shadowTrialId = args?.GetString("shadowTrialId");
            if (!String.IsNullOrWhiteSpace(shadowTrialId)) filter.ShadowTrialId = shadowTrialId.Trim();
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId)) filter.RootRunId = await RootOfAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
            List<Run> visible = await HiddenRuns().VisibleAsync(ctx, page.Objects, token).ConfigureAwait(false);
            if (visible.Count != page.Objects.Count)
            {
                page.TotalRecords = Math.Max(0, page.TotalRecords - (page.Objects.Count - visible.Count));
                page.Objects = visible;
            }
            McpRunList list = new McpRunList();
            BlockedRunService? blocked = _Context.TryGet<BlockedRunService>();
            if (blocked != null) await blocked.AnnotateManyAsync(page.Objects, token).ConfigureAwait(false);
            list.Runs = page.Objects.Select(Summarize).ToList();
            list.TotalRecords = page.TotalRecords;
            return list;
        }

        private async Task<object> UploadArtifactAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Artifact, OperationTypeEnum.Create, null, token).ConfigureAwait(false);
            ArtifactUploadRequest? request = args?.Deserialize<ArtifactUploadRequest>();
            if (request == null || request.Epoch < 1 || request.RepairAttempt < 0) throw ToolError("BadRequest", "Artifact upload needs a run, current epoch, and repair attempt.");
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && ctx.RunId != request.RunId) throw ToolError("NotFound", "Run not found.");
            if (request.ContentBase64.Length > ((_Context.Settings.Artifacts.MaxFileBytes + 2L) / 3L) * 4L) throw ToolError("BadRequest", "Artifact exceeds the configured file byte limit.");
            byte[] bytes;
            try { bytes = Convert.FromBase64String(request.ContentBase64); }
            catch (FormatException) { throw ToolError("BadRequest", "Artifact content is not valid base64."); }
            return await _Context.Get<ArtifactService>().UploadAsync(tenantId, request.RunId, request.StoreId, request.Name, request.MediaType, request.Epoch, request.RepairAttempt, bytes, token).ConfigureAwait(false);
        }

        private async Task<object> PermissionPromptAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            // Only a run may ask about its own tool calls; the run comes from the run token, never from the arguments.
            if (ctx.PrincipalType != PrincipalTypeEnum.Run || String.IsNullOrEmpty(ctx.RunId)) throw ToolError("Forbidden", "Only a run token may call garrison_permission_prompt.");
            ApprovalService approvals = _Context.TryGet<ApprovalService>() ?? throw ToolError("Unavailable", "Approvals are not available on this server.");
            Run run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Run " + ctx.RunId + " not found.");

            PermissionPromptArguments? arguments = null;
            if (args != null && !String.IsNullOrEmpty(args.RawJson))
            {
                try
                {
                    arguments = Serializer.Deserialize<PermissionPromptArguments>(args.RawJson);
                }
                catch (Exception e) when (e is JsonException || e is NotSupportedException)
                {
                    throw ToolError("ValidationFailed", "The arguments are not valid: " + e.Message);
                }
            }
            if (arguments == null || String.IsNullOrWhiteSpace(arguments.ToolName)) throw ToolError("ValidationFailed", "tool_name is required.");

            ApprovalRequestInput input = new ApprovalRequestInput();
            input.ToolName = arguments.ToolName!;
            input.InputJson = arguments.Input.HasValue && arguments.Input.Value.ValueKind != JsonValueKind.Undefined ? arguments.Input.Value.GetRawText() : "{}";
            input.ToolCallId = arguments.ToolUseId;
            if (!String.IsNullOrEmpty(arguments.Kind) && Enum.TryParse<ApprovalKindEnum>(arguments.Kind, true, out ApprovalKindEnum kind)) input.Kind = kind;

            ApprovalOutcome outcome = await approvals.RequestAsync(run, input, token).ConfigureAwait(false);
            PermissionPromptResult result = new PermissionPromptResult();
            result.Suspended = outcome.Message?.Contains("GARRISON_CONTINUATION_WAIT", StringComparison.Ordinal) == true;
            result.ApprovalId = outcome.Approval?.Id;
            result.ApprovalStatus = outcome.Approval?.Status.ToString();
            if (outcome.Decision == ApprovalDecisionEnum.Allow)
            {
                result.Behavior = "allow";
                if (arguments.Input.HasValue && arguments.Input.Value.ValueKind == JsonValueKind.Object)
                {
                    result.UpdatedInput = arguments.Input.Value.Clone();
                }
                else
                {
                    using (JsonDocument empty = JsonDocument.Parse("{}"))
                    {
                        result.UpdatedInput = empty.RootElement.Clone();
                    }
                }
            }
            else
            {
                result.Behavior = "deny";
                result.Message = outcome.Message ?? "Garrison denied this tool call.";
            }
            return result;
        }

        private async Task<object> ListApprovalsAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            await Require(ctx, tenantId, ResourceTypeEnum.Approval, OperationTypeEnum.Read, null, token).ConfigureAwait(false);
            ApprovalFilter filter = new ApprovalFilter();
            filter.TenantId = tenantId;
            string? status = args?.GetString("status");
            if (!String.IsNullOrEmpty(status))
            {
                if (!Enum.TryParse<ApprovalStatusEnum>(status, true, out ApprovalStatusEnum parsed)) throw ToolError("ValidationFailed", "status must be Pending, Approved, Denied, Expired, or Cancelled.");
                filter.Status = parsed;
            }
            filter.RunId = args?.GetString("runId");
            string? agentRef = args?.GetString("agent");
            if (!String.IsNullOrEmpty(agentRef)) filter.AgentId = (await _Invoker.ResolveAgentAsync(tenantId, agentRef, token).ConfigureAwait(false)).Id;
            filter.MaxResults = (int)Math.Clamp(args?.GetInt64("maxResults") ?? 25, 1, 100);
            return await _Context.Database.Approvals.EnumerateAsync(filter, token).ConfigureAwait(false);
        }

        private async Task<Approval> RequireApprovalAsync(RequestContext ctx, string tenantId, RpcParameters? args, OperationTypeEnum operation, CancellationToken token)
        {
            string? approvalId = args?.GetString("approvalId");
            if (String.IsNullOrEmpty(approvalId)) throw ToolError("ValidationFailed", "approvalId is required.");
            await Require(ctx, tenantId, ResourceTypeEnum.Approval, operation, approvalId, token).ConfigureAwait(false);
            return await _Context.Database.Approvals.ReadAsync(tenantId, approvalId, token).ConfigureAwait(false) ?? throw ToolError("NotFound", "Approval " + approvalId + " not found.");
        }

        private async Task<object> DecideApprovalAsync(RequestContext ctx, string tenantId, RpcParameters? args, CancellationToken token)
        {
            Approval approval = await RequireApprovalAsync(ctx, tenantId, args, OperationTypeEnum.Update, token).ConfigureAwait(false);
            ApprovalService approvals = _Context.TryGet<ApprovalService>() ?? throw ToolError("Unavailable", "Approvals are not available on this server.");
            ApprovalDecideRequest request = new ApprovalDecideRequest();
            string? decision = args?.GetString("decision");
            if (String.IsNullOrEmpty(decision) || !Enum.TryParse<ApprovalDecisionEnum>(decision, true, out ApprovalDecisionEnum parsed)) throw ToolError("ValidationFailed", "decision must be Allow or Deny.");
            request.Decision = parsed;
            request.Reason = args?.GetString("reason");
            request.Remember = args?.GetBoolean("remember") ?? false;
            request.RulePattern = args?.GetString("rulePattern");
            if (approval.Kind == ApprovalKindEnum.DraftApply) return await _Context.Get<StudioService>().DecideAsync(ctx, approval, parsed == ApprovalDecisionEnum.Allow, request.Reason, token).ConfigureAwait(false);
            if (request.Remember) await Require(ctx, tenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Update, approval.DeploymentId, token).ConfigureAwait(false);
            return await approvals.DecideAsync(ctx, approval, request, token).ConfigureAwait(false);
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
                // AA-024: the runs of hidden eval cases hold the case, so they are never shown to run tokens.
                if (await HiddenRuns().HiddenAsync(ctx, run, token).ConfigureAwait(false)) throw ToolError("NotFound", "Run " + runId + " not found.");
            }
            await Require(ctx, tenantId, ResourceTypeEnum.Run, operation, run.Id, token).ConfigureAwait(false);
            return run;
        }

        private HiddenEvalRunPolicy HiddenRuns()
        {
            return _Context.TryGet<HiddenEvalRunPolicy>() ?? new HiddenEvalRunPolicy(_Context.Database);
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
            summary.ConversationId = run.ConversationId;
            summary.FanOutGroupId = run.FanOutGroupId;
            summary.ConversationTurn = String.IsNullOrEmpty(run.ConversationId) ? null : run.ConversationTurn;
            summary.BlockedReason = run.BlockedReason?.ToString();
            summary.AwaitingApproval = run.AwaitingApproval;
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
            summary.TraceId = run.TraceId;
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
