namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Organization routes (AA7.11, plan section 7.4): organizations, units of the working tree, the chart, revisions,
    /// publish, rollback, spend, and the cascade cancel of a unit's subtree (AA11.4). Every route filters by the request's tenant; another tenant's organization answers
    /// 404. Run tokens never hold Organization permissions; runs read their organization through garrison_org_chart and
    /// garrison_org_whoami.
    /// </summary>
    public class OrganizationRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly OrganizationService _Organizations;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/organizations";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="organizations">Organization service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public OrganizationRoutes(ServerContext server, OrganizationService organizations)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Organizations = organizations ?? throw new ArgumentNullException(nameof(organizations));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register routes.
        /// </summary>
        /// <param name="routes">Route registrar.</param>
        /// <exception cref="ArgumentNullException">Thrown when routes is null.</exception>
        public void Register(RouteRegistrar routes)
        {
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Organizations";
            string one = _Base + "/{id}";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Organization, OperationTypeEnum.Read, ListAsync, "List organizations by name (query: search, maxResults, skip)", tag, null, typeof(EnumerationResult<Organization>), "id", null, new RouteScopeOptions().FilteredByOrganization());
            routes.Scoped(HttpMethod.POST, _Base, ResourceTypeEnum.Organization, OperationTypeEnum.Create, CreateAsync, "Create an organization (name, description, mission). It starts as Draft with no units", tag, typeof(Organization), typeof(Organization));
            routes.Scoped(HttpMethod.GET, one, ResourceTypeEnum.Organization, OperationTypeEnum.Read, ReadAsync, "Read an organization (identifier or name) with its working tree of units", tag, null, typeof(Organization));
            routes.Scoped(HttpMethod.PUT, one, ResourceTypeEnum.Organization, OperationTypeEnum.Update, UpdateAsync, "Update an organization's name, description, and mission, or set status Retired (or Active again)", tag, typeof(Organization), typeof(Organization));
            routes.Scoped(HttpMethod.DELETE, one, ResourceTypeEnum.Organization, OperationTypeEnum.Delete, DeleteAsync, "Delete an organization with its units, revisions, and unit and organization memory", tag, null, null);
            routes.Scoped(HttpMethod.GET, one + "/units", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ListUnitsAsync, "List the units of the working tree, root first", tag, null, typeof(List<OrgUnit>));
            routes.Scoped(HttpMethod.POST, one + "/units", ResourceTypeEnum.Organization, OperationTypeEnum.Update, CreateUnitAsync, "Add a unit to the working tree (parentUnitId, leadAgentId, leadMandateId, appId, members, peerLines take identifiers or names). Changes go live when a revision is published", tag, typeof(OrgUnit), typeof(OrgUnit));
            routes.Scoped(HttpMethod.GET, one + "/units/{unitId}", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ReadUnitAsync, "Read a unit of the working tree", tag, null, typeof(OrgUnit));
            routes.Scoped(HttpMethod.PUT, one + "/units/{unitId}", ResourceTypeEnum.Organization, OperationTypeEnum.Update, UpdateUnitAsync, "Replace a unit of the working tree", tag, typeof(OrgUnit), typeof(OrgUnit));
            routes.Scoped(HttpMethod.DELETE, one + "/units/{unitId}", ResourceTypeEnum.Organization, OperationTypeEnum.Update, DeleteUnitAsync, "Remove a unit without children from the working tree, with the peer lines that point at it", tag, null, null);
            routes.Scoped(HttpMethod.GET, one + "/chart", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ChartAsync, "The organization chart: units, leads, members, titles, mandate summaries, and peer lines of the live revision (the working tree before the first publish)", tag, null, typeof(OrgChart));
            routes.Scoped(HttpMethod.GET, one + "/revisions", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ListRevisionsAsync, "List revisions, newest first, without snapshots", tag, null, typeof(List<OrgRevision>));
            routes.Scoped(HttpMethod.POST, one + "/revisions", ResourceTypeEnum.Organization, OperationTypeEnum.Update, CreateRevisionAsync, "Snapshot the working tree as a Draft revision, pinning the current revision of every mandate it names", tag, typeof(OrgRevisionRequest), typeof(OrgRevision));
            routes.Scoped(HttpMethod.GET, one + "/revisions/{revId}", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ReadRevisionAsync, "Read a revision with its snapshot", tag, null, typeof(OrgRevision));
            routes.Scoped(HttpMethod.POST, one + "/revisions/{revId}/publish", ResourceTypeEnum.Organization, OperationTypeEnum.Update, PublishAsync, "Make a Draft revision live: the chain of command, lines, and budgets follow it, its pinned mandate revisions become current, and a promotion record with subject Organization is written", tag, null, typeof(OrgRevision));
            routes.Scoped(HttpMethod.POST, one + "/rollback", ResourceTypeEnum.Organization, OperationTypeEnum.Update, RollbackAsync, "Return to an earlier live revision (revisionId, or the previous one): publishes a copy of its snapshot, restores the working tree and pinned mandate revisions, and records the rollback. activeTicks Finish (default) lets in-flight keeper ticks complete; Cancel cancels their runs first. Mandates left outside the restored snapshot are paused", tag, typeof(OrgRollbackRequest), typeof(OrgRevision));
            routes.Scoped(HttpMethod.POST, one + "/units/{unitId}/cancel-all", ResourceTypeEnum.Organization, OperationTypeEnum.Update, CancelAllAsync, "Cancel everything in a unit's subtree of the live tree in one audited action: queued and running runs (running runs go to Cancelling), their keeper ticks, open escalations its agents raised (withdrawn), and queued messages to them (expired). Does not freeze. 409 OrganizationNotLive without a live revision", tag, typeof(CascadeCancelRequest), typeof(CascadeCancelResult));
            routes.Scoped(HttpMethod.GET, one + "/spend", ResourceTypeEnum.Organization, OperationTypeEnum.Read, SpendAsync, "Spend of each unit's subtree against its budgets in the current day and month windows (live revision)", tag, null, typeof(List<OrgUnitSpend>));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            List<string>? scoped = RouteHelpers.Context(http).ScopedOrganizationIds;
            if (scoped != null)
            {
                // UT-01, UT-05: a principal holding organization-scoped grants only lists the organizations they cover.
                List<Organization> visible = new List<Organization>();
                foreach (string id in scoped)
                {
                    Organization? organization = await _Organizations.FindAsync(tenantId, id, http.Token).ConfigureAwait(false);
                    if (organization == null) continue;
                    if (!String.IsNullOrEmpty(query.Search) && organization.Name.IndexOf(query.Search, StringComparison.OrdinalIgnoreCase) < 0) continue;
                    visible.Add(organization);
                }
                List<Organization> ordered = visible.OrderBy(o => o.Name, StringComparer.Ordinal).ToList();
                List<Organization> slice = ordered.Skip(Math.Max(0, query.Skip)).Take(query.MaxResults).ToList();
                await RouteHelpers.JsonAsync(http, 200, EnumerationResult<Organization>.Build(query, ordered.Count, slice)).ConfigureAwait(false);
                return;
            }
            EnumerationResult<Organization> page = await _Organizations.EnumerateAsync(tenantId, query, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            Organization body = RouteHelpers.RequiredBody<Organization>(http);
            Organization created = await _Organizations.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            await _Organizations.AttachUnitsAsync(organization, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, organization).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            Organization body = RouteHelpers.RequiredBody<Organization>(http);
            Organization updated = await _Organizations.UpdateAsync(RouteHelpers.Context(http), organization, body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            await _Organizations.DeleteAsync(RouteHelpers.Context(http), organization, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ListUnitsAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            await _Organizations.AttachUnitsAsync(organization, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, organization.Units ?? new List<OrgUnit>()).ConfigureAwait(false);
        }

        private async Task CreateUnitAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgUnit body = RouteHelpers.RequiredBody<OrgUnit>(http);
            OrgUnit unit = await _Organizations.CreateUnitAsync(RouteHelpers.Context(http), organization, body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, unit).ConfigureAwait(false);
        }

        private async Task ReadUnitAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgUnit unit = await LoadUnitAsync(http, organization).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, unit).ConfigureAwait(false);
        }

        private async Task UpdateUnitAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgUnit unit = await LoadUnitAsync(http, organization).ConfigureAwait(false);
            OrgUnit body = RouteHelpers.RequiredBody<OrgUnit>(http);
            OrgUnit updated = await _Organizations.UpdateUnitAsync(RouteHelpers.Context(http), organization, unit, body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, updated).ConfigureAwait(false);
        }

        private async Task DeleteUnitAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgUnit unit = await LoadUnitAsync(http, organization).ConfigureAwait(false);
            await _Organizations.DeleteUnitAsync(RouteHelpers.Context(http), organization, unit, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ChartAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Organizations.ChartAsync(organization, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ListRevisionsAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            List<OrgRevision> revisions = await _Server.Database.Organizations.ListRevisionsAsync(organization.TenantId, organization.Id, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, revisions).ConfigureAwait(false);
        }

        private async Task CreateRevisionAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgRevisionRequest? body = RouteHelpers.Body<OrgRevisionRequest>(http);
            OrgRevision revision = await _Organizations.CreateRevisionAsync(RouteHelpers.Context(http), organization, body?.Note, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, revision).ConfigureAwait(false);
        }

        private async Task ReadRevisionAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgRevision revision = await LoadRevisionAsync(http, organization).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, revision).ConfigureAwait(false);
        }

        private async Task PublishAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgRevision revision = await LoadRevisionAsync(http, organization).ConfigureAwait(false);
            OrgRevision published = await _Organizations.PublishAsync(RouteHelpers.Context(http), organization, revision, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, published).ConfigureAwait(false);
        }

        private async Task RollbackAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            OrgRollbackRequest? body = RouteHelpers.Body<OrgRollbackRequest>(http);
            OrgRevision revision = await _Organizations.RollbackAsync(RouteHelpers.Context(http), organization, body?.RevisionId, body?.Note, body?.ActiveTicks ?? RollbackActiveTicksEnum.Finish, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, revision).ConfigureAwait(false);
        }

        private async Task CancelAllAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            CascadeCancelRequest? body = RouteHelpers.Body<CascadeCancelRequest>(http);
            CascadeCancelResult result = await _Server.Get<OrgBrakeService>().CancelAllAsync(RouteHelpers.Context(http), organization, RouteHelpers.Param(http, "unitId"), body?.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, result).ConfigureAwait(false);
        }

        private async Task SpendAsync(HttpContextBase http)
        {
            Organization organization = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, await _Organizations.SpendAsync(organization, DateTime.UtcNow, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task<Organization> LoadAsync(HttpContextBase http)
        {
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Organization? organization = await _Organizations.FindAsync(RouteHelpers.Tenant(http), id, http.Token).ConfigureAwait(false);
            if (organization == null) throw new NotFoundException("Organization " + id + " not found.");
            return organization;
        }

        private async Task<OrgUnit> LoadUnitAsync(HttpContextBase http, Organization organization)
        {
            string unitId = RouteHelpers.Param(http, "unitId") ?? String.Empty;
            OrgUnit? unit = await _Organizations.FindUnitAsync(organization, unitId, http.Token).ConfigureAwait(false);
            if (unit == null) throw new NotFoundException("Unit " + unitId + " not found in organization " + organization.Name + ".");
            return unit;
        }

        private async Task<OrgRevision> LoadRevisionAsync(HttpContextBase http, Organization organization)
        {
            string revisionId = RouteHelpers.Param(http, "revId") ?? String.Empty;
            OrgRevision? revision = String.IsNullOrEmpty(revisionId) ? null : await _Server.Database.Organizations.ReadRevisionAsync(organization.TenantId, revisionId, http.Token).ConfigureAwait(false);
            if (revision == null || revision.OrganizationId != organization.Id) throw new NotFoundException("Revision " + revisionId + " not found in organization " + organization.Name + ".");
            return revision;
        }

        #endregion
    }
}
