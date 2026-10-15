namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;
    using Garrison.Core.Responses;
    using Garrison.Core.Security;
    using Garrison.Core.Serialization;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using Garrison.Server.Services;
    using WatsonWebserver.Core;

    /// <summary>
    /// Run routes: create, invoke, list, read, cancel, retry, events (poll and SSE), children, delete.
    /// </summary>
    public class RunRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly RunService _Runs;
        private readonly RunEventService _Events;
        private readonly RuntimeOptions _Options;
        private readonly RunSignals _Signals;
        private readonly AgentInvoker _Invoker;
        private readonly BlockedRunService _Blocked;
        private RouteRegistrar? _Routes = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="runs">Run service.</param>
        /// <param name="events">Run event service.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="invoker">Agent invoker.</param>
        /// <param name="blocked">Blocked-run evaluator (fills blockedReason on reads).</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public RunRoutes(ServerContext context, RunService runs, RunEventService events, RuntimeOptions options, RunSignals signals, AgentInvoker invoker, BlockedRunService blocked)
        {
            _Blocked = blocked ?? throw new ArgumentNullException(nameof(blocked));
            _Invoker = invoker ?? throw new ArgumentNullException(nameof(invoker));
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Runs = runs ?? throw new ArgumentNullException(nameof(runs));
            _Events = events ?? throw new ArgumentNullException(nameof(events));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
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
            const string tag = "Runs";
            const string baseRuns = "/v1.0/api/tenants/{tenantId}/runs";
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke", ResourceTypeEnum.Agent, OperationTypeEnum.Execute, InvokeAsync, "Invoke an agent", tag, typeof(InvokeRequest), typeof(Run), "agentId");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/tenants/{tenantId}/deployments/{deploymentId}/test", ResourceTypeEnum.Deployment, OperationTypeEnum.Read, TestDeploymentAsync, "Invoke a specific deployment with a test input", tag, typeof(InvokeRequest), typeof(Run), "deploymentId");
            routes.Scoped(HttpMethod.POST, baseRuns, ResourceTypeEnum.Run, OperationTypeEnum.Create, CreateAsync, "Create a run", tag, typeof(RunCreateRequest), typeof(Run));
            routes.Scoped(HttpMethod.GET, baseRuns, ResourceTypeEnum.Run, OperationTypeEnum.Read, ListAsync, "List runs", tag, null, typeof(EnumerationResult<Run>));
            routes.Scoped(HttpMethod.DELETE, baseRuns, ResourceTypeEnum.Run, OperationTypeEnum.Delete, DeleteManyAsync, "Delete finished runs matching a filter", tag, null, typeof(DeleteCountResponse));
            routes.Scoped(HttpMethod.GET, baseRuns + "/{id}", ResourceTypeEnum.Run, OperationTypeEnum.Read, ReadAsync, "Read a run", tag, null, typeof(Run));
            routes.Scoped(HttpMethod.DELETE, baseRuns + "/{id}", ResourceTypeEnum.Run, OperationTypeEnum.Delete, DeleteAsync, "Delete a finished run", tag);
            routes.Scoped(HttpMethod.POST, baseRuns + "/{id}/cancel", ResourceTypeEnum.Run, OperationTypeEnum.Update, CancelAsync, "Cancel a run", tag, null, typeof(Run));
            routes.Scoped(HttpMethod.POST, baseRuns + "/{id}/retry", ResourceTypeEnum.Run, OperationTypeEnum.Create, RetryAsync, "Retry a finished run as a new run", tag, null, typeof(Run));
            routes.Scoped(HttpMethod.GET, baseRuns + "/{id}/events", ResourceTypeEnum.Run, OperationTypeEnum.Read, EventsAsync, "Read run events after a sequence", tag, null, typeof(RunEventsResponse));
            routes.Scoped(HttpMethod.GET, baseRuns + "/{id}/events/stream", ResourceTypeEnum.Run, OperationTypeEnum.Read, StreamAsync, "Stream run events (server-sent events)", tag);
            routes.Scoped(HttpMethod.GET, baseRuns + "/{id}/children", ResourceTypeEnum.Run, OperationTypeEnum.Read, ChildrenAsync, "List runs delegated by a run", tag, null, typeof(EnumerationResult<Run>));
        }

        #endregion

        #region Private-Methods

        private async Task InvokeAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string agentId = RouteHelpers.Param(context, "agentId") ?? String.Empty;
            InvokeRequest request = RouteHelpers.Body<InvokeRequest>(context) ?? new InvokeRequest();
            Agent agent = await ResolveAgentAsync(tenantId, agentId, null, context).ConfigureAwait(false);
            if (agent.Id != agentId && _Routes != null && !await _Routes.RequireAsync(context, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id).ConfigureAwait(false)) return;
            await CreateAndRespondAsync(context, tenantId, agent, request.DeploymentId, request.Input, request.InputContentType, request.Parameters, request.Priority, request.Wait, request.WaitSeconds, request.CancelOnDisconnect, RunKindEnum.Invoke, request.ConversationId, request.StartConversation).ConfigureAwait(false);
        }

        private async Task TestDeploymentAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string deploymentId = RouteHelpers.Param(context, "deploymentId") ?? String.Empty;
            InvokeRequest request = RouteHelpers.Body<InvokeRequest>(context) ?? new InvokeRequest();
            Deployment deployment = await _Context.Database.Deployments.ReadAsync(tenantId, deploymentId, context.Token).ConfigureAwait(false)
                ?? throw new NotFoundException("Deployment " + deploymentId + " not found.");
            if (_Routes != null && !await _Routes.RequireAsync(context, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, deployment.AgentId).ConfigureAwait(false)) return;
            Agent agent = await ResolveAgentAsync(tenantId, deployment.AgentId, null, context).ConfigureAwait(false);
            await CreateAndRespondAsync(context, tenantId, agent, deployment.Id, request.Input, request.InputContentType, request.Parameters, request.Priority, request.Wait, request.WaitSeconds, request.CancelOnDisconnect, RunKindEnum.Test, request.ConversationId, request.StartConversation).ConfigureAwait(false);
        }

        private async Task CreateAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            RunCreateRequest request = RouteHelpers.RequiredBody<RunCreateRequest>(context);
            Agent agent = await ResolveAgentAsync(tenantId, request.AgentId, request.AgentName, context).ConfigureAwait(false);
            if (_Routes != null && !await _Routes.RequireAsync(context, tenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, agent.Id).ConfigureAwait(false)) return;
            await CreateAndRespondAsync(context, tenantId, agent, request.DeploymentId, request.Input, request.InputContentType, request.Parameters, request.Priority, request.Wait, request.WaitSeconds, request.CancelOnDisconnect, RunKindEnum.Invoke, request.ConversationId, request.StartConversation).ConfigureAwait(false);
        }

        private async Task CreateAndRespondAsync(HttpContextBase context, string tenantId, Agent agent, string? deploymentId, string input, string? contentType, Dictionary<string, string>? parameters, int priority, bool wait, int waitSeconds, bool? cancelOnDisconnect, RunKindEnum kind, string? conversationId, bool startConversation)
        {
            InvocationOptions options = new InvocationOptions();
            options.Input = input ?? String.Empty;
            options.InputContentType = contentType;
            options.DeploymentId = deploymentId;
            options.Parameters = parameters ?? new Dictionary<string, string>();
            options.Priority = priority;
            options.Kind = kind;
            options.ConversationId = conversationId;
            options.StartConversation = startConversation;
            options.IdempotencyKey = context.Request.Headers[Constants.HeaderIdempotencyKey];
            options.Wait = RouteHelpers.QueryBool(context, "wait") ?? wait;
            options.WaitSeconds = RouteHelpers.QueryInt(context, "waitSeconds") ?? waitSeconds;
            options.CancelOnDisconnect = RouteHelpers.QueryBool(context, "cancelOnDisconnect") ?? cancelOnDisconnect ?? true;
            options.CallerGone = () => context.RequestAborted && !_Context.IsDraining;
            options.DisconnectReason = "the REST client disconnected while waiting";
            Run run = await _Invoker.InvokeAsync(RouteHelpers.Context(context), tenantId, agent, options, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateAsync(run, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, RunService.IsTerminal(run.Status) ? 200 : 202, run).ConfigureAwait(false);
        }

        private async Task ListAsync(HttpContextBase context)
        {
            RunFilter filter = new RunFilter();
            filter.TenantId = RouteHelpers.Tenant(context);
            filter.Status = RouteHelpers.QueryEnum<RunStatusEnum>(context, "status");
            filter.AgentId = RouteHelpers.Query(context, "agentId");
            filter.DeploymentId = RouteHelpers.Query(context, "deploymentId");
            filter.HarnessType = RouteHelpers.QueryEnum<HarnessTypeEnum>(context, "harnessType");
            filter.NodeId = RouteHelpers.Query(context, "nodeId");
            filter.ParentRunId = RouteHelpers.Query(context, "parentRunId");
            filter.RootRunId = RouteHelpers.Query(context, "rootRunId");
            filter.ConversationId = RouteHelpers.Query(context, "conversationId");
            filter.PipelineRunId = RouteHelpers.Query(context, "pipelineRunId");
            filter.TriggerId = RouteHelpers.Query(context, "triggerId");
            filter.Outcome = RouteHelpers.QueryEnum<RunOutcomeEnum>(context, "outcome");
            filter.CallerId = RouteHelpers.Query(context, "callerId");
            filter.FromUtc = RouteHelpers.QueryDate(context, "fromUtc");
            filter.ToUtc = RouteHelpers.QueryDate(context, "toUtc");
            EnumerationQuery query = RouteHelpers.Enumeration(context);
            filter.Skip = query.Skip;
            filter.MaxResults = query.MaxResults;
            filter.Ordering = query.Ordering;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateManyAsync(page.Objects, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, page).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            await _Blocked.AnnotateAsync(run, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, run).ConfigureAwait(false);
        }

        private async Task CancelAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            Run updated = await _Runs.CancelAsync(run, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateAsync(updated, context.Token).ConfigureAwait(false);
            await _Context.Audit.WriteAsync(RouteHelpers.Context(context), AuditEventTypeEnum.RunCancelled, "Run", run.Id, "Cancellation requested.", run.TenantId, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, updated).ConfigureAwait(false);
        }

        private async Task RetryAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            if (await _Context.Database.Agents.ReadAsync(run.TenantId, run.AgentId, context.Token).ConfigureAwait(false) == null)
            {
                // Checked before the agent permission so the caller learns why, instead of a generic not found.
                await RouteHelpers.ErrorAsync(context, 409, "AgentDeleted", "Run " + run.Id + " cannot be retried because the agent " + run.AgentName + " was deleted.").ConfigureAwait(false);
                return;
            }
            if (_Routes != null && !await _Routes.RequireAsync(context, run.TenantId, ResourceTypeEnum.Agent, OperationTypeEnum.Execute, run.AgentId).ConfigureAwait(false)) return;
            RequestContext ctx = RouteHelpers.Context(context);
            RunCreateContext caller = new RunCreateContext();
            ApplyCaller(ctx, caller);
            Run retried = await _Runs.RetryAsync(run, caller.CallerType, caller.CallerId, caller.CallerName, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateAsync(retried, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 201, retried).ConfigureAwait(false);
        }

        private async Task EventsAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            long after = RouteHelpers.QueryLong(context, "afterSequence") ?? 0;
            int limit = RouteHelpers.QueryInt(context, "limit") ?? 500;
            RunEventsResponse response = await _Events.ReadAsync(run, after, limit, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task StreamAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            long after = RouteHelpers.QueryLong(context, "afterSequence") ?? 0;

            // An EventSource that reconnects (possibly to another replica) resumes after the last event it received.
            string? lastEventId = context.Request.Headers["Last-Event-ID"];
            if (!String.IsNullOrEmpty(lastEventId) && Int64.TryParse(lastEventId, out long resumeAfter) && resumeAfter > after) after = resumeAfter;

            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/event-stream";
            context.Response.Headers.Add("Cache-Control", "no-cache");
            context.Response.Headers.Add("X-Accel-Buffering", "no");
            context.Response.ServerSentEvents = true;

            _Context.Activity.StreamOpened();
            StreamTelemetry.Opened("run_events");
            try
            {
                using (RunSignalSubscription signal = _Signals.Subscribe(run.Id))
                {
                    DateTime lastKeepAlive = DateTime.UtcNow;
                    while (!context.Token.IsCancellationRequested)
                    {
                        if (_Context.IsDraining)
                        {
                            // The replica is shutting down: end the stream; an EventSource reconnects to another replica and
                            // resumes after Last-Event-ID.
                            await context.Response.SendEvent(new ServerSentEvent { Event = "server.draining", Data = "{}" }, true, context.Token).ConfigureAwait(false);
                            StreamTelemetry.Sent("run_events");
                            return;
                        }
                        Run? current = await _Context.Database.Runs.ReadAsync(run.TenantId, run.Id, context.Token).ConfigureAwait(false);
                        if (current == null) break;
                        RunEventsResponse batch = await _Events.ReadAsync(current, after, 500, context.Token).ConfigureAwait(false);
                        foreach (RunEvent evt in batch.Events)
                        {
                            ServerSentEvent message = new ServerSentEvent();
                            message.Id = evt.Sequence.ToString();
                            message.Event = "run.event";
                            message.Data = Serializer.Serialize(evt);
                            await context.Response.SendEvent(message, false, context.Token).ConfigureAwait(false);
                            StreamTelemetry.Sent("run_events");
                            after = evt.Sequence;
                        }

                        if (RunService.IsTerminal(current.Status) && !batch.HasMore)
                        {
                            ServerSentEvent done = new ServerSentEvent();
                            done.Event = "run.completed";
                            done.Data = Serializer.Serialize(current);
                            await context.Response.SendEvent(done, true, context.Token).ConfigureAwait(false);
                            StreamTelemetry.Sent("run_events");
                            return;
                        }

                        if ((DateTime.UtcNow - lastKeepAlive).TotalSeconds >= 15)
                        {
                            ServerSentEvent status = new ServerSentEvent();
                            status.Event = "run.status";
                            status.Data = "{\"status\":\"" + current.Status + "\"}";
                            await context.Response.SendEvent(status, false, context.Token).ConfigureAwait(false);
                            StreamTelemetry.Sent("run_events");
                            lastKeepAlive = DateTime.UtcNow;
                        }

                        if (!batch.HasMore)
                        {
                            using (CancellationTokenSource wait = CancellationTokenSource.CreateLinkedTokenSource(context.Token, _Context.Stopping))
                            {
                                try
                                {
                                    await signal.WaitAsync(_Options.EventPollMs * 4, wait.Token).ConfigureAwait(false);
                                }
                                catch (OperationCanceledException) when (_Context.IsDraining && !context.Token.IsCancellationRequested)
                                {
                                }
                            }
                        }
                    }
                }
            }
            finally
            {
                _Context.Activity.StreamClosed();
                StreamTelemetry.Closed("run_events");
            }
        }

        private async Task ChildrenAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            RunFilter filter = new RunFilter();
            filter.TenantId = run.TenantId;
            filter.ParentRunId = run.Id;
            filter.MaxResults = 1000;
            filter.Ordering = EnumerationOrderEnum.CreatedAscending;
            EnumerationResult<Run> children = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            await _Blocked.AnnotateManyAsync(children.Objects, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, children).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase context)
        {
            Run run = await RequireRunAsync(context).ConfigureAwait(false);
            if (!RunService.IsTerminal(run.Status)) throw new ConflictException("RunActive", "Only finished runs can be deleted. Cancel the run first.");
            await _Context.Database.Runs.DeleteAsync(run.Id, context.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(context).ConfigureAwait(false);
        }

        private async Task DeleteManyAsync(HttpContextBase context)
        {
            RunFilter filter = new RunFilter();
            filter.TenantId = RouteHelpers.Tenant(context);
            filter.Status = RouteHelpers.QueryEnum<RunStatusEnum>(context, "status");
            filter.AgentId = RouteHelpers.Query(context, "agentId");
            filter.ToUtc = RouteHelpers.QueryDate(context, "toUtc");
            filter.FromUtc = RouteHelpers.QueryDate(context, "fromUtc");
            filter.MaxResults = 1000;
            long deleted = 0;
            EnumerationResult<Run> page = await _Context.Database.Runs.EnumerateAsync(filter, context.Token).ConfigureAwait(false);
            foreach (Run run in page.Objects.Where(r => RunService.IsTerminal(r.Status)))
            {
                if (await _Context.Database.Runs.DeleteAsync(run.Id, context.Token).ConfigureAwait(false)) deleted++;
            }
            DeleteCountResponse response = new DeleteCountResponse();
            response.DeletedCount = deleted;
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task<Run> RequireRunAsync(HttpContextBase context)
        {
            string tenantId = RouteHelpers.Tenant(context);
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            return await _Context.Database.Runs.ReadAsync(tenantId, id, context.Token).ConfigureAwait(false) ?? throw new NotFoundException("Run " + id + " not found.");
        }

        private async Task<Agent> ResolveAgentAsync(string tenantId, string? agentId, string? agentName, HttpContextBase context)
        {
            return await _Invoker.ResolveAgentAsync(tenantId, String.IsNullOrEmpty(agentId) ? agentName : agentId, context.Token).ConfigureAwait(false);
        }

        private static void ApplyCaller(RequestContext ctx, RunCreateContext create)
        {
            if (ctx.PrincipalType == PrincipalTypeEnum.Run)
            {
                create.CallerType = ctx.OriginPrincipalType ?? PrincipalTypeEnum.User;
                create.CallerId = ctx.OriginPrincipalId;
                create.CallerName = ctx.PrincipalName;
                return;
            }
            create.CallerType = ctx.PrincipalType;
            create.CallerId = ctx.PrincipalId;
            create.CallerName = ctx.PrincipalName;
        }

        #endregion
    }
}
