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
    using WatsonWebserver.Core;

    /// <summary>
    /// Node and node pool administration. Nodes are platform infrastructure: reading needs Read on Node; changes need a
    /// system administrator.
    /// </summary>
    public class NodeRoutes
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
        public NodeRoutes(ServerContext context)
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
            routes.Scoped(HttpMethod.GET, "/v1.0/api/nodes", ResourceTypeEnum.Node, OperationTypeEnum.Read, ListAsync, "List worker nodes", "Nodes", null, typeof(EnumerationResult<Node>));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/nodes/{id}", ResourceTypeEnum.Node, OperationTypeEnum.Read, ReadAsync, "Read a worker node", "Nodes", null, typeof(Node));
            routes.Scoped(HttpMethod.PUT, "/v1.0/api/nodes/{id}", ResourceTypeEnum.Node, OperationTypeEnum.Update, UpdateAsync, "Change a node's capacity or pool", "Nodes", typeof(NodeUpdateRequest), typeof(Node));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/nodes/{id}/cordon", ResourceTypeEnum.Node, OperationTypeEnum.Update, CordonAsync, "Stop scheduling new runs on a node", "Nodes", null, typeof(Node));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/nodes/{id}/uncordon", ResourceTypeEnum.Node, OperationTypeEnum.Update, UncordonAsync, "Resume scheduling on a node", "Nodes", null, typeof(Node));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/nodes/{id}/drain", ResourceTypeEnum.Node, OperationTypeEnum.Update, DrainAsync, "Ask a node to finish its runs and stop", "Nodes", null, typeof(Node));
            routes.Scoped(HttpMethod.DELETE, "/v1.0/api/nodes/{id}", ResourceTypeEnum.Node, OperationTypeEnum.Delete, DeleteAsync, "Remove a lost or offline node", "Nodes");
            routes.Scoped(HttpMethod.GET, "/v1.0/api/node-pools", ResourceTypeEnum.Node, OperationTypeEnum.Read, ListPoolsAsync, "List node pools", "Node Pools", null, typeof(EnumerationResult<NodePool>));
            routes.Scoped(HttpMethod.POST, "/v1.0/api/node-pools", ResourceTypeEnum.NodePool, OperationTypeEnum.Create, CreatePoolAsync, "Create a node pool", "Node Pools", typeof(NodePool), typeof(NodePool));
            routes.Scoped(HttpMethod.GET, "/v1.0/api/node-pools/{id}", ResourceTypeEnum.Node, OperationTypeEnum.Read, ReadPoolAsync, "Read a node pool", "Node Pools", null, typeof(NodePool));
            routes.Scoped(HttpMethod.PUT, "/v1.0/api/node-pools/{id}", ResourceTypeEnum.NodePool, OperationTypeEnum.Update, UpdatePoolAsync, "Update a node pool", "Node Pools", typeof(NodePool), typeof(NodePool));
            routes.Scoped(HttpMethod.DELETE, "/v1.0/api/node-pools/{id}", ResourceTypeEnum.NodePool, OperationTypeEnum.Delete, DeletePoolAsync, "Delete an empty node pool", "Node Pools");
        }

        #endregion

        #region Private-Methods

        private async Task ListAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await _Context.Database.Nodes.EnumerateAsync(RouteHelpers.Enumeration(context), context.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task ReadAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await RequireAsync(context).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdateAsync(HttpContextBase context)
        {
            Node node = await RequireAsync(context).ConfigureAwait(false);
            NodeUpdateRequest request = RouteHelpers.RequiredBody<NodeUpdateRequest>(context);
            if (request.MaxConcurrentRuns.HasValue) node.MaxConcurrentRuns = request.MaxConcurrentRuns.Value;
            if (request.NodePoolId != null)
            {
                if (request.NodePoolId.Length > 0 && await _Context.Database.NodePools.ReadAsync(request.NodePoolId, context.Token).ConfigureAwait(false) == null) throw new NotFoundException("Node pool " + request.NodePoolId + " not found.");
                node.NodePoolId = request.NodePoolId.Length == 0 ? null : request.NodePoolId;
            }
            await _Context.Database.Nodes.UpdateAsync(node, context.Token).ConfigureAwait(false);
            await _Context.Audit.WriteAsync(RouteHelpers.Context(context), AuditEventTypeEnum.NodeStatusChanged, "Node", node.Id, "Node " + node.Name + " updated.", null, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, node).ConfigureAwait(false);
        }

        private Task CordonAsync(HttpContextBase context)
        {
            return SetStatusAsync(context, NodeStatusEnum.Cordoned);
        }

        private Task UncordonAsync(HttpContextBase context)
        {
            return SetStatusAsync(context, NodeStatusEnum.Ready);
        }

        private Task DrainAsync(HttpContextBase context)
        {
            return SetStatusAsync(context, NodeStatusEnum.Draining);
        }

        private async Task SetStatusAsync(HttpContextBase context, NodeStatusEnum status)
        {
            Node node = await RequireAsync(context).ConfigureAwait(false);
            await _Context.Database.Nodes.SetStatusAsync(node.Id, status, context.Token).ConfigureAwait(false);
            node.Status = status;
            await _Context.Audit.WriteAsync(RouteHelpers.Context(context), AuditEventTypeEnum.NodeStatusChanged, "Node", node.Id, "Node " + node.Name + " set to " + status + ".", null, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, node).ConfigureAwait(false);
        }

        private async Task DeleteAsync(HttpContextBase context)
        {
            Node node = await RequireAsync(context).ConfigureAwait(false);
            if (node.Status != NodeStatusEnum.Lost && node.Status != NodeStatusEnum.Offline) throw new ConflictException("NodeActive", "Only lost or offline nodes can be removed. Drain the node first.");
            List<Run> held = await _Context.Database.Runs.ListActiveByNodeAsync(node.Id, context.Token).ConfigureAwait(false);
            if (held.Any()) throw new ConflictException("NodeHasRuns", "Node " + node.Name + " still holds " + held.Count + " run leases; wait for them to expire.");
            await _Context.Database.Nodes.DeleteAsync(node.Id, context.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(context).ConfigureAwait(false);
        }

        private async Task ListPoolsAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await _Context.Database.NodePools.EnumerateAsync(RouteHelpers.Enumeration(context), context.Token).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task CreatePoolAsync(HttpContextBase context)
        {
            NodePool pool = RouteHelpers.RequiredBody<NodePool>(context);
            if (String.IsNullOrWhiteSpace(pool.Name)) throw new ValidationException("A node pool name is required.");
            if (await _Context.Database.NodePools.ReadByNameAsync(pool.Name, context.Token).ConfigureAwait(false) != null) throw new ConflictException("NameInUse", "A node pool named " + pool.Name + " already exists.");
            pool.Id = String.Empty;
            await _Context.Database.NodePools.CreateAsync(pool, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 201, pool).ConfigureAwait(false);
        }

        private async Task ReadPoolAsync(HttpContextBase context)
        {
            await RouteHelpers.JsonAsync(context, 200, await RequirePoolAsync(context).ConfigureAwait(false)).ConfigureAwait(false);
        }

        private async Task UpdatePoolAsync(HttpContextBase context)
        {
            NodePool existing = await RequirePoolAsync(context).ConfigureAwait(false);
            NodePool update = RouteHelpers.RequiredBody<NodePool>(context);
            existing.Name = String.IsNullOrWhiteSpace(update.Name) ? existing.Name : update.Name;
            existing.Description = update.Description;
            existing.DefaultExecutor = update.DefaultExecutor;
            existing.Tenants = update.Tenants;
            existing.Active = update.Active;
            await _Context.Database.NodePools.UpdateAsync(existing, context.Token).ConfigureAwait(false);
            await RouteHelpers.JsonAsync(context, 200, existing).ConfigureAwait(false);
        }

        private async Task DeletePoolAsync(HttpContextBase context)
        {
            NodePool pool = await RequirePoolAsync(context).ConfigureAwait(false);
            EnumerationQuery query = new EnumerationQuery();
            query.MaxResults = 1000;
            EnumerationResult<Node> nodes = await _Context.Database.Nodes.EnumerateAsync(query, context.Token).ConfigureAwait(false);
            if (nodes.Objects.Any(n => n.NodePoolId == pool.Id)) throw new ConflictException("PoolInUse", "Node pool " + pool.Name + " still has nodes.");
            await _Context.Database.NodePools.DeleteAsync(pool.Id, context.Token).ConfigureAwait(false);
            await RouteHelpers.NoContentAsync(context).ConfigureAwait(false);
        }

        private async Task<Node> RequireAsync(HttpContextBase context)
        {
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            return await _Context.Database.Nodes.ReadAsync(id, context.Token).ConfigureAwait(false) ?? await _Context.Database.Nodes.ReadByNameAsync(id, context.Token).ConfigureAwait(false) ?? throw new NotFoundException("Node " + id + " not found.");
        }

        private async Task<NodePool> RequirePoolAsync(HttpContextBase context)
        {
            string id = RouteHelpers.Param(context, "id") ?? String.Empty;
            return await _Context.Database.NodePools.ReadAsync(id, context.Token).ConfigureAwait(false) ?? throw new NotFoundException("Node pool " + id + " not found.");
        }

        #endregion
    }
}
