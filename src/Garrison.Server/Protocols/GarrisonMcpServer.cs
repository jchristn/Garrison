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
            List<ToolDefinition> tools = new List<ToolDefinition>();
            foreach (McpToolDefinition tool in McpToolCatalog.All())
            {
                if (tool.Name.StartsWith("garrison_memory_", StringComparison.Ordinal) && !_Context.Settings.AgentMemory.Enabled) continue;
                if (tool.UserOnly && !ManagementCaller(ctx)) continue;
                string description = await ToolDescriptionAsync(tenantId, tool, token).ConfigureAwait(false);
                tools.Add(Definition(tool.Name, description, administrator ? _AdministratorSchemas[tool.Name] : _PublicSchemas[tool.Name], tool.Annotations));
            }
            if (!String.IsNullOrEmpty(tenantId))
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
            Agent? caller = parent == null ? null : await _Context.Database.Agents.ReadAsync(tenantId, parent.AgentId, token).ConfigureAwait(false);
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
                    case "garrison_memory_read":
                    case "garrison_memory_write":
                    case "garrison_memory_delete":
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
                return McpToolCallResult.FromText(Serializer.SerializeReadable(result));
            }
            catch (McpToolException e)
            {
                GarrisonTracing.Fail(span, e);
                throw;
            }
            catch (Exception e) when (e is NotFoundException || e is ConflictException || e is ValidationException || e is ArgumentException)
            {
                GarrisonTracing.Fail(span, e);
                if (e is ValidationException validation) throw ToolError("ValidationFailed", validation.Describe());
                if (e is ConflictException conflict) throw ToolError(conflict.Code, e.Message);
                if (e is NotFoundException) throw ToolError("NotFound", e.Message);
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
            string? reference = args?.GetString("agent");
            Agent agent;
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                Run? run = await _Context.Database.Runs.ReadAsync(tenantId, ctx.RunId!, token).ConfigureAwait(false);
                if (run == null) throw ToolError("NotFound", "The active run was not found.");
                agent = await _Context.Database.Agents.ReadAsync(tenantId, run.AgentId, token).ConfigureAwait(false)
                    ?? throw ToolError("NotFound", "The run agent was not found.");
                if (reference != null && reference != agent.Id && reference != agent.Name) throw ToolError("Forbidden", "Run memory is scoped to its own agent.");
            }
            else
            {
                if (String.IsNullOrWhiteSpace(reference)) throw ToolError("BadRequest", "An agent is required for user memory calls.");
                agent = await _Invoker.ResolveAgentAsync(tenantId, reference, token).ConfigureAwait(false);
                await Require(ctx, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id, token).ConfigureAwait(false);
            }
            string? key = args?.GetString("key");
            if (String.IsNullOrWhiteSpace(key) || key.Length > 256) throw ToolError("BadRequest", "Memory key must contain 1 to 256 characters.");
            Garrison.Core.Memory.IAgentMemoryStore store = _Context.Get<Garrison.Core.Memory.IAgentMemoryStore>();
            return await ApplicationOperation.MeasureAsync("memory", tool.Substring("garrison_memory_".Length), async ct =>
            {
                Garrison.Core.Memory.AgentMemoryResult result = new Garrison.Core.Memory.AgentMemoryResult { Key = key };
                if (tool == "garrison_memory_read")
                {
                    result.Value = await store.ReadAsync(tenantId, agent.Id, key, ct).ConfigureAwait(false);
                    result.Found = result.Value != null;
                }
                else if (tool == "garrison_memory_write")
                {
                    string? value = args?.GetString("value");
                    if (value == null || Encoding.UTF8.GetByteCount(value) > _Context.Settings.AgentMemory.MaxValueBytes)
                        throw ToolError("BadRequest", "A memory value within the configured UTF-8 byte limit is required.");
                    await store.WriteAsync(tenantId, agent.Id, key, value, ct).ConfigureAwait(false);
                    result.Found = true;
                }
                else
                {
                    await store.DeleteAsync(tenantId, agent.Id, key, ct).ConfigureAwait(false);
                    result.Found = true;
                }
                if (tool != "garrison_memory_read")
                    await _Context.Audit.WriteAsync(ctx, AuditEventTypeEnum.ConfigurationChanged, "AgentMemory", agent.Id, tool, tenantId, ct).ConfigureAwait(false);
                return result;
            }, token).ConfigureAwait(false);
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
            list.TotalRecords = ctx.PrincipalType == PrincipalTypeEnum.Run ? list.Agents.Count : page.TotalRecords;
            return list;
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
            if (ctx.PrincipalType == PrincipalTypeEnum.Run && !String.IsNullOrEmpty(ctx.RunId)) filter.RootRunId = await RootOfAsync(tenantId, ctx.RunId, token).ConfigureAwait(false);
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, token).ConfigureAwait(false);
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
            summary.ConversationId = run.ConversationId;
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
