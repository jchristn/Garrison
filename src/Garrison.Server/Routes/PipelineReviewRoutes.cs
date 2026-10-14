namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Pipeline stage review routes (P12.9) under /v1.0/api/tenants/{tenantId}/pipeline-reviews, authorized as
    /// ResourceType Approval (Read to list and read, Update to decide). Run tokens can never use them.
    /// </summary>
    public class PipelineReviewRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly PipelineService _Pipelines;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/pipeline-reviews";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="pipelines">Pipeline service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public PipelineReviewRoutes(ServerContext server, PipelineService pipelines)
        {
            _Server = server ?? throw new ArgumentNullException(nameof(server));
            _Pipelines = pipelines ?? throw new ArgumentNullException(nameof(pipelines));
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
            if (routes == null) throw new ArgumentNullException(nameof(routes));
            const string tag = "Pipeline reviews";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.Approval, OperationTypeEnum.Read, ListAsync, "List pipeline stage reviews (filter by status, pipelineRunId, pipelineId, runId, decisionSource)", tag, null, typeof(EnumerationResult<PipelineReview>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.Approval, OperationTypeEnum.Read, ReadAsync, "Read a pipeline stage review", tag, null, typeof(PipelineReview));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/decide", ResourceTypeEnum.Approval, OperationTypeEnum.Update, DecideAsync, "Approve, request changes to, or reject a pending pipeline stage review", tag, typeof(PipelineReviewDecideRequest), typeof(PipelineReview));
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            PipelineReviewFilter filter = new PipelineReviewFilter();
            filter.TenantId = RouteHelpers.Tenant(http);
            filter.Status = RouteHelpers.QueryEnum<PipelineReviewStatusEnum>(http, "status");
            filter.PipelineRunId = RouteHelpers.Query(http, "pipelineRunId");
            filter.PipelineId = RouteHelpers.Query(http, "pipelineId");
            filter.RunId = RouteHelpers.Query(http, "runId");
            filter.DecisionSource = RouteHelpers.QueryEnum<PipelineReviewSourceEnum>(http, "decisionSource");
            filter.FromUtc = RouteHelpers.QueryDate(http, "fromUtc");
            filter.ToUtc = RouteHelpers.QueryDate(http, "toUtc");
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = query.Ordering;
            EnumerationResult<PipelineReview> page = await _Server.Database.PipelineReviews.EnumerateAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            await RouteHelpers.JsonAsync(http, 200, await RequireAsync(http).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task DecideAsync(HttpContextBase http)
        {
            PipelineReview review = await RequireAsync(http).ConfigureAwait(false);
            PipelineReviewDecideRequest request = RouteHelpers.RequiredBody<PipelineReviewDecideRequest>(http);
            PipelineReview decided = await _Pipelines.DecideAsync(RouteHelpers.Context(http), review, request, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, decided).ConfigureAwait(false);
        }

        private async Task<PipelineReview> RequireAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            return await _Server.Database.PipelineReviews.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Pipeline review " + id + " not found.");
        }

        #endregion
    }
}
