namespace Garrison.Server.Routes
{
    using System;
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
    /// Escalation routes (AA2.9): list, read, answer, and cancel the questions runs raise. Runs raise and withdraw
    /// escalations through MCP (garrison_escalate, garrison_withdraw_escalation). Every route filters by the request's
    /// tenant; another tenant's escalation answers 404.
    /// </summary>
    public class EscalationRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly EscalationService _Escalations;
        private RouteRegistrar? _Routes = null;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/escalations";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="escalations">Escalation service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public EscalationRoutes(ServerContext server, EscalationService escalations)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Escalations = escalations ?? throw new ArgumentNullException(nameof(escalations));
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
            const string tag = "Escalations";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Escalation, OperationTypeEnum.Read, ListAsync, "List escalations, open first, then newest first (query: status, severity, targetKind, targetId, agentId, mandateId, raisingRunId, search, maxResults, skip)", tag, null, typeof(EnumerationResult<Escalation>), "id", null, new RouteScopeOptions().Query("agentId", ResourceTypeEnum.Agent).Query("mandateId", ResourceTypeEnum.Mandate).Query("raisingRunId", ResourceTypeEnum.Run).FilteredByOrganization());
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Escalation, OperationTypeEnum.Read, ReadAsync, "Read an escalation with its options and answer", tag, null, typeof(Escalation));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/answer", ResourceTypeEnum.Escalation, OperationTypeEnum.Update, AnswerAsync, "Answer an open escalation: choice must be one of its option keys when it has options, otherwise text is required. A run blocked on it resumes; a keeper that raised it wakes", tag, typeof(EscalationAnswerRequest), typeof(Escalation));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/cancel", ResourceTypeEnum.Escalation, OperationTypeEnum.Update, CancelAsync, "Cancel an open escalation. A run blocked on it is cancelled too", tag, typeof(EscalationCancelRequest), typeof(Escalation));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            EscalationFilter filter = new EscalationFilter();
            filter.TenantId = RouteHelpers.Tenant(http);
            filter.Status = RouteHelpers.QueryEnum<EscalationStatusEnum>(http, "status");
            filter.Severity = RouteHelpers.QueryEnum<EscalationSeverityEnum>(http, "severity");
            filter.TargetKind = RouteHelpers.QueryEnum<EscalationTargetKindEnum>(http, "targetKind");
            filter.TargetId = RouteHelpers.Query(http, "targetId");
            filter.AgentId = RouteHelpers.Query(http, "agentId");
            filter.MandateId = RouteHelpers.Query(http, "mandateId");
            filter.RaisingRunId = RouteHelpers.Query(http, "raisingRunId");
            filter.Search = query.Search;
            filter.MaxResults = query.MaxResults;
            filter.Skip = query.Skip;
            OrganizationMembers? members = await RouteHelpers.ScopedMembersAsync(_Server, http).ConfigureAwait(false);
            if (members != null) filter.WithinAgentIds = members.AgentIds.ToList();
            EnumerationResult<Escalation> page = await _Server.Database.Escalations.EnumerateAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            Escalation escalation = await LoadAsync(http).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, escalation).ConfigureAwait(false);
        }

        private async Task AnswerAsync(HttpContextBase http)
        {
            Escalation escalation = await LoadAsync(http).ConfigureAwait(false);
            EscalationAnswerRequest request = RouteHelpers.RequiredBody<EscalationAnswerRequest>(http);
            Escalation answered = await _Escalations.AnswerAsync(RouteHelpers.Context(http), escalation, request, EscalationResolutionSourceEnum.User, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, answered).ConfigureAwait(false);
        }

        private async Task CancelAsync(HttpContextBase http)
        {
            Escalation escalation = await LoadAsync(http).ConfigureAwait(false);
            EscalationCancelRequest? request = RouteHelpers.Body<EscalationCancelRequest>(http);
            Escalation cancelled = await _Escalations.CancelAsync(RouteHelpers.Context(http), escalation, request?.Reason, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, cancelled).ConfigureAwait(false);
        }

        private async Task<Escalation> LoadAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            Escalation? escalation = String.IsNullOrEmpty(id) ? null : await _Server.Database.Escalations.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false);
            if (escalation == null) throw new NotFoundException("Escalation " + id + " not found.");
            return escalation;
        }

        #endregion
    }
}
