namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Mandate routes (AA1.10) under /v1.0/api/tenants/{tenantId}/mandates: CRUD, revisions and publishing, pause, resume,
    /// manual wake, and tick history, plus GET /mandate-ticks/{tickId}. {id} accepts an identifier or a name. Creating or
    /// updating a mandate also needs Execute on its agent, because the caller becomes the principal its ticks run as.
    /// </summary>
    public class MandateRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly MandateService _Mandates;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/mandates";
        private static readonly string _Ticks = "/v1.0/api/tenants/{tenantId}/mandate-ticks";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="mandates">Mandate service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public MandateRoutes(ServerContext server, MandateService mandates)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Mandates = mandates ?? throw new ArgumentNullException(nameof(mandates));
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
            const string tag = "Mandates";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Mandate, OperationTypeEnum.Read, ListAsync, "List mandates (query: status, agentId, deploymentId, search, maxResults, skip, ordering)", tag, null, typeof(EnumerationResult<Mandate>));
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Mandate, OperationTypeEnum.Create, CreateAsync, "Create a mandate (needs Agent Execute; the caller becomes its run-as principal). An inline currentRevision is published as revision 1 and the mandate becomes Active", tag, typeof(Mandate), typeof(Mandate));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Mandate, OperationTypeEnum.Read, ReadAsync, "Read a mandate with its current revision, by identifier or name", tag, null, typeof(Mandate));
            routes.Scoped(HttpMethod.PUT, _Base + "/{id}", ResourceTypeEnum.Mandate, OperationTypeEnum.Update, UpdateAsync, "Update a mandate's name, description, and deployment (the caller becomes its run-as principal; the agent cannot change)", tag, typeof(Mandate), typeof(Mandate));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.Mandate, OperationTypeEnum.Delete, DeleteAsync, "Delete a mandate with its revisions and tick history (409 MandateActive while a tick runs unless force=true, which cancels the tick's run)", tag);
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/revisions", ResourceTypeEnum.Mandate, OperationTypeEnum.Read, RevisionsAsync, "List a mandate's revisions, newest first", tag, null, typeof(EnumerationResult<MandateRevision>));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/revisions", ResourceTypeEnum.Mandate, OperationTypeEnum.Update, CreateRevisionAsync, "Draft a new revision of a mandate", tag, typeof(MandateRevision), typeof(MandateRevision));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/revisions/{revId}", ResourceTypeEnum.Mandate, OperationTypeEnum.Read, ReadRevisionAsync, "Read one revision of a mandate", tag, null, typeof(MandateRevision));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/revisions/{revId}/publish", ResourceTypeEnum.Mandate, OperationTypeEnum.Update, PublishAsync, "Publish a draft revision: it becomes current, backoff resets, a Draft mandate becomes Active, and an Active mandate wakes now", tag, null, typeof(Mandate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/pause", ResourceTypeEnum.Mandate, OperationTypeEnum.Execute, PauseAsync, "Pause a mandate: no further wakes until it is resumed", tag, null, typeof(Mandate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/resume", ResourceTypeEnum.Mandate, OperationTypeEnum.Execute, ResumeAsync, "Resume a paused mandate: it wakes now with its interval reset", tag, null, typeof(Mandate));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/wake", ResourceTypeEnum.Mandate, OperationTypeEnum.Execute, WakeAsync, "Wake an Active mandate now (after the running tick, if one is running)", tag, null, typeof(Mandate));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}/ticks", ResourceTypeEnum.Mandate, OperationTypeEnum.Read, TicksAsync, "List a mandate's ticks, newest first (query: outcome)", tag, null, typeof(EnumerationResult<MandateTick>));
            routes.ScopedByHandler(HttpMethod.GET, _Ticks + "/{tickId}", ResourceTypeEnum.Mandate, OperationTypeEnum.Read, ReadTickAsync, "Read one keeper tick (authorized as Read on its mandate)", tag, null, typeof(MandateTick));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            MandateStatusEnum? status = RouteHelpers.QueryEnum<MandateStatusEnum>(http, "status");
            string? agentId = RouteHelpers.Query(http, "agentId");
            string? deploymentId = RouteHelpers.Query(http, "deploymentId");
            EnumerationResult<Mandate> page = await _Server.Database.Mandates.EnumerateAsync(RouteHelpers.Tenant(http), status, agentId, deploymentId, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            Mandate? created = await _Mandates.CreateAsync(RouteHelpers.Context(http), tenantId, RouteHelpers.RequiredBody<Mandate>(http), AgentCheck(http, tenantId), http.Token).ConfigureAwait(false);
            if (created == null) return;
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (mandate == null) return;
            await RouteHelpers.JsonAsync(http, 200, mandate).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Mandate? existing = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (existing == null) return;
            Mandate? updated = await _Mandates.UpdateAsync(RouteHelpers.Context(http), existing, RouteHelpers.RequiredBody<Mandate>(http), AgentCheck(http, existing.TenantId), http.Token).ConfigureAwait(false);
            if (updated == null) return;
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Mandate? existing = await LoadAsync(http, OperationTypeEnum.Delete).ConfigureAwait(false);
            if (existing == null) return;
            bool force = RouteHelpers.QueryBool(http, "force") ?? false;
            await _Mandates.DeleteAsync(RouteHelpers.Context(http), existing, force, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task RevisionsAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (mandate == null) return;
            EnumerationResult<MandateRevision> page = await _Server.Database.MandateRevisions.EnumerateAsync(mandate.TenantId, mandate.Id, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateRevisionAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (mandate == null) return;
            MandateRevision created = await _Mandates.CreateRevisionAsync(RouteHelpers.Context(http), mandate, RouteHelpers.RequiredBody<MandateRevision>(http), MandateRevisionSourceEnum.Human, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadRevisionAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (mandate == null) return;
            MandateRevision revision = await RevisionAsync(http, mandate).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, revision).ConfigureAwait(false);
        }

        private async Task PublishAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Update).ConfigureAwait(false);
            if (mandate == null) return;
            MandateRevision revision = await RevisionAsync(http, mandate).ConfigureAwait(false);
            Mandate published = await _Mandates.PublishRevisionAsync(RouteHelpers.Context(http), mandate, revision, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, published).ConfigureAwait(false);
        }

        private async Task PauseAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (mandate == null) return;
            await RouteHelpers.JsonAsync(http, 200, await _Mandates.PauseAsync(RouteHelpers.Context(http), mandate, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ResumeAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (mandate == null) return;
            await RouteHelpers.JsonAsync(http, 200, await _Mandates.ResumeAsync(RouteHelpers.Context(http), mandate, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task WakeAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Execute).ConfigureAwait(false);
            if (mandate == null) return;
            await RouteHelpers.JsonAsync(http, 202, await _Mandates.WakeAsync(RouteHelpers.Context(http), mandate, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task TicksAsync(HttpContextBase http)
        {
            Mandate? mandate = await LoadAsync(http, OperationTypeEnum.Read).ConfigureAwait(false);
            if (mandate == null) return;
            TickOutcomeEnum? outcome = RouteHelpers.QueryEnum<TickOutcomeEnum>(http, "outcome");
            EnumerationResult<MandateTick> page = await _Server.Database.MandateTicks.EnumerateAsync(mandate.TenantId, mandate.Id, outcome, RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadTickAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string tickId = RouteHelpers.Param(http, "tickId") ?? String.Empty;
            MandateTick? tick = String.IsNullOrEmpty(tickId) ? null : await _Server.Database.MandateTicks.ReadAsync(tenantId, tickId, http.Token).ConfigureAwait(false);
            if (tick == null) throw new NotFoundException("Mandate tick " + tickId + " not found.");
            if (_Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Mandate, OperationTypeEnum.Read, tick.MandateId).ConfigureAwait(false)) return;
            await RouteHelpers.JsonAsync(http, 200, tick).ConfigureAwait(false);
        }

        private Func<string, Task<bool>> AgentCheck(HttpContextBase http, string tenantId)
        {
            return agentId => _Routes != null ? _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agentId) : Task.FromResult(true);
        }

        private async Task<Mandate?> LoadAsync(HttpContextBase http, OperationTypeEnum operation)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string idOrName = RouteHelpers.Param(http, "id") ?? String.Empty;
            Mandate? mandate = await _Mandates.FindAsync(tenantId, idOrName, http.Token).ConfigureAwait(false);
            if (mandate == null) throw new NotFoundException("Mandate " + idOrName + " not found.");

            // Resolved by name: the route was authorized against the name, so check resource-scoped grants against the ID.
            if (mandate.Id != idOrName && _Routes != null && !await _Routes.RequireAsync(http, tenantId, ResourceTypeEnum.Mandate, operation, mandate.Id).ConfigureAwait(false)) return null;
            return mandate;
        }

        private async Task<MandateRevision> RevisionAsync(HttpContextBase http, Mandate mandate)
        {
            string revId = RouteHelpers.Param(http, "revId") ?? String.Empty;
            MandateRevision? revision = String.IsNullOrEmpty(revId) ? null : await _Server.Database.MandateRevisions.ReadAsync(mandate.TenantId, revId, http.Token).ConfigureAwait(false);
            if (revision == null && Int32.TryParse(revId, out int number) && number > 0)
            {
                EnumerationResult<MandateRevision> page = await _Server.Database.MandateRevisions.EnumerateAsync(mandate.TenantId, mandate.Id, new EnumerationQuery { MaxResults = 1000 }, http.Token).ConfigureAwait(false);
                foreach (MandateRevision candidate in page.Objects)
                {
                    if (candidate.Number == number) revision = candidate;
                }
            }
            if (revision == null || revision.MandateId != mandate.Id) throw new NotFoundException("Revision " + revId + " of mandate " + mandate.Name + " not found.");
            return revision;
        }

        #endregion
    }
}
