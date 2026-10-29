namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Capability catalog routes (AD4.7): list and read descriptors, manage manual ones, and refresh derived ones.
    /// </summary>
    public class CapabilityRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/capabilities";
        private static readonly string _Tag = "Capabilities";

        private readonly ServerContext _Server;
        private readonly CapabilityService _Capabilities;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="capabilities">Capability service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public CapabilityRoutes(ServerContext server, CapabilityService capabilities)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Capabilities = capabilities ?? throw new ArgumentNullException(nameof(capabilities));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Capability, OperationTypeEnum.Read, ListAsync, "List the capability catalog: agents, MCP tools, and harness built-ins", _Tag, null, typeof(EnumerationResult<CapabilityDescriptor>),
                "id", new List<OpenApiParameterMetadata>
                {
                    OpenApiParameterMetadata.Query("kind", "Only this kind: Agent, McpTool, or HarnessBuiltIn.", false, OpenApiSchemaMetadata.String()),
                    OpenApiParameterMetadata.Query("tag", "Only descriptors with this tag.", false, OpenApiSchemaMetadata.String()),
                    OpenApiParameterMetadata.Query("search", "Case-insensitive text to find in the name or summary.", false, OpenApiSchemaMetadata.String())
                });
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Capability, OperationTypeEnum.Create, CreateAsync, "Create a manual capability descriptor", _Tag, typeof(CapabilityDescriptor), typeof(CapabilityDescriptor));
            routes.Scoped(HttpMethod.POST, _Base + "/refresh", ResourceTypeEnum.Capability, OperationTypeEnum.Execute, RefreshAsync, "Refresh derived descriptors now: agents, harness built-ins, MCP server tools (stdio ones through a worker), and hints", _Tag, null, typeof(CapabilityRefreshResult),
                "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("mcpServerId", "Refresh only this MCP server's tools.", false, OpenApiSchemaMetadata.String()) });
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Capability, OperationTypeEnum.Read, ReadAsync, "Read a capability descriptor by identifier or name", _Tag, null, typeof(CapabilityDescriptor));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Capability, OperationTypeEnum.Update, UpdateAsync, "Replace a manual capability descriptor (409 CapabilityDerived for derived ones)", _Tag, typeof(CapabilityDescriptor), typeof(CapabilityDescriptor));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Capability, OperationTypeEnum.Delete, DeleteAsync, "Delete a manual capability descriptor (409 CapabilityDerived for derived ones)", _Tag);
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            CapabilityKindEnum? kind = RouteHelpers.QueryEnum<CapabilityKindEnum>(http, "kind");
            List<CapabilityDescriptor> list = await _Capabilities.ListAsync(RouteHelpers.Tenant(http), kind, RouteHelpers.Query(http, "tag"), RouteHelpers.Query(http, "search"), http.Token).ConfigureAwait(false);
            EnumerationResult<CapabilityDescriptor> result = new EnumerationResult<CapabilityDescriptor>();
            result.Objects = list;
            result.MaxResults = list.Count;
            result.TotalRecords = list.Count;
            result.RecordsRemaining = 0;
            result.EndOfResults = true;
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            CapabilityDescriptor descriptor = await _Capabilities.ResolveAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, descriptor).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            CapabilityDescriptor created = await _Capabilities.CreateManualAsync(RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<CapabilityDescriptor>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            CapabilityDescriptor saved = await _Capabilities.UpdateManualAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, RouteHelpers.RequiredBody<CapabilityDescriptor>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, saved).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            await _Capabilities.DeleteManualAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task RefreshAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            SecretUseChecker secrets = _Server.Authorization.SecretUse(RouteHelpers.Context(http), tenantId);
            CapabilityRefreshResult result = await _Capabilities.RefreshAsync(tenantId, (server, referenced, ct) => MayUseAsync(secrets, tenantId, server, referenced, ct), RouteHelpers.Query(http, "mcpServerId"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private static async Task<bool> MayUseAsync(SecretUseChecker secrets, string tenantId, McpServer server, List<Secret> referenced, CancellationToken token)
        {
            // Listing sends the secrets the server's templates name to the server, so the caller needs permission to use
            // each of them (SR-10), as for the connection test.
            try
            {
                await secrets.RequireAsync(tenantId, referenced.Select(s => (string?)s.Id), "headers", "The tool listing of MCP server " + server.Name, token).ConfigureAwait(false);
                return true;
            }
            catch (ValidationException)
            {
                return false;
            }
        }

        #endregion
    }
}
