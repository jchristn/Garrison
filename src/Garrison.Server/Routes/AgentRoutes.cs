namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using Voltaic.A2A;
    using WatsonWebserver.Core;

    /// <summary>
    /// Agent routes, including the A2A card and idempotent self-registration.
    /// </summary>
    public class AgentRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly TenantConfigurationService _Mutations;
        private readonly AgentCardService _Cards;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/agents";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="cards">Agent card service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AgentRoutes(ServerContext server, AgentCardService cards)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Mutations = new TenantConfigurationService(_Server);
            _Cards = cards ?? throw new ArgumentNullException(nameof(cards));
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
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Agent, OperationTypeEnum.Read, ListAsync, "List agents", "Agents", null, typeof(EnumerationResult<Agent>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Agent, OperationTypeEnum.Create, CreateAsync, "Create an agent", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.POST, _Base + "/register", ResourceTypeEnum.Agent, OperationTypeEnum.Create, RegisterAsync, "Self-register an agent (idempotent by name)", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Read, ReadAsync, "Read an agent by identifier or name", "Agents", null, typeof(Agent));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Update, UpdateAsync, "Update an agent by identifier or name", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Delete, DeleteAsync, "Delete an agent (by identifier or name) and its deployments", "Agents");
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/card", ResourceTypeEnum.Agent, OperationTypeEnum.Read, CardAsync, "Read the agent's A2A agent card (by identifier or name)", "Agents", null, typeof(AgentCard));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Agents.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            Agent created = await _Mutations.CreateAgentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<Agent>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task RegisterAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Agent incoming = RouteHelpers.RequiredBody<Agent>(http);
            incoming.TenantId = tenantId;
            ConfigurationValidator.Agent(incoming);
            Agent? existing = await _Server.Database.Agents.ReadByNameAsync(tenantId, incoming.Name, http.Token).ConfigureAwait(false);
            incoming.LastRegisteredUtc = DateTime.UtcNow;
            Agent saved;
            if (existing == null)
            {
                incoming.Id = String.Empty;
                incoming.IsProtected = false;
                saved = await _Server.Database.Agents.CreateAsync(incoming, http.Token).ConfigureAwait(false);
                await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Agent", saved.Id, "Agent " + saved.Name + " registered.").ConfigureAwait(false);
                await RouteHelpers.JsonAsync(http, 201, saved).ConfigureAwait(false);
                return;
            }
            if (existing.IsProtected) throw new ConflictException("Protected", "Agent " + existing.Name + " is protected.");
            incoming.Id = existing.Id;
            incoming.CreatedUtc = existing.CreatedUtc;
            saved = await _Server.Database.Agents.UpdateAsync(incoming, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Agent", saved.Id, "Agent " + saved.Name + " re-registered.").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, saved).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (agent == null) return;
            await RouteHelpers.JsonAsync(http, 200, agent).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Agent? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            Agent updated = await _Mutations.UpdateAgentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<Agent>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Agent? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            await _Mutations.DeleteAgentAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task CardAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (agent == null) return;
            string baseUrl = ExternalUrls.RestBaseUrl(_Server, http);
            await RouteHelpers.JsonAsync(http, 200, await _Cards.BuildCardAsync(RouteHelpers.Tenant(http), agent, baseUrl, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<Agent?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (agent == null && !String.IsNullOrEmpty(idOrName)) agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (agent == null) throw new NotFoundException("Agent " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (agent.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Agent, operation, agent.Id).ConfigureAwait(false)) return null;
            return agent;
        }

        #endregion
    }
}
