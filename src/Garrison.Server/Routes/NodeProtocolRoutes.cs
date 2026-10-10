namespace Garrison.Server.Routes
{
    using System;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Worker node protocol (plan section 9.2). Callers need Execute on Node (the NodeAgent role).
    /// </summary>
    public class NodeProtocolRoutes
    {
        #region Private-Members

        private readonly ServerContext _Context;
        private readonly NodeService _Nodes;
        private readonly SchedulerService _Scheduler;
        private readonly RunEventService _Events;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="context">Server context.</param>
        /// <param name="nodes">Node service.</param>
        /// <param name="scheduler">Scheduler.</param>
        /// <param name="events">Run event service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public NodeProtocolRoutes(ServerContext context, NodeService nodes, SchedulerService scheduler, RunEventService events)
        {
            _Context = context ?? throw new ArgumentNullException(nameof(context));
            _Nodes = nodes ?? throw new ArgumentNullException(nameof(nodes));
            _Scheduler = scheduler ?? throw new ArgumentNullException(nameof(scheduler));
            _Events = events ?? throw new ArgumentNullException(nameof(events));
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
            const string tag = "Node Protocol";
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/register", ResourceTypeEnum.Node, OperationTypeEnum.Execute, RegisterAsync, "Register a worker node", tag, typeof(NodeRegisterRequest), typeof(NodeRegisterResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/heartbeat", ResourceTypeEnum.Node, OperationTypeEnum.Execute, HeartbeatAsync, "Worker heartbeat", tag, typeof(NodeHeartbeatRequest), typeof(NodeHeartbeatResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/lease", ResourceTypeEnum.Node, OperationTypeEnum.Execute, LeaseAsync, "Lease runs (long poll)", tag, typeof(NodeLeaseRequest), typeof(NodeLeaseResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/drain", ResourceTypeEnum.Node, OperationTypeEnum.Execute, DrainAsync, "Report that a worker is draining", tag, typeof(NodeHeartbeatRequest), typeof(NodeAckResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/started", ResourceTypeEnum.Node, OperationTypeEnum.Execute, StartedAsync, "Report a run started", tag, typeof(RunStartedRequest), typeof(NodeAckResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/events", ResourceTypeEnum.Node, OperationTypeEnum.Execute, EventsAsync, "Report run events", tag, typeof(RunEventsRequest), typeof(NodeAckResponse), "none");
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node/runs/{runId}/complete", ResourceTypeEnum.Node, OperationTypeEnum.Execute, CompleteAsync, "Report a run finished", tag, typeof(RunCompleteRequest), typeof(RunCompleteResponse), "none");
        }

        #endregion

        #region Private-Methods

        private async Task RegisterAsync(HttpContextBase context)
        {
            NodeRegisterRequest request = RouteHelpers.RequiredBody<NodeRegisterRequest>(context);
            NodeRegisterResponse response = await _Nodes.RegisterAsync(RouteHelpers.Context(context), request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task HeartbeatAsync(HttpContextBase context)
        {
            NodeHeartbeatRequest request = RouteHelpers.RequiredBody<NodeHeartbeatRequest>(context);
            Node node = await RequireNodeAsync(request.NodeId, context).ConfigureAwait(false);
            NodeHeartbeatResponse response = await _Nodes.HeartbeatAsync(node, request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task LeaseAsync(HttpContextBase context)
        {
            NodeLeaseRequest request = RouteHelpers.RequiredBody<NodeLeaseRequest>(context);
            Node node = await RequireNodeAsync(request.NodeId, context).ConfigureAwait(false);
            NodeLeaseResponse response = await _Scheduler.LeaseAsync(node, request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task DrainAsync(HttpContextBase context)
        {
            NodeHeartbeatRequest request = RouteHelpers.RequiredBody<NodeHeartbeatRequest>(context);
            Node node = await RequireNodeAsync(request.NodeId, context).ConfigureAwait(false);
            await _Context.Database.Nodes.SetStatusAsync(node.Id, request.ActiveRuns.Count == 0 ? NodeStatusEnum.Offline : NodeStatusEnum.Draining, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, new NodeAckResponse()).ConfigureAwait(false);
        }

        private async Task StartedAsync(HttpContextBase context)
        {
            RunStartedRequest request = RouteHelpers.RequiredBody<RunStartedRequest>(context);
            await _Events.StartedAsync(RouteHelpers.Param(context, "runId") ?? String.Empty, request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, new NodeAckResponse()).ConfigureAwait(false);
        }

        private async Task EventsAsync(HttpContextBase context)
        {
            RunEventsRequest request = RouteHelpers.RequiredBody<RunEventsRequest>(context);
            int inserted = await _Events.IngestAsync(RouteHelpers.Param(context, "runId") ?? String.Empty, request, context.Token).ConfigureAwait(false);
            NodeAckResponse ack = new NodeAckResponse();
            ack.Message = inserted + " inserted";
            await RouteHelpers.JsonAsync(context, 200, ack).ConfigureAwait(false);
        }

        private async Task CompleteAsync(HttpContextBase context)
        {
            RunCompleteRequest request = RouteHelpers.RequiredBody<RunCompleteRequest>(context);
            RunCompleteResponse response = await _Events.CompleteAsync(RouteHelpers.Param(context, "runId") ?? String.Empty, request, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, response).ConfigureAwait(false);
        }

        private async Task<Node> RequireNodeAsync(string nodeId, HttpContextBase context)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ValidationException("nodeId is required.");
            Node? node = await _Context.Database.Nodes.ReadAsync(nodeId, context.Token).ConfigureAwait(false);
            if (node == null) throw new NotFoundException("Node " + nodeId + " is not registered; register again.");
            RequestContext ctx = RouteHelpers.Context(context);
            if (!ctx.IsAdmin && !String.IsNullOrEmpty(node.CredentialId) && node.CredentialId != ctx.CredentialId)
            {
                throw new ConflictException("NodeIdentityMismatch", "Node " + node.Name + " is registered to a different credential.");
            }
            return node;
        }

        #endregion
    }
}
