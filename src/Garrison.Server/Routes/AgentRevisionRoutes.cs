namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;
    using WatsonWebserver.Core.OpenApi;

    /// <summary>
    /// Agent revision routes (AD1.5): list, read, create or replace the draft, publish, discard, and diff. The agent in
    /// the path may be given by identifier or name.
    /// </summary>
    public class AgentRevisionRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/agents/{id}/revisions";
        private static readonly string _Tag = "Agent revisions";

        private readonly ServerContext _Server;
        private readonly AgentRevisionService _Revisions;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="revisions">Revision service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AgentRevisionRoutes(ServerContext server, AgentRevisionService revisions)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Revisions = revisions ?? throw new ArgumentNullException(nameof(revisions));
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.AgentRevision, OperationTypeEnum.Read, ListAsync, "List an agent's revisions, newest first", _Tag, null, typeof(EnumerationResult<AgentRevision>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.AgentRevision, OperationTypeEnum.Create, SaveDraftAsync, "Create the agent's draft revision, or replace the content of its open draft", _Tag, typeof(AgentRevision), typeof(AgentRevision));
            routes.Scoped(HttpMethod.GET, _Base + "/diff", ResourceTypeEnum.AgentRevision, OperationTypeEnum.Read, DiffAsync, "Field-level diff between two revisions (query from and to: identifiers or numbers)", _Tag, null, typeof(AgentRevisionDiff),
                "id", new List<OpenApiParameterMetadata> { OpenApiParameterMetadata.Query("from", "Older revision identifier or number. Default: the published revision before to.", false, OpenApiSchemaMetadata.String()), OpenApiParameterMetadata.Query("to", "Newer revision identifier or number. Default: the open draft, else the latest published revision.", false, OpenApiSchemaMetadata.String()) });
            routes.Scoped(HttpMethod.GET, _Base + "/{revId}", ResourceTypeEnum.AgentRevision, OperationTypeEnum.Read, ReadAsync, "Read a revision by identifier or number", _Tag, null, typeof(AgentRevision));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{revId}", ResourceTypeEnum.AgentRevision, OperationTypeEnum.Delete, DiscardAsync, "Discard the agent's open draft revision", _Tag);
            routes.Scoped(HttpMethod.POST, _Base + "/{revId}/publish", ResourceTypeEnum.AgentRevision, OperationTypeEnum.Execute, PublishAsync, "Publish a draft revision", _Tag, typeof(RevisionPublishRequest), typeof(AgentRevision));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (agent == null) return;
            await RouteHelpers.JsonAsync(http, 200, await _Revisions.EnumerateAsync(RouteHelpers.Tenant(http), agent, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task SaveDraftAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Create).ConfigureAwait(false);
            if (agent == null) return;
            AgentRevision draft = await _Revisions.SaveDraftAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), agent, RouteHelpers.RequiredBody<AgentRevision>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, draft).ConfigureAwait(false);
        }

        private async Task DiffAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (agent == null) return;
            AgentRevisionDiff diff = await _Revisions.DiffAsync(RouteHelpers.Tenant(http), agent, RouteHelpers.Query(http, "from"), RouteHelpers.Query(http, "to"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, diff).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (agent == null) return;
            AgentRevision revision = await _Revisions.ReadAsync(RouteHelpers.Tenant(http), agent, RouteHelpers.Param(http, "revId") ?? String.Empty, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, revision).ConfigureAwait(false);
        }

        private async Task DiscardAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (agent == null) return;
            await _Revisions.DiscardAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), agent, RouteHelpers.Param(http, "revId") ?? String.Empty, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task PublishAsync(HttpContextBase http)
        {
            Agent? agent = await LoadAgentAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (agent == null) return;
            RevisionPublishRequest? request = RouteHelpers.Body<RevisionPublishRequest>(http);
            AgentRevision published = await _Revisions.PublishAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), agent, RouteHelpers.Param(http, "revId") ?? String.Empty, request?.ChangeNote, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, published).ConfigureAwait(false);
        }

        private async Task<Agent?> LoadAgentAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            Agent? agent = await _Server.Database.Agents.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (agent == null && !String.IsNullOrEmpty(idOrName)) agent = await _Server.Database.Agents.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (agent == null) throw new NotFoundException("Agent " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (agent.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.AgentRevision, operation, agent.Id).ConfigureAwait(false)) return null;
            return agent;
        }

        #endregion
    }
}
