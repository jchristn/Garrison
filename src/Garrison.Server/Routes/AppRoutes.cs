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
    /// Agentic app routes for operators (AD6.2): apps, their delegation plan, revisions, and app promotion. Apps in the
    /// path may be given by identifier or name.
    /// </summary>
    public class AppRoutes
    {
        #region Private-Members

        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/apps";
        private static readonly string _Tag = "Agentic apps";
        private readonly ServerContext _Server;
        private readonly AgenticAppService _Apps;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="apps">App service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public AppRoutes(ServerContext server, AgenticAppService apps)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Apps = apps ?? throw new ArgumentNullException(nameof(apps));
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
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, ListAsync, "List agentic apps", _Tag, null, typeof(EnumerationResult<AgenticApp>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Create, CreateAsync, "Create an agentic app", _Tag, typeof(AgenticApp), typeof(AgenticApp));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, ReadAsync, "Read an agentic app by identifier or name", _Tag, null, typeof(AgenticApp));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Update, UpdateAsync, "Replace an agentic app", _Tag, typeof(AgenticApp), typeof(AgenticApp));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Delete, DeleteAsync, "Delete an agentic app and its revisions", _Tag);
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/delegation", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, DelegationAsync, "Each member's delegation policy derived from the app graph, with drift against what is published", _Tag, null, typeof(AppDelegationPlan));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/delegation", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Update, ApplyDelegationAsync, "Write the graph's delegation policies into members' draft revisions (nothing is published)", _Tag, null, typeof(AppDelegationPlan));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/revisions", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, RevisionsAsync, "List an app's revisions, newest first", _Tag, null, typeof(List<AppRevision>));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/revisions", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Update, CreateRevisionAsync, "Take an app revision pinning every member's published revision", _Tag, typeof(AppRevisionRequest), typeof(AppRevision));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/revisions/{revId}", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, RevisionAsync, "Read an app revision by identifier or number", _Tag, null, typeof(AppRevision));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/revisions/{revId}/publish", ResourceTypeEnum.AgenticApp, OperationTypeEnum.Execute, PublishAsync, "Publish a draft app revision", _Tag, null, typeof(AppRevision));
            routes.ScopedByHandler(HttpMethod.POST, _Base + "/{id}/promote", ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, PromoteAsync, "Promote an app revision: every member's pin moves to the target environment together (Execute on Promotion for the target environment)", _Tag, typeof(AppPromotionRequest), typeof(PromotionRecord));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Apps.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            AgenticApp created = await _Apps.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), RouteHelpers.RequiredBody<AgenticApp>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await LoadAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            AgenticApp existing = await LoadAsync(http).ConfigureAwait(false);
            AgenticApp saved = await _Apps.UpdateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, RouteHelpers.RequiredBody<AgenticApp>(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, saved).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            AgenticApp existing = await LoadAsync(http).ConfigureAwait(false);
            await _Apps.DeleteAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task DelegationAsync(HttpContextBase http)
        {
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Apps.DelegationAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), app, false, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ApplyDelegationAsync(HttpContextBase http)
        {
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Apps.DelegationAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), app, true, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task RevisionsAsync(HttpContextBase http)
        {
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Server.Database.Apps.ListRevisionsAsync(RouteHelpers.Tenant(http), app.Id, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreateRevisionAsync(HttpContextBase http)
        {
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            AppRevisionRequest? request = RouteHelpers.Body<AppRevisionRequest>(http);
            AppRevision created = await _Apps.CreateRevisionAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), app, request?.ChangeNote, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task RevisionAsync(HttpContextBase http)
        {
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Apps.ResolveRevisionAsync(RouteHelpers.Tenant(http), app, RouteHelpers.Param(http, "revId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task PublishAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            AppRevision revision = await _Apps.ResolveRevisionAsync(tenantId, app, RouteHelpers.Param(http, "revId"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Apps.PublishRevisionAsync(RouteHelpers.Context(http), tenantId, app, revision, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task PromoteAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            if (_Routes == null) throw new InvalidOperationException("Routes are not registered.");
            if (!await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.AgenticApp, OperationTypeEnum.Read, null).ConfigureAwait(false)) return;
            AgenticApp app = await LoadAsync(http).ConfigureAwait(false);
            AppPromotionRequest request = RouteHelpers.RequiredBody<AppPromotionRequest>(http);
            AppRevision revision;
            if (String.IsNullOrWhiteSpace(request.AppRevision))
            {
                if (String.IsNullOrEmpty(app.LatestPublishedRevisionId)) throw new ConflictException("NoPublishedRevision", "App " + app.Name + " has no published revision to promote.");
                revision = await _Server.Database.Apps.ReadRevisionAsync(tenantId, app.LatestPublishedRevisionId, http.Token).ConfigureAwait(false) ?? throw new NotFoundException("The app's latest revision was not found.");
            }
            else
            {
                revision = await _Apps.ResolveRevisionAsync(tenantId, app, request.AppRevision, http.Token).ConfigureAwait(false);
            }
            PromotionRecord? record = await _Server.Get<PromotionService>().PromoteAppAsync(RouteHelpers.Context(http), tenantId, app, revision, request.SourceEnvironment, request.TargetEnvironment, request.AllowSkip, request.Note,
                target => _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Promotion, OperationTypeEnum.Execute, target), http.Token).ConfigureAwait(false);
            if (record == null) return;
            await RouteHelpers.JsonAsync(http, 201, record).ConfigureAwait(false);
        }

        private Task<AgenticApp> LoadAsync(HttpContextBase http)
        {
            return _Apps.ResolveAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "id"), http.Token);
        }

        #endregion
    }
}
