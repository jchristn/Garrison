namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;
    using Garrison.Core.Templates;
    using McpServer = Garrison.Core.Models.McpServer;
    using McpHttpClient = Voltaic.Mcp.McpHttpClient;
    using WatsonWebserver.Core;

    /// <summary>
    /// MCP server routes, including a connection test that lists tools.
    /// </summary>
    public class McpServerRoutes
    {
        #region Public-Members

        /// <summary>
        /// Connection test timeout in milliseconds. Minimum 1000, maximum 120000, default 15000.
        /// </summary>
        public int TestTimeoutMs
        {
            get
            {
                return _TestTimeoutMs;
            }
            set
            {
                _TestTimeoutMs = Math.Clamp(value, 1000, 120000);
            }
        }

        #endregion

        #region Private-Members

        private readonly ServerContext _Server;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/mcp-servers";
        private int _TestTimeoutMs = 15000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when server is null.</exception>
        public McpServerRoutes(ServerContext server)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.McpServer, OperationTypeEnum.Read, ListAsync, "List MCP servers", "MCP Servers", null, typeof(EnumerationResult<McpServer>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.McpServer, OperationTypeEnum.Create, CreateAsync, "Register an MCP server", "MCP Servers", typeof(McpServer), typeof(McpServer));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.McpServer, OperationTypeEnum.Read, ReadAsync, "Read an MCP server", "MCP Servers", null, typeof(McpServer));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.McpServer, OperationTypeEnum.Update, UpdateAsync, "Update an MCP server", "MCP Servers", typeof(McpServer), typeof(McpServer));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.McpServer, OperationTypeEnum.Delete, DeleteAsync, "Delete an MCP server", "MCP Servers");
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/test", ResourceTypeEnum.McpServer, OperationTypeEnum.Update, TestAsync, "List tools through HTTP or a selected worker stdio diagnostic", "MCP Servers", null, typeof(McpServerTestResponse));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.McpServers.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            McpServer server = RouteHelpers.RequiredBody<McpServer>(http);
            server.Id = String.Empty;
            server.TenantId = tenantId;
            server.IsProtected = false;
            ConfigurationValidator.McpServer(server);
            McpServer? existing = await _Server.Database.McpServers.ReadByNameAsync(tenantId, server.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, server.Name);
            McpServer created = await _Server.Database.McpServers.CreateAsync(server, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "McpServer", created.Id, "Created MCP server " + created.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            McpServer existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "MCP server " + existing.Name);
            McpServer server = RouteHelpers.RequiredBody<McpServer>(http);
            server.Id = existing.Id;
            server.TenantId = tenantId;
            server.CreatedUtc = existing.CreatedUtc;
            ConfigurationValidator.McpServer(server);
            await _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId).RequireForMcpServerAsync(tenantId, server, http.Token).ConfigureAwait(false);
            McpServer? named = await _Server.Database.McpServers.ReadByNameAsync(tenantId, server.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, server.Name);
            McpServer updated = await _Server.Database.McpServers.UpdateAsync(server, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "McpServer", updated.Id, "Updated MCP server " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            McpServer existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "MCP server " + existing.Name);
            await ConfigurationSupport.EnsureUnreferencedAsync(_Server, tenantId, d => d.ResourceBindings.Any(b => b.Kind == ResourceBindingKindEnum.McpServer && b.ResourceId == existing.Id), "MCP server " + existing.Name, http.Token).ConfigureAwait(false);
            await _Server.Database.McpServers.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "McpServer", existing.Id, "Deleted MCP server " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task TestAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            McpServer server = await LoadAsync(http).ConfigureAwait(false);
            Garrison.Server.Services.WorkerMcpTestService tests = _Server.Get<Garrison.Server.Services.WorkerMcpTestService>();
            // A test renders the secrets its templates name and sends them to the configured destination, so it needs the
            // permission to use each of them (SR-10). Only the referenced secrets are decrypted.
            List<Secret> referenced = await tests.ReferencedSecretsAsync(tenantId, server, http.Token).ConfigureAwait(false);
            await _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId).RequireAsync(tenantId, referenced.Select(s => (string?)s.Id), "headers", "The test of MCP server " + server.Name, http.Token).ConfigureAwait(false);
            McpServerTestResponse response = new McpServerTestResponse();
            if (server.Transport != McpTransportEnum.Http)
            {
                response = await tests.TestAsync(server, RouteHelpers.Query(http, "nodeId"), _TestTimeoutMs, http.Token).ConfigureAwait(false);
                await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
                return;
            }

            Stopwatch watch = Stopwatch.StartNew();
            long outboundStart = Stopwatch.GetTimestamp();
            Activity? outbound = GarrisonTracing.StartOutbound("mcp_server", "test");
            outbound?.SetTag("garrison.mcp_server", server.Name);
            string outcome = "error";
            Exception? failure = null;
            try
            {
                if (!Uri.TryCreate((server.Url ?? String.Empty).TrimEnd('/'), UriKind.Absolute, out Uri? target)) throw new InvalidOperationException("The MCP server URL is not an absolute URL.");
                string? blocked = await OutboundAddressPolicy.BlockedReasonAsync(target, http.Token).ConfigureAwait(false);
                if (blocked != null)
                {
                    response.Error = blocked;
                    outcome = "error";
                    GarrisonTracing.EndOutbound(outbound, "mcp_server", "test", outboundStart, outcome, null);
                    response.DurationMs = watch.ElapsedMilliseconds;
                    await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
                    return;
                }
                TemplateContext context = tests.SecretContext(referenced);
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(http.Token))
                {
                    timeout.CancelAfter(_TestTimeoutMs);
                    // A tenant chooses this URL: connect only to addresses the outbound policy allows, never follow redirects (SR-07).
                    using (McpHttpClient client = new McpHttpClient(OutboundAddressPolicy.CreateHandler(), true))
                    {
                        foreach (McpServerHeader header in server.Headers)
                        {
                            TemplateRenderOptions options = new TemplateRenderOptions();
                            options.AllowSecrets = true;
                            client.SetRequestHeader(header.Name, TemplateRenderer.Render(header.ValueTemplate, context, options));
                        }
                        bool connected = await client.ConnectStreamableAsync((server.Url ?? String.Empty).TrimEnd('/'), String.IsNullOrWhiteSpace(server.Path) ? "/mcp" : server.Path!, timeout.Token).ConfigureAwait(false);
                        if (!connected) throw new InvalidOperationException("The server did not complete the MCP handshake.");
                        JsonElement tools = await client.CallAsync<JsonElement>("tools/list", new { }, _TestTimeoutMs, timeout.Token).ConfigureAwait(false);
                        if (tools.ValueKind == JsonValueKind.Object && tools.TryGetProperty("tools", out JsonElement list) && list.ValueKind == JsonValueKind.Array)
                        {
                            foreach (JsonElement tool in list.EnumerateArray())
                            {
                                if (tool.TryGetProperty("name", out JsonElement name)) response.Tools.Add(name.GetString() ?? String.Empty);
                            }
                        }
                    }
                }
                response.MissingRequiredTools = server.RequiredTools.Where(t => !response.Tools.Contains(t, StringComparer.Ordinal)).ToList();
                response.Success = response.MissingRequiredTools.Count == 0;
                outcome = response.Success ? "ok" : "missing_tools";
                if (!response.Success) response.Error = "Required tools are missing: " + String.Join(", ", response.MissingRequiredTools) + ".";
            }
            catch (Exception e) when (e is not OperationCanceledException || !http.Token.IsCancellationRequested)
            {
                response.Success = false;
                response.Error = e is OperationCanceledException ? "Timed out after " + _TestTimeoutMs + " ms." : TestFailure(e);
                _Server.Logging.Debug("[McpServerRoutes] test of MCP server " + server.Id + " failed: " + e.Message);
                outcome = e is OperationCanceledException ? "timeout" : "error";
                failure = e;
            }
            GarrisonTracing.EndOutbound(outbound, "mcp_server", "test", outboundStart, outcome, failure);
            response.DurationMs = watch.ElapsedMilliseconds;
            await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
        }

        private static string TestFailure(Exception e)
        {
            // The caller chooses the URL, so the raw exception text (which can echo internal host names, response bodies,
            // and socket details) is not returned; only the class of failure is (SR-26). The detail goes to the debug log.
            if (e is System.Net.Http.HttpRequestException request)
            {
                if (request.StatusCode.HasValue) return "The MCP server answered HTTP " + (int)request.StatusCode.Value + ".";
                return "The MCP server could not be reached (" + request.HttpRequestError + ").";
            }
            if (e is InvalidOperationException && e.Source == typeof(McpServerRoutes).Assembly.GetName().Name) return e.Message;
            return "The MCP test failed (" + e.GetType().Name + ").";
        }

        private async Task<McpServer> LoadAsync(HttpContextBase http)
        {
            McpServer? server = await _Server.Database.McpServers.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return server ?? throw new NotFoundException("MCP server not found.");
        }

        #endregion
    }
}
