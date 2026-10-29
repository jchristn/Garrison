namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Studio routes (AD7.2, AD7.3, AD7.5): drafts, their items, graph, diff, validation, and the request to apply; and the
    /// agent architects and architect prompts the drafts are designed with.
    /// Applying happens only when a person approves the resulting DraftApply approval through the approval routes.
    /// </summary>
    public class StudioRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/studio/drafts";
        private static readonly string _Tag = "Studio";
        private static readonly string _Architects = "/v1.0/api/tenants/{tenantId}/studio/architects";
        private static readonly string _ArchitectPrompts = "/v1.0/api/tenants/{tenantId}/studio/architect-prompts";
        private readonly ServerContext _Server;
        private readonly StudioService _Studio;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="studio">Studio service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public StudioRoutes(ServerContext server, StudioService studio)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Studio = studio ?? throw new ArgumentNullException(nameof(studio));
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, ListAsync, "List studio drafts, newest change first (mine=true for your own; status to filter)", _Tag, null, typeof(EnumerationResult<StudioDraft>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.StudioDraft, OperationTypeEnum.Create, CreateAsync, "Start a studio draft, empty or from an existing app with everything it references", _Tag, typeof(StudioDraftCreateRequest), typeof(StudioDraft));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, ReadAsync, "Read a studio draft with its items and layout", _Tag, null, typeof(StudioDraft));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Delete, DeleteAsync, "Discard a studio draft (a pending apply approval is cancelled)", _Tag);
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}/items/{kind}/{name}", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Update, PutItemAsync, "Create or replace one draft item at the version you read", _Tag, typeof(StudioDraftItemRequest), typeof(StudioDraft));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}/items/{kind}/{name}", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Update, RemoveItemAsync, "Remove one draft item at the version you read (?version=)", _Tag, null, typeof(StudioDraft));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/diff", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, DiffAsync, "Compare a draft with live configuration, per document", _Tag, null, typeof(StudioDraftDiff));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/validate", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, DiffAsync, "Validate a draft by manifest dry run", _Tag, null, typeof(StudioDraftDiff));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/request-apply", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Update, RequestApplyAsync, "Ask a person to approve applying the draft (creates a DraftApply approval)", _Tag, typeof(StudioDraftVersionRequest), typeof(Approval));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/graph", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Read, GraphAsync, "A draft's apps as a graph of agents, apps, and call edges", _Tag, null, typeof(StudioGraph));
            routes.Scoped(HttpMethod.GET, _Architects, ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ListArchitectsAsync, "List agent architects: tenant-wide deployments that may edit studio drafts, with their harness, model, and architect prompt (search, activeOnly, ordering, paginated)", _Tag, null, typeof(EnumerationResult<Architect>));
            routes.Scoped(HttpMethod.POST, _Architects, ResourceTypeEnum.Deployment, OperationTypeEnum.Create, CreateArchitectAsync, "Create an agent architect: a deployment of agent-architect with draft access, bound to the chosen architect prompt", _Tag, typeof(ArchitectRequest), typeof(Architect));
            routes.Scoped(HttpMethod.GET, _Architects + "/{deploymentId}", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ReadArchitectAsync, "Read an agent architect", _Tag, null, typeof(Architect), "deploymentId");
            routes.Scoped(HttpMethod.PUT, _Architects + "/{deploymentId}", ResourceTypeEnum.Deployment, OperationTypeEnum.Update, UpdateArchitectAsync, "Change an agent architect's name, description, harness profile, model, active flag, and prompt; other deployment settings are kept", _Tag, typeof(ArchitectRequest), typeof(Architect), "deploymentId");
            routes.Scoped(HttpMethod.DELETE, _Architects + "/{deploymentId}", ResourceTypeEnum.Deployment, OperationTypeEnum.Delete, DeleteArchitectAsync, "Delete an agent architect (its deployment); drafts are kept", _Tag, null, null, "deploymentId");
            routes.Scoped(HttpMethod.GET, _ArchitectPrompts, ResourceTypeEnum.PromptTemplate, OperationTypeEnum.Read, ArchitectPromptsAsync, "List architect prompts, paginated: built-ins first, then tenant clones of them, then other tenant System templates, with the architect deployments that bind each (search matches the name)", _Tag, null, typeof(EnumerationResult<ArchitectPromptEntry>));
            routes.Scoped(HttpMethod.GET, _Architects + "/{deploymentId}/prompt", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, ArchitectPromptAsync, "Read the prompt an architect deployment uses", _Tag, null, typeof(ArchitectPromptSelection), "deploymentId");
            routes.Scoped(HttpMethod.PUT, _Architects + "/{deploymentId}/prompt", ResourceTypeEnum.Deployment, OperationTypeEnum.Update, SetArchitectPromptAsync, "Choose the prompt an architect deployment uses; takes effect on its next turn", _Tag, typeof(ArchitectPromptRequest), typeof(ArchitectPromptSelection), "deploymentId");
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/playground/invoke", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Update, DraftPlaygroundAsync, "Run a draft's agent in the playground (its document becomes the agent's draft revision; nothing is published)", _Tag, typeof(PlaygroundInvokeRequest), typeof(Run));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/agents/{agentId}/playground/invoke", ResourceTypeEnum.Agent, OperationTypeEnum.Execute, AgentPlaygroundAsync, "Run an agent's draft revision in the playground on an ephemeral deployment in the draft environment", _Tag, typeof(PlaygroundInvokeRequest), typeof(Run), "agentId");
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/graph-operations", ResourceTypeEnum.StudioDraft, OperationTypeEnum.Update, GraphOperationAsync, "Apply one graph operation (add or remove a member, connect, disconnect, set the entry agent, move a node)", _Tag, typeof(StudioGraphOperationRequest), typeof(StudioGraph));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            string? owner = null;
            if (RouteHelpers.QueryBool(http, "mine") == true) StudioService.Owner(RouteHelpers.Context(http), out owner, out string? _);
            EnumerationResult<StudioDraft> page = await _Server.Database.StudioDrafts.EnumerateAsync(RouteHelpers.Tenant(http), owner, RouteHelpers.Enumeration(http), RouteHelpers.QueryEnum<StudioDraftStatusEnum>(http, "status"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            StudioDraftCreateRequest request = RouteHelpers.Body<StudioDraftCreateRequest>(http) ?? new StudioDraftCreateRequest();
            StudioDraft created = await _Studio.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Studio.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            await _Studio.DeleteAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task PutItemAsync(HttpContextBase http)
        {
            StudioDraftItemRequest request = RouteHelpers.RequiredBody<StudioDraftItemRequest>(http);
            StudioDraft draft = await _Studio.PutItemAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, RouteHelpers.Param(http, "kind") ?? String.Empty, RouteHelpers.Param(http, "name") ?? String.Empty, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, draft).ConfigureAwait(false);
        }

        private async Task RemoveItemAsync(HttpContextBase http)
        {
            int version = RouteHelpers.QueryInt(http, "version") ?? throw new ValidationException("version is required: the draft version you read.", new Dictionary<string, string> { { "version", "Required." } });
            StudioDraft draft = await _Studio.RemoveItemAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, RouteHelpers.Param(http, "kind") ?? String.Empty, RouteHelpers.Param(http, "name") ?? String.Empty, version, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, draft).ConfigureAwait(false);
        }

        private async Task DiffAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            StudioDraft draft = await _Studio.ReadAsync(tenantId, RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Studio.DiffAsync(RouteHelpers.Context(http), tenantId, draft, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task RequestApplyAsync(HttpContextBase http)
        {
            StudioDraftVersionRequest request = RouteHelpers.RequiredBody<StudioDraftVersionRequest>(http);
            Approval approval = await _Studio.RequestApplyAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, request.Version, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, approval).ConfigureAwait(false);
        }

        private async Task DraftPlaygroundAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            StudioDraft draft = await _Studio.ReadAsync(tenantId, RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false);
            PlaygroundInvokeRequest request = RouteHelpers.RequiredBody<PlaygroundInvokeRequest>(http);
            if (_Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.AgentRevision, OperationTypeEnum.Update, null).ConfigureAwait(false)) return;
            Run run = await _Server.Get<PlaygroundService>().InvokeDraftAsync(RouteHelpers.Context(http), tenantId, draft, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, run).ConfigureAwait(false);
        }

        private async Task AgentPlaygroundAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "agentId") ?? String.Empty;
            Agent agent = await _Server.Database.Agents.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false)
                ?? await _Server.Database.Agents.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Agent not found.");
            PlaygroundInvokeRequest request = RouteHelpers.RequiredBody<PlaygroundInvokeRequest>(http);
            Run run = await _Server.Get<PlaygroundService>().InvokeAsync(RouteHelpers.Context(http), tenantId, agent, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, run).ConfigureAwait(false);
        }

        private async Task ArchitectPromptsAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Get<ArchitectService>().EnumeratePromptsAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ListArchitectsAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Get<ArchitectService>().EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateArchitectAsync(HttpContextBase http)
        {
            ArchitectRequest request = RouteHelpers.RequiredBody<ArchitectRequest>(http);
            Architect created = await _Server.Get<ArchitectService>().CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadArchitectAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Get<ArchitectService>().ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "deploymentId") ?? String.Empty, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateArchitectAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ArchitectService architects = _Server.Get<ArchitectService>();
            Deployment existing = await architects.ResolveAsync(tenantId, RouteHelpers.Param(http, "deploymentId") ?? String.Empty, http.Token).ConfigureAwait(false);
            ArchitectRequest request = RouteHelpers.RequiredBody<ArchitectRequest>(http);
            await RouteHelpers.JsonAsync(http, 200, await architects.UpdateAsync(RouteHelpers.Context(http), tenantId, existing, request, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DeleteArchitectAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            ArchitectService architects = _Server.Get<ArchitectService>();
            Deployment existing = await architects.ResolveAsync(tenantId, RouteHelpers.Param(http, "deploymentId") ?? String.Empty, http.Token).ConfigureAwait(false);
            await architects.DeleteAsync(RouteHelpers.Context(http), tenantId, existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ArchitectPromptAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Deployment deployment = await DeploymentAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Get<ArchitectService>().GetPromptAsync(tenantId, deployment, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task SetArchitectPromptAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Deployment deployment = await DeploymentAsync(http).ConfigureAwait(false);
            ArchitectPromptRequest request = RouteHelpers.RequiredBody<ArchitectPromptRequest>(http);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Get<ArchitectService>().SetPromptAsync(RouteHelpers.Context(http), tenantId, deployment, request, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<Deployment> DeploymentAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "deploymentId") ?? String.Empty;
            return await _Server.Database.Deployments.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false)
                ?? await _Server.Database.Deployments.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Deployment not found.");
        }

        private async Task GraphAsync(HttpContextBase http)
        {
            StudioDraft draft = await _Studio.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, StudioService.Graph(draft)).ConfigureAwait(false);
        }

        private async Task GraphOperationAsync(HttpContextBase http)
        {
            StudioGraphOperationRequest request = RouteHelpers.RequiredBody<StudioGraphOperationRequest>(http);
            StudioGraph graph = await _Studio.ApplyGraphOperationAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id") ?? String.Empty, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, graph).ConfigureAwait(false);
        }

        #endregion
    }
}
