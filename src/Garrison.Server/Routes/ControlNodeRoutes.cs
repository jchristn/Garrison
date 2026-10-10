namespace Garrison.Server.Routes
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;
    using Garrison.Core.Services;
    using Garrison.Server.Runtime;
    using WatsonWebserver.Core;

    /// <summary>
    /// Control-plane replicas (control nodes, P10.19). Read-only: each replica maintains its own row. Reading needs Read
    /// on Node, the same permission as worker nodes. Responses carry <c>respondingNodeId</c>, and each record carries
    /// <c>isLeader</c> (and <c>leaderEpoch</c> for the leader) computed from the coordination lease.
    /// </summary>
    public class ControlNodeRoutes
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
        public ControlNodeRoutes(ServerContext context)
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
            routes.Scoped(HttpMethod.GET, "/v1.0/api/control-nodes", ResourceTypeEnum.Node, OperationTypeEnum.Read, ListAsync, "List control-plane replicas", "Control Nodes", null, typeof(ControlNodeListResponse));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/control-nodes/{id}", ResourceTypeEnum.Node, OperationTypeEnum.Read, ReadAsync, "Read a control-plane replica", "Control Nodes", null, typeof(ControlNode));
        }

        /// <summary>
        /// Set <see cref="ControlNode.IsLeader"/> and <see cref="ControlNode.LeaderEpoch"/> from the current leader lease.
        /// </summary>
        /// <param name="nodes">Records.</param>
        /// <param name="lease">Current unexpired leader lease, or null when no replica leads.</param>
        /// <exception cref="ArgumentNullException">Thrown when nodes is null.</exception>
        public static void AnnotateLeader(IEnumerable<ControlNode> nodes, CoordinationLease? lease)
        {
            if (nodes == null) throw new ArgumentNullException(nameof(nodes));
            string? leaderId = lease == null ? null : LeaderElectionService.NodeIdFromHolder(lease.Holder);
            foreach (ControlNode node in nodes)
            {
                node.IsLeader = leaderId != null && String.Equals(node.Id, leaderId, StringComparison.Ordinal);
                node.LeaderEpoch = node.IsLeader && lease != null ? lease.Epoch : null;
            }
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase context)
        {
            EnumerationResult<ControlNode> page = await _Context.Database.ControlNodes.EnumerateAsync(RouteHelpers.Enumeration(context), context.Token).ConfigureAwait(false);
            CoordinationLease? lease = await LeaderElectionService.ReadCurrentLeaseAsync(_Context.Database, context.Token).ConfigureAwait(false);
            AnnotateLeader(page.Objects, lease);
            await RouteHelpers.JsonAsync(context, 200, ControlNodeListResponse.From(page, _Context.NodeId)).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            ControlNode node = await _Context.Database.ControlNodes.ReadAsync(id, context.Token).ConfigureAwait(false) ?? throw new NotFoundException("Control node " + id + " not found.");
            CoordinationLease? lease = await LeaderElectionService.ReadCurrentLeaseAsync(_Context.Database, context.Token).ConfigureAwait(false);
            AnnotateLeader(new List<ControlNode> { node }, lease);
            node.RespondingNodeId = _Context.NodeId;
            await RouteHelpers.JsonAsync(context, 200, node).ConfigureAwait(false);
        }

        #endregion
    }
}
