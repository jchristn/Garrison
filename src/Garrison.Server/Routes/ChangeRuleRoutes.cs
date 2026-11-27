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
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Change rule and proposal routes (AA8.9): people write change rules that pre-authorize narrow classes of executive
    /// change, and read and decide the proposals executives make for their organization. Every route filters by the
    /// request's tenant; another tenant's rule or organization answers 404. Run tokens never hold ChangeRule permissions.
    /// </summary>
    public class ChangeRuleRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly ChangeRuleService _Rules;
        private readonly OrgProposalService _Proposals;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/change-rules";
        private static readonly string _Proposal = "/v1.0/api/tenants/{tenantId}/organizations/{id}/proposals";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="rules">Change rule service.</param>
        /// <param name="proposals">Proposal service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ChangeRuleRoutes(ServerContext server, ChangeRuleService rules, OrgProposalService proposals)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Rules = rules ?? throw new ArgumentNullException(nameof(rules));
            _Proposals = proposals ?? throw new ArgumentNullException(nameof(proposals));
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
            _Routes = routes ?? throw new ArgumentNullException(nameof(routes));
            const string tag = "Change rules";
            string one = _Base + "/{ruleId}";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.ChangeRule, OperationTypeEnum.Read, ListAsync, "List change rules, newest first (query: organization, unit, activeOnly, search, maxResults, skip)", tag, null, typeof(EnumerationResult<ChangeRule>), "ruleId", null, new RouteScopeOptions().Query("organization", ResourceTypeEnum.Organization).Query("unit", ResourceTypeEnum.Organization));
            routes.ScopedByHandler(HttpMethod.POST, _Base, ResourceTypeEnum.ChangeRule, OperationTypeEnum.Create, CreateAsync, "Create a change rule (people only; authorized as Create on ChangeRule tenant-wide or on the organization): organizationId, unitId (whose subtree it covers), name, classes, optional limits and expiresUtc", tag, typeof(ChangeRule), typeof(ChangeRule));
            routes.Scoped(HttpMethod.GET, one, ResourceTypeEnum.ChangeRule, OperationTypeEnum.Read, ReadAsync, "Read a change rule", tag, null, typeof(ChangeRule), "ruleId");
            routes.Scoped(HttpMethod.PUT, one, ResourceTypeEnum.ChangeRule, OperationTypeEnum.Update, UpdateAsync, "Replace a change rule's unit, name, description, active flag, expiry, classes, and limits (people only)", tag, typeof(ChangeRule), typeof(ChangeRule), "ruleId");
            routes.Scoped(HttpMethod.DELETE, one, ResourceTypeEnum.ChangeRule, OperationTypeEnum.Delete, DeleteAsync, "Delete a change rule (people only)", tag, null, null, "ruleId");
            routes.Scoped(HttpMethod.GET, _Proposal, ResourceTypeEnum.Organization, OperationTypeEnum.Read, ListProposalsAsync, "List the organization's executive proposals, newest change first (query: status, maxResults, skip)", tag, null, typeof(EnumerationResult<OrgProposal>));
            routes.Scoped(HttpMethod.GET, _Proposal + "/{draftId}", ResourceTypeEnum.Organization, OperationTypeEnum.Read, ReadProposalAsync, "Read a proposal; one not yet applied carries its diff, hard-limit refusals, and the change rule matching each change", tag, null, typeof(OrgProposal));
            routes.Scoped(HttpMethod.POST, _Proposal + "/{draftId}/decide", ResourceTypeEnum.Approval, OperationTypeEnum.Update, DecideProposalAsync, "Allow (apply, recorded as an org revision) or deny (back to the executive) a proposal waiting for approval", tag, typeof(OrgProposalDecisionRequest), typeof(OrgProposal));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationResult<ChangeRule> page = await _Rules.EnumerateAsync(RouteHelpers.Tenant(http), RouteHelpers.Query(http, "organization"), RouteHelpers.Query(http, "unit"), RouteHelpers.Enumeration(http), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase http)
        {
            ChangeRule body = RouteHelpers.RequiredBody<ChangeRule>(http);
            if (_Routes == null) throw new InvalidOperationException("Change rule routes are not registered.");
            if (!await _Routes.RequireWithinAsync(http, RouteHelpers.Tenant(http), ResourceTypeEnum.ChangeRule, OperationTypeEnum.Create, ResourceTypeEnum.Organization, body.OrganizationId).ConfigureAwait(false)) return;
            ChangeRule created = await _Rules.CreateAsync(RouteHelpers.Context(http), RouteHelpers.Tenant(http), body, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 201, created).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await _Rules.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "ruleId"), http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase http)
        {
            ChangeRule existing = await _Rules.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "ruleId"), http.Token).ConfigureAwait(false);
            ChangeRule body = RouteHelpers.RequiredBody<ChangeRule>(http);
            await RouteHelpers.JsonAsync(http, 200, await _Rules.UpdateAsync(RouteHelpers.Context(http), existing, body, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            ChangeRule existing = await _Rules.ReadAsync(RouteHelpers.Tenant(http), RouteHelpers.Param(http, "ruleId"), http.Token).ConfigureAwait(false);
            await _Rules.DeleteAsync(RouteHelpers.Context(http), existing, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task ListProposalsAsync(HttpContextBase http)
        {
            Organization organization = await OrganizationAsync(http).ConfigureAwait(false);
            EnumerationResult<OrgProposal> page = await _Proposals.EnumerateAsync(organization, RouteHelpers.Enumeration(http), RouteHelpers.QueryEnum<StudioDraftStatusEnum>(http, "status"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadProposalAsync(HttpContextBase http)
        {
            Organization organization = await OrganizationAsync(http).ConfigureAwait(false);
            OrgProposal proposal = await _Proposals.ReadAsync(RouteHelpers.Context(http), organization, RouteHelpers.Param(http, "draftId"), http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, proposal).ConfigureAwait(false);
        }

        private async Task DecideProposalAsync(HttpContextBase http)
        {
            Organization organization = await OrganizationAsync(http).ConfigureAwait(false);
            OrgProposalDecisionRequest body = RouteHelpers.RequiredBody<OrgProposalDecisionRequest>(http);
            OrgProposal proposal = await _Proposals.DecideAsync(RouteHelpers.Context(http), organization, RouteHelpers.Param(http, "draftId"), body.Allow, body.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, proposal).ConfigureAwait(false);
        }

        private async Task<Organization> OrganizationAsync(HttpContextBase http)
        {
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Organization? organization = await _Server.Get<OrganizationService>().FindAsync(RouteHelpers.Tenant(http), id, http.Token).ConfigureAwait(false);
            if (organization == null) throw new NotFoundException("Organization " + id + " not found.");
            return organization;
        }

        #endregion
    }
}
