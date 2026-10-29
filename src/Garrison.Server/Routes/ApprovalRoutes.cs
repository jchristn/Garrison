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
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Permission approval routes (P12.3): list, read, and decide approvals, and test a deployment's approval rules.
    /// Reading needs Approval Read, deciding needs Approval Update, and deciding with remember also needs Deployment
    /// Update on the approval's deployment. Run tokens can neither read nor decide approvals.
    /// </summary>
    public class ApprovalRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly ApprovalService _Approvals;
        private RouteRegistrar? _Routes = null;
        private readonly string _Base = "/v1.0/api/tenants/{tenantId}/approvals";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="approvals">Approval service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public ApprovalRoutes(ServerContext context, ApprovalService approvals)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Approvals = approvals ?? throw new ArgumentNullException(nameof(approvals));
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
            const string tag = "Approvals";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Approval, OperationTypeEnum.Read, ListAsync, "List permission approvals (filter by status, runId, rootRunId, agentId, deploymentId, decisionSource)", tag, null, typeof(EnumerationResult<Approval>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Approval, OperationTypeEnum.Read, ReadAsync, "Read a permission approval", tag, null, typeof(Approval));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/decide", ResourceTypeEnum.Approval, OperationTypeEnum.Update, DecideAsync, "Allow or deny a pending approval, optionally remembering the decision as a deployment rule", tag, typeof(ApprovalDecideRequest), typeof(Approval));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/approval-check", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, CheckAsync, "Evaluate a deployment's approval rules against a sample tool call without recording anything", tag, typeof(ApprovalCheckRequest), typeof(ApprovalCheckResponse), "deploymentId");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase context)
        {
            ApprovalFilter filter = new ApprovalFilter();
            filter.TenantId = RouteHelpers.Tenant(context);
            filter.Status = RouteHelpers.QueryEnum<ApprovalStatusEnum>(context, "status");
            filter.RunId = RouteHelpers.Query(context, "runId");
            filter.RootRunId = RouteHelpers.Query(context, "rootRunId");
            filter.AgentId = RouteHelpers.Query(context, "agentId");
            filter.DeploymentId = RouteHelpers.Query(context, "deploymentId");
            filter.DecisionSource = RouteHelpers.QueryEnum<ApprovalSourceEnum>(context, "decisionSource");
            filter.FromUtc = RouteHelpers.QueryDate(context, "fromUtc");
            filter.ToUtc = RouteHelpers.QueryDate(context, "toUtc");
            EnumerationQuery query = RouteHelpers.Enumeration(context);
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = query.Ordering;
            EnumerationResult<Approval> page = await _Context.Database.Approvals.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            Approval approval = await RequireAsync(context).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, approval).ConfigureAwait(false);
        }

        private async Task DecideAsync(HttpContextBase context)
        {
            Approval approval = await RequireAsync(context).ConfigureAwait(false);
            ApprovalDecideRequest request = RouteHelpers.RequiredBody<ApprovalDecideRequest>(context);
            if (approval.Kind == ApprovalKindEnum.DraftApply)
            {
                if (!request.Decision.HasValue) throw new ValidationException("decision is required (Allow or Deny).", new Dictionary<string, string> { { "decision", "Allow or Deny." } });
                Approval draftDecided = await _Context.Get<StudioService>().DecideAsync(RouteHelpers.Context(context), approval, request.Decision.Value == ApprovalDecisionEnum.Allow, request.Reason, context.Token).ConfigureAwait(false);
                await RouteHelpers.JsonAsync(context, 200, draftDecided).ConfigureAwait(false);
                return;
            }
            if (request.Remember && _Routes != null && !await _Routes.RequireAsync(context, approval.TenantId, ResourceTypeEnum.Deployment, OperationTypeEnum.Update, approval.DeploymentId).ConfigureAwait(false)) return;
            Approval decided = await _Approvals.DecideAsync(RouteHelpers.Context(context), approval, request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, decided).ConfigureAwait(false);
        }

        private async Task CheckAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string deploymentId = RouteHelpers.Param(context, "deploymentId") ?? String.Empty;
            Deployment deployment = await _Context.Database.Deployments.ReadAsync(tenantId, deploymentId, context.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Deployment " + deploymentId + " not found.");
            ApprovalCheckRequest request = RouteHelpers.RequiredBody<ApprovalCheckRequest>(context);
            await RouteHelpers.JsonAsync(context, 200, _Approvals.Check(deployment, request)).ConfigureAwait(false);
        }

        private async Task<Approval> RequireAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            return await _Context.Database.Approvals.ReadAsync(tenantId, id, context.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Approval " + id + " not found.");
        }

        #endregion
    }
}
