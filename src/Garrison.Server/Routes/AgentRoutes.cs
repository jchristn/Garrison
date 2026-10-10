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
        private readonly AgentCardService _Cards;
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
            _Cards = cards ?? throw new ArgumentNullException(nameof(cards));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Registrar.</param>
        public void Register(RouteRegistrar routes)
        {
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Agent, OperationTypeEnum.Read, ListAsync, "List agents", "Agents", null, typeof(EnumerationResult<Agent>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Agent, OperationTypeEnum.Create, CreateAsync, "Create an agent", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.POST, _Base + "/register", ResourceTypeEnum.Agent, OperationTypeEnum.Create, RegisterAsync, "Self-register an agent (idempotent by name)", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Read, ReadAsync, "Read an agent", "Agents", null, typeof(Agent));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Update, UpdateAsync, "Update an agent", "Agents", typeof(Agent), typeof(Agent));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Agent, OperationTypeEnum.Delete, DeleteAsync, "Delete an agent and its deployments", "Agents", null, typeof(DeleteResponse));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/card", ResourceTypeEnum.Agent, OperationTypeEnum.Read, CardAsync, "Read the agent's A2A agent card", "Agents", null, typeof(AgentCard));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Agents.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Agent agent = RouteHelpers.RequiredBody<Agent>(http);
            agent.Id = String.Empty;
            agent.TenantId = tenantId;
            agent.IsProtected = false;
            ConfigurationValidator.Agent(agent);
            Agent? existing = await _Server.Database.Agents.ReadByNameAsync(tenantId, agent.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(existing, existing?.Id, null, agent.Name);
            Agent created = await _Server.Database.Agents.CreateAsync(agent, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Agent", created.Id, "Created agent " + created.Name + ".").ConfigureAwait(false);
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
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Agent existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Agent " + existing.Name);
            Agent agent = RouteHelpers.RequiredBody<Agent>(http);
            agent.Id = existing.Id;
            agent.TenantId = tenantId;
            agent.CreatedUtc = existing.CreatedUtc;
            agent.LastRegisteredUtc = existing.LastRegisteredUtc;
            ConfigurationValidator.Agent(agent);
            Agent? named = await _Server.Database.Agents.ReadByNameAsync(tenantId, agent.Name, http.Token).ConfigureAwait(false);
            ConfigurationSupport.EnsureNameAvailable(named, named?.Id, existing.Id, agent.Name);
            Agent updated = await _Server.Database.Agents.UpdateAsync(agent, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Agent", updated.Id, "Updated agent " + updated.Name + ".").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Agent existing = await LoadAsync(http).ConfigureAwait(false);
            ConfigurationSupport.EnsureEditable(existing.TenantId, false, existing.IsProtected, tenantId, "Agent " + existing.Name);
            DeleteResponse response = new DeleteResponse();
            List<Deployment> deployments = await _Server.Database.Deployments.ListByAgentAsync(tenantId, existing.Id, http.Token).ConfigureAwait(false);
            foreach (Deployment deployment in deployments)
            {
                if (await _Server.Database.Deployments.DeleteAsync(deployment.Id, http.Token).ConfigureAwait(false)) response.Cascaded++;
            }
            response.Deleted = await _Server.Database.Agents.DeleteAsync(existing.Id, http.Token).ConfigureAwait(false);
            await ConfigurationSupport.AuditAsync(_Server, http, AuditEventTypeEnum.ConfigurationChanged, "Agent", existing.Id, "Deleted agent " + existing.Name + " and " + response.Cascaded + " deployment(s).").ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, response).ConfigureAwait(false);
        }

        private async Task CardAsync(HttpContextBase http)
        {
            Agent agent = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Cards.BuildCardAsync(RouteHelpers.Tenant(http), agent, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<Agent> LoadAsync(HttpContextBase http)
        {
            Agent? agent = await _Server.Database.Agents.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id")!, http.Token).ConfigureAwait(false);
            return agent ?? throw new NotFoundException("Agent not found.");
        }

        #endregion
    }
}
