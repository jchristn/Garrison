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
    using Garrison.Core.Responses;
    using WatsonWebserver.Core;

    /// <summary>
    /// Tenant overview (Home KPIs) and queue summary.
    /// </summary>
    public class OverviewRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public OverviewRoutes(ServerContext context)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
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
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/overview", ResourceTypeEnum.Run, OperationTypeEnum.Read, OverviewAsync, "Tenant overview for the Home page", "Overview", null, typeof(OverviewResponse));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/tenants/{tenantId}/queue/summary", ResourceTypeEnum.Run, OperationTypeEnum.Read, QueueAsync, "Active runs grouped by agent and harness", "Overview", null, typeof(List<QueueSummaryRow>));
        }

        #endregion

        #region Private-Methods

        private async Task OverviewAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            EnumerationQuery one = new EnumerationQuery();
            one.MaxResults = 1;

            OverviewResponse overview = new OverviewResponse();
            overview.Agents = (await _Context.Database.Agents.EnumerateAsync(tenantId, one, context.Token).ConfigureAwait(false)).TotalRecords;
            overview.Deployments = (await _Context.Database.Deployments.EnumerateAsync(tenantId, one, context.Token).ConfigureAwait(false)).TotalRecords;
            overview.RunsByStatus = await _Context.Database.Runs.CountByStatusAsync(tenantId, DateTime.UtcNow.AddHours(-24), context.Token).ConfigureAwait(false);
            overview.RunsLast24Hours = overview.RunsByStatus.Sum(s => s.Count);

            List<StatusCount> active = await _Context.Database.Runs.CountByStatusAsync(tenantId, null, context.Token).ConfigureAwait(false);
            overview.Queued = active.Where(s => s.Status == RunStatusEnum.Queued.ToString()).Sum(s => s.Count);
            overview.Active = active.Where(s => s.Status == RunStatusEnum.Leased.ToString() || s.Status == RunStatusEnum.Running.ToString() || s.Status == RunStatusEnum.Cancelling.ToString()).Sum(s => s.Count);

            EnumerationQuery nodesQuery = new EnumerationQuery();
            nodesQuery.MaxResults = 1000;
            EnumerationResult<Node> nodes = await _Context.Database.Nodes.EnumerateAsync(nodesQuery, context.Token).ConfigureAwait(false);
            overview.NodesByStatus = nodes.Objects.GroupBy(n => n.Status.ToString()).Select(g =>
            {
                StatusCount count = new StatusCount();
                count.Status = g.Key;
                count.Count = g.Count();
                return count;
            }).ToList();

            List<Run> failures = new List<Run>();
            foreach (RunStatusEnum status in new[] { RunStatusEnum.Failed, RunStatusEnum.TimedOut })
            {
                RunFilter filter = new RunFilter();
                filter.TenantId = tenantId;
                filter.Status = status;
                filter.MaxResults = 5;
                failures.AddRange((await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false)).Objects);
            }
            overview.RecentFailures = failures.OrderByDescending(r => r.CreatedUtc).Take(5).ToList();
            await RouteHelpers.JsonAsync(context, 200, overview).ConfigureAwait(false);
        }

        private async Task QueueAsync(HttpContextBase context)
        {
            List<QueueSummaryRow> rows = await _Context.Database.Runs.QueueSummaryAsync(RouteHelpers.Tenant(context), context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, rows).ConfigureAwait(false);
        }

        #endregion
    }
}
