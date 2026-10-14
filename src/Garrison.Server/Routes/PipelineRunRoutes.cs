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
    /// Pipeline run routes (P12.9) under /v1.0/api/tenants/{tenantId}/pipeline-runs: list, detail (stages, stage run
    /// summaries, reviews), cancel, resume a stopped pipeline run, and delete a finished one.
    /// </summary>
    public class PipelineRunRoutes
    {
        #region Private-Members

        private readonly ServerContext _Server;
        private readonly PipelineService _Pipelines;
        private static readonly string _Base = "/v1.0/api/tenants/{tenantId}/pipeline-runs";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="server">Server context.</param>
        /// <param name="pipelines">Pipeline service.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public PipelineRunRoutes(ServerContext server, PipelineService pipelines)
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
            const string tag = "Pipeline runs";
            routes.Scoped(HttpMethod.GET, _Base, ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read, ListAsync, "List pipeline runs (filter by pipelineId, status, callerId, fromUtc, toUtc)", tag, null, typeof(EnumerationResult<PipelineRun>));
            routes.Scoped(HttpMethod.GET, _Base + "/{id}", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Read, ReadAsync, "Read a pipeline run with its stages, stage run summaries, and reviews (waitSeconds waits until it ends or awaits a review)", tag, null, typeof(PipelineRun));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/cancel", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Update, CancelAsync, "Cancel a pipeline run, its pending review, and its current stage run", tag, null, typeof(PipelineRun));
            routes.Scoped(HttpMethod.POST, _Base + "/{id}/retry", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Update, RetryAsync, "Resume a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped", tag, null, typeof(PipelineRun));
            routes.Scoped(HttpMethod.DELETE, _Base + "/{id}", ResourceTypeEnum.PipelineRun, OperationTypeEnum.Delete, DeleteAsync, "Delete a finished pipeline run and its reviews (stage runs are kept)", tag);
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase http)
        {
            PipelineRunFilter filter = new PipelineRunFilter();
            filter.TenantId = RouteHelpers.Tenant(http);
            filter.PipelineId = RouteHelpers.Query(http, "pipelineId");
            filter.Status = RouteHelpers.QueryEnum<PipelineRunStatusEnum>(http, "status");
            filter.CallerId = RouteHelpers.Query(http, "callerId");
            filter.FromUtc = RouteHelpers.QueryDate(http, "fromUtc");
            filter.ToUtc = RouteHelpers.QueryDate(http, "toUtc");
            EnumerationQuery query = RouteHelpers.Enumeration(http);
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = query.Ordering;
            EnumerationResult<PipelineRun> page = await _Server.Database.PipelineRuns.EnumerateAsync(filter, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase http)
        {
            PipelineRun run = await RequireAsync(http).ConfigureAwait(false);
            int? waitSeconds = RouteHelpers.QueryInt(http, "waitSeconds");
            if (waitSeconds.HasValue && waitSeconds.Value > 0)
            {
                run = await _Pipelines.WaitAsync(run.TenantId, run.Id, Math.Clamp(waitSeconds.Value, 0, 600), http.Token).ConfigureAwait(false) ?? run;
            }
            await RouteHelpers.JsonAsync(http, 200, await _Pipelines.DetailAsync(run, http.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CancelAsync(HttpContextBase http)
        {
            PipelineRun run = await RequireAsync(http).ConfigureAwait(false);
            PipelineRun cancelled = await _Pipelines.CancelAsync(RouteHelpers.Context(http), run, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, cancelled).ConfigureAwait(false);
        }

        private async Task RetryAsync(HttpContextBase http)
        {
            PipelineRun run = await RequireAsync(http).ConfigureAwait(false);
            PipelineRun resumed = await _Pipelines.RetryAsync(RouteHelpers.Context(http), run, http.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(http, 200, resumed).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase http)
        {
            PipelineRun run = await RequireAsync(http).ConfigureAwait(false);
            if (!PipelineService.IsTerminal(run.Status)) throw new ConflictException("PipelineRunActive", "Only finished pipeline runs can be deleted. Cancel pipeline run " + run.Id + " first.");
            if (!await _Server.Database.PipelineRuns.DeleteAsync(run.TenantId, run.Id, http.Token).ConfigureAwait(false))
            {
                // A retry reopened it (or another request deleted it) after the read above.
                PipelineRun? now = await _Server.Database.PipelineRuns.ReadAsync(run.TenantId, run.Id, http.Token).ConfigureAwait(false);
                if (now == null) throw new NotFoundException("Pipeline run " + run.Id + " not found.");
                throw new ConflictException("PipelineRunActive", "Only finished pipeline runs can be deleted; pipeline run " + run.Id + " is " + now.Status + ". Cancel it first.");
            }
            await _Server.Audit.WriteAsync(RouteHelpers.Context(http), AuditEventTypeEnum.ConfigurationChanged, "PipelineRun", run.Id, "Deleted pipeline run " + run.Id + " of " + run.PipelineName + ".", run.TenantId, http.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(http).ConfigureAwait(false);
        }

        private async Task<PipelineRun> RequireAsync(HttpContextBase http)
        {
            string tenantId = RouteHelpers.Tenant(http);
            string id = RouteHelpers.Param(http, "id") ?? String.Empty;
            return await _Server.Database.PipelineRuns.ReadAsync(tenantId, id, http.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Pipeline run " + id + " not found.");
        }

        #endregion
    }
}
