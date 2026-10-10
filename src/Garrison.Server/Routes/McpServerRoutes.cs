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
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.McpServer, OperationTypeEnum.Delete, DeleteAsync, "Delete an MCP server", "MCP Servers", null, typeof(DeleteResponse));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/test", ResourceTypeEnum.McpServer, OperationTypeEnum.Update, TestAsync, "Connect to an HTTP MCP server and list its tools", "MCP Servers", null, typeof(McpServerTestResponse));
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
            DeleteResponse response = new DeleteResponse();
            response.Deleted = await _Server.Database.McpServers.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "McpServer", existing.Id, "Deleted MCP server " + existing.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
        }

        private async Task TestAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            McpServer server = await LoadAsync(http).ConfigureAwait(false);
            McpServerTestResponse response = new McpServerTestResponse();
            if (server.Transport != McpTransportEnum.Http)
            {
                response.Error = "Stdio MCP servers can only be tested from a worker node (planned for Phase 12).";
                await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
                return;
            }

            Stopwatch watch = Stopwatch.StartNew();
            try
            {
                TemplateContext context = await SecretsByNameAsync(tenantId, http.Token).ConfigureAwait(false);
                using (CancellationTokenSource timeout = CancellationTokenSource.CreateLinkedTokenSource(http.Token))
                {
                    timeout.CancelAfter(_TestTimeoutMs);
                    using (McpHttpClient client = new McpHttpClient())
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
                if (!response.Success) response.Error = "Required tools are missing: " + String.Join(", ", response.MissingRequiredTools) + ".";
            }
            catch (Exception e) when (e is not OperationCanceledException || !http.Token.IsCancellationRequested)
            {
                response.Success = false;
                response.Error = e is OperationCanceledException ? "Timed out after " + _TestTimeoutMs + " ms." : e.Message;
            }
            response.DurationMs = watch.ElapsedMilliseconds;
            await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
        }

        private async Task<TemplateContext> SecretsByNameAsync(string tenantId, CancellationToken token)
        {
            TemplateContext context = new TemplateContext();
            Dictionary<string, object?> secrets = TemplateContext.NewMap();
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            EnumerationResult<Secret> page = await _Server.Database.Secrets.EnumerateAsync(tenantId, query, token).ConfigureAwait(false);
            foreach (Secret secret in page.Objects)
            {
                if (String.IsNullOrEmpty(secret.ValueEncrypted)) continue;
                try
                {
                    secrets[secret.Name] = _Server.Cipher.Decrypt(secret.ValueEncrypted, secret.Id);
                }
                catch (System.Security.Cryptography.CryptographicException)
                {
                }
            }
            context.Set("secret", secrets);
            return context;
        }

        private async Task<McpServer> LoadAsync(HttpContextBase http)
        {
            McpServer? server = await _Server.Database.McpServers.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return server ?? throw new NotFoundException("MCP server not found.");
        }

        #endregion
    }
}
