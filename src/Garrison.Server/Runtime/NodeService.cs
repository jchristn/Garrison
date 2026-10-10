namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Security;
    using Garrison.Core.Services;

    /// <summary>
    /// Worker node registration and heartbeats. Thread-safe.
    /// </summary>
    public class NodeService
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RuntimeOptions _Options;
        private readonly AuditService _Audit;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="audit">Audit service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public NodeService(DatabaseDriverBase database, RuntimeOptions options, AuditService audit)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Register or re-register a node by name.
        /// </summary>
        /// <param name="ctx">Request context of the node principal.</param>
        /// <param name="request">Registration.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Registration response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ValidationException">Thrown when the name is missing.</exception>
        public async Task<NodeRegisterResponse> RegisterAsync(RequestContext ctx, NodeRegisterRequest request, CancellationToken token = default)
        {
            if (ctx == null) throw new ArgumentNullException(nameof(ctx));
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (String.IsNullOrWhiteSpace(request.Name)) throw new ValidationException("Node name is required.");

            string? poolId = null;
            if (!String.IsNullOrWhiteSpace(request.NodePool))
            {
                NodePool? pool = await _Database.NodePools.ReadByNameAsync(request.NodePool, token).ConfigureAwait(false);
                if (pool == null)
                {
                    pool = new NodePool();
                    pool.Name = request.NodePool;
                    pool.Description = "Created by node registration.";
                    await _Database.NodePools.CreateAsync(pool, token).ConfigureAwait(false);
                }
                poolId = pool.Id;
            }

            Node? node = await _Database.Nodes.ReadByNameAsync(request.Name, token).ConfigureAwait(false);
            bool create = node == null;
            if (node == null)
            {
                node = new Node();
                node.Name = request.Name;
            }

            node.NodePoolId = poolId;
            node.Address = request.Address;
            node.NodeVersion = request.Version;
            node.MaxConcurrentRuns = request.MaxConcurrentRuns;
            node.CredentialId = ctx.CredentialId;
            node.LastHeartbeatUtc = DateTime.UtcNow;
            node.RegisteredUtc = DateTime.UtcNow;
            node.ActiveRuns = 0;
            if (node.Status == NodeStatusEnum.Lost || node.Status == NodeStatusEnum.Offline || node.Status == NodeStatusEnum.Draining) node.Status = NodeStatusEnum.Ready;
            node.Labels = request.Labels.Select(l =>
            {
                NodeLabel label = new NodeLabel();
                label.Key = l.Key;
                label.Value = l.Value;
                return label;
            }).ToList();
            node.Capabilities = request.Capabilities.Select(c =>
            {
                NodeCapability capability = new NodeCapability();
                capability.HarnessType = c.HarnessType;
                capability.Executable = c.Executable;
                capability.DetectedVersion = c.Version;
                capability.Available = c.Available;
                capability.Detail = c.Detail;
                return capability;
            }).ToList();

            if (create) await _Database.Nodes.CreateAsync(node, token).ConfigureAwait(false);
            else await _Database.Nodes.UpdateAsync(node, token).ConfigureAwait(false);

            await _Audit.WriteAsync(ctx, AuditEventTypeEnum.NodeRegistered, "Node", node.Id, "Node " + node.Name + " registered with " + node.Capabilities.Count(c => c.Available) + " available harnesses.", null, token).ConfigureAwait(false);

            NodeRegisterResponse response = new NodeRegisterResponse();
            response.NodeId = node.Id;
            response.HeartbeatIntervalMs = _Options.HeartbeatIntervalMs;
            response.LeaseWaitMs = _Options.LeaseWaitMs;
            response.LeaseDurationMs = _Options.LeaseDurationMs;
            return response;
        }

        /// <summary>
        /// Process a heartbeat: extend held leases, report cancellations and lost leases.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="request">Heartbeat.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Heartbeat response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<NodeHeartbeatResponse> HeartbeatAsync(Node node, NodeHeartbeatRequest request, CancellationToken token = default)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (request == null) throw new ArgumentNullException(nameof(request));

            await _Database.Nodes.TouchHeartbeatAsync(node.Id, request.ActiveRuns.Count, token).ConfigureAwait(false);

            NodeHeartbeatResponse response = new NodeHeartbeatResponse();
            response.LeaseDurationMs = _Options.LeaseDurationMs;
            DateTime expires = DateTime.UtcNow.AddMilliseconds(_Options.LeaseDurationMs);
            foreach (NodeRunLease lease in request.ActiveRuns)
            {
                if (!await _Database.Runs.ExtendLeaseAsync(lease.RunId, node.Id, lease.Epoch, expires, token).ConfigureAwait(false))
                {
                    response.LostRunIds.Add(lease.RunId);
                }
            }

            List<Run> held = await _Database.Runs.ListActiveByNodeAsync(node.Id, token).ConfigureAwait(false);
            response.CancelRunIds = held.Where(r => r.CancelRequested || r.Status == RunStatusEnum.Cancelling).Select(r => r.Id).ToList();
            response.Drain = node.Status == NodeStatusEnum.Draining;
            return response;
        }

        #endregion
    }
}
