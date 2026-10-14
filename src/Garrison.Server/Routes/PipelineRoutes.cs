namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Pipeline definition routes (P12.9) under /v1.0/api/tenants/{tenantId}/pipelines: CRUD through the shared tenant
    /// configuration service, start (Pipeline Execute plus Agent Execute on every stage agent), and prompt preview.
    /// </summary>
    public class PipelineRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly TenantConfigurationService _Mutations;
        private readonly PipelineService _Pipelines;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/pipelines";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="pipelines">Pipeline service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public PipelineRoutes(ServerContext server, PipelineService pipelines)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Pipelines = pipelines ?? throw new ArgumentNullException(nameof(pipelines));
            _Mutations = new TenantConfigurationService(_Server);
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
            const string tag = "Pipelines";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Pipeline, OperationTypeEnum.Read, ListAsync, "List pipelines", tag, null, typeof(EnumerationResult<Pipeline>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Pipeline, OperationTypeEnum.Create, CreateAsync, "Create a pipeline (ordered agent stages with optional review gates)", tag, typeof(Pipeline), typeof(Pipeline));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Pipeline, OperationTypeEnum.Read, ReadAsync, "Read a pipeline by identifier or name", tag, null, typeof(Pipeline));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Pipeline, OperationTypeEnum.Update, UpdateAsync, "Update a pipeline by identifier or name (increments its version; started pipeline runs keep their snapshot)", tag, typeof(Pipeline), typeof(Pipeline));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Pipeline, OperationTypeEnum.Delete, DeleteAsync, "Delete a pipeline by identifier or name (409 PipelineInUse while pipeline runs are active)", tag);
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/start", ResourceTypeEnum.Pipeline, OperationTypeEnum.Execute, StartAsync, "Start a pipeline (Idempotency-Key header supported; needs Agent Execute on every stage agent)", tag, typeof(PipelineStartRequest), typeof(PipelineRun));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/preview", ResourceTypeEnum.Pipeline, OperationTypeEnum.Read, PreviewAsync, "Render every stage prompt from sample input and sample stage outputs", tag, typeof(PipelinePreviewRequest), typeof(PipelinePreviewResponse));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<Pipeline> page = await _Server.Database.Pipelines.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            Pipeline created = await _Mutations.CreatePipelineAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<Pipeline>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Pipeline? pipeline = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (pipeline == null) return;
            await RouteHelpers.JsonAsync(http, 200, pipeline).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Pipeline? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            Pipeline updated = await _Mutations.UpdatePipelineAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<Pipeline>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Pipeline? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            await _Mutations.DeletePipelineAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task StartAsync(HttpContextBase http)
        {
            Pipeline? pipeline = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (pipeline == null) return;
            string tenantId = RouteHelpers.Tenant(http);

            // Starting a pipeline runs every stage agent on the caller's behalf, so the caller needs Agent Execute on each.
            foreach (string agentId in pipeline.Stages.Select(s => s.AgentId).Distinct(StringComparer.Ordinal))
            {
                if (_Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId).ConfigureAwait(false)) return;
            }

            PipelineStartRequest request = RouteHelpers.Body<PipelineStartRequest>(http) ?? new PipelineStartRequest();
            request.Wait = RouteHelpers.QueryBool(http, "wait") ?? request.Wait;
            request.WaitSeconds = Math.Clamp(RouteHelpers.QueryInt(http, "waitSeconds") ?? request.WaitSeconds, 0, 600);
            string? key = http.Request.Headers[Constants.HeaderIdempotencyKey];
            PipelineRun run = await _Pipelines.StartAsync(RouteHelpers.Context(http), pipeline, request, key, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, run).ConfigureAwait(false);
        }

        private async Task PreviewAsync(HttpContextBase http)
        {
            Pipeline? pipeline = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (pipeline == null) return;
            PipelinePreviewRequest request = RouteHelpers.Body<PipelinePreviewRequest>(http) ?? new PipelinePreviewRequest();
            PipelinePreviewResponse preview = await _Pipelines.PreviewAsync(RouteHelpers.Tenant(http), pipeline, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, preview).ConfigureAwait(false);
        }

        private async Task<Pipeline?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            Pipeline? pipeline = String.IsNullOrEmpty(idOrName) ? null : await _Server.Database.Pipelines.ReadAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (pipeline == null && !String.IsNullOrEmpty(idOrName)) pipeline = await _Server.Database.Pipelines.ReadByNameAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (pipeline == null) throw new NotFoundException("Pipeline " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (pipeline.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Pipeline, operation, pipeline.Id).ConfigureAwait(false)) return null;
            return pipeline;
        }

        #endregion
    }
}
