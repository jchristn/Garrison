namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Security;
    using Garrison.Core.Services;
    using Garrison.Core.Telemetry;

    /// <summary>
    /// Worker node registration and heartbeats. Thread-safe.
    /// </summary>
    public class NodeService
    {
        #region Public-Members

        /// <summary>
        /// Longest time a cancellation watch waits for a signal before it re-reads the database, in milliseconds.
        /// Minimum 250, maximum 60,000, default 5,000.
        /// </summary>
        public int WatchRecheckMs
        {
            get
            {
                return _WatchRecheckMs;
            }
            set
            {
                _WatchRecheckMs = Math.Clamp(value, 250, 60000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private readonly RuntimeOptions _Options;
        private readonly AuditService _Audit;
        private readonly RunSignals? _Signals;
        private int _WatchRecheckMs = 5000;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="audit">Audit service.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public NodeService(DatabaseDriverBase database, RuntimeOptions options, AuditService audit) : this(database, options, audit, null)
        {
        }

        /// <summary>
        /// Instantiate with run signals, so cancellation watches wake as soon as a held run is cancelled.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="audit">Audit service.</param>
        /// <param name="signals">Run signals; null makes cancellation watches poll the database once a second.</param>
        /// <exception cref="ArgumentNullException">Thrown when database, options, or audit is null.</exception>
        public NodeService(DatabaseDriverBase database, RuntimeOptions options, AuditService audit, RunSignals? signals)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Audit = audit ?? throw new ArgumentNullException(nameof(audit));
            _Signals = signals;
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
        /// <exception cref="InvalidOperationException">Thrown when a pool or node created concurrently cannot be read back.</exception>
        /// <exception cref="ConflictException">Thrown with code NodeIdentityMismatch when a node of that name is bound to another active credential.</exception>
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
                    NodePool created = new NodePool();
                    created.Name = request.NodePool;
                    created.Description = "Created by node registration.";
                    try
                    {
                        pool = await _Database.NodePools.CreateAsync(created, token).ConfigureAwait(false);
                    }
                    catch (Exception e) when (DatabaseFailures.IsUniqueViolation(e))
                    {
                        // Another worker registering at the same moment created the pool first (G-27): use theirs.
                        pool = await _Database.NodePools.ReadByNameAsync(request.NodePool, token).ConfigureAwait(false)
                            ?? throw new InvalidOperationException("Node pool " + request.NodePool + " was created concurrently but could not be read back.", e);
                    }
                }
                poolId = pool.Id;
            }

            Node? node = await _Database.Nodes.ReadByNameAsync(request.Name, token).ConfigureAwait(false);
            if (node != null) await EnsureBindableAsync(ctx, node, token).ConfigureAwait(false);
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
            node.ChildReserveSlots = request.ChildReserveSlots;
            node.MaxResidentWaiters = request.MaxResidentWaiters;
            node.CredentialId = ctx.CredentialId;
            node.SupportsMcpTests = request.SupportsMcpTests;
            node.Containerized = request.Containerized;
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
            if (request.ExecutorCapabilities == null) throw new ArgumentException("Executor capability reports cannot be null.");
            if (request.ExecutorCapabilities.Any(c => c == null || !Enum.IsDefined(c.Executor))) throw new ArgumentException("Unknown executor capability report.");
            if (request.ExecutorCapabilities.Select(c => c.Executor).Distinct().Count() != request.ExecutorCapabilities.Count) throw new ArgumentException("Report each executor only once.");
            foreach (ExecutorCapabilities capability in request.ExecutorCapabilities) ExecutorCapabilityRules.Validate(capability);
            node.ExecutorCapabilities = request.ExecutorCapabilities;
            node.Executors = request.Executors.Count == 0 ? new List<RunExecutorEnum> { RunExecutorEnum.Process } : request.Executors.Distinct().ToList();
            if (request.ExecutorCapabilities.Count > 0) node.Executors = request.ExecutorCapabilities.Select(c => c.Executor).ToList();
            if (!node.Executors.Contains(RunExecutorEnum.Process)) node.Executors.Insert(0, RunExecutorEnum.Process);
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

            if (create)
            {
                try
                {
                    await _Database.Nodes.CreateAsync(node, token).ConfigureAwait(false);
                }
                catch (Exception e) when (DatabaseFailures.IsUniqueViolation(e))
                {
                    // The same node registered twice at once (a retry racing the first attempt): update the row that won.
                    Node existing = await _Database.Nodes.ReadByNameAsync(request.Name, token).ConfigureAwait(false)
                        ?? throw new InvalidOperationException("Node " + request.Name + " was registered concurrently but could not be read back.", e);
                    await EnsureBindableAsync(ctx, existing, token).ConfigureAwait(false);
                    node.Id = existing.Id;
                    node.Status = existing.Status == NodeStatusEnum.Lost || existing.Status == NodeStatusEnum.Offline || existing.Status == NodeStatusEnum.Draining ? NodeStatusEnum.Ready : existing.Status;
                    node.CreatedUtc = existing.CreatedUtc;
                    await _Database.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
                }
            }
            else
            {
                await _Database.Nodes.UpdateAsync(node, token).ConfigureAwait(false);
            }
            GarrisonMetrics.Count(GarrisonMetricCatalog.NodeTransitions, "status", "Registered");

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
            GarrisonMetrics.Count(GarrisonMetricCatalog.NodeHeartbeats, "result", "ok");
            if (node.Status == NodeStatusEnum.Lost || node.Status == NodeStatusEnum.Offline) GarrisonMetrics.Count(GarrisonMetricCatalog.NodeTransitions, "status", NodeStatusEnum.Ready.ToString());

            NodeHeartbeatResponse response = new NodeHeartbeatResponse();
            response.LeaseDurationMs = _Options.LeaseDurationMs;
            DateTime expires = DateTime.UtcNow.AddMilliseconds(_Options.LeaseDurationMs);
            foreach (NodeRunLease lease in request.ActiveRuns)
            {
                if (!await _Database.Runs.ExtendLeaseAsync(lease.RunId, node.Id, lease.Epoch, expires, token).ConfigureAwait(false))
                {
                    response.LostRunIds.Add(lease.RunId);
                    GarrisonMetrics.Count(GarrisonMetricCatalog.LeaseRenewals, "result", "lost");
                }
                else
                {
                    GarrisonMetrics.Count(GarrisonMetricCatalog.LeaseRenewals, "result", "renewed");
                }
            }

            List<Run> held = await _Database.Runs.ListActiveByNodeAsync(node.Id, token).ConfigureAwait(false);
            response.CancelRunIds = held.Where(r => r.CancelRequested || r.Status == RunStatusEnum.Cancelling).Select(r => r.Id).ToList();
            response.Drain = node.Status == NodeStatusEnum.Draining;
            return response;
        }

        /// <summary>
        /// Cancellation watch (long poll): answer as soon as any watched run held by the node is cancelled, or with an
        /// empty list when the wait ends. Wakes on <see cref="RunSignals.NotifyNode"/> from any replica and re-reads the
        /// database at least every <see cref="WatchRecheckMs"/> in case a backplane message was lost.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="request">Watch request.</param>
        /// <param name="token">Cancellation token (the HTTP request).</param>
        /// <returns>Runs to cancel.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<NodeWatchResponse> WatchAsync(Node node, NodeWatchRequest request, CancellationToken token = default)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (request == null) throw new ArgumentNullException(nameof(request));

            NodeWatchResponse response = new NodeWatchResponse();
            HashSet<string> watched = new HashSet<string>(request.Runs.Where(r => !String.IsNullOrEmpty(r.RunId)).Select(r => r.RunId), StringComparer.Ordinal);
            if (watched.Count == 0) return response;
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(Math.Clamp(request.WaitMs, 0, 60000));

            HashSet<string> known = new HashSet<string>(request.KnownApprovals ?? new List<string>(), StringComparer.Ordinal);
            using (RunSignalSubscription? subscription = _Signals?.SubscribeNode(node.Id))
            {
                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    long version = subscription?.Signal.Version ?? 0;
                    List<Run> held = await _Database.Runs.ListActiveByNodeAsync(node.Id, token).ConfigureAwait(false);
                    response.CancelRunIds = held.Where(r => watched.Contains(r.Id) && (r.CancelRequested || r.Status == RunStatusEnum.Cancelling)).Select(r => r.Id).ToList();
                    if (request.RelayApprovals)
                    {
                        // Approvals of runs this node holds, in states the worker has not recorded (P12.3); the worker writes
                        // them into the run's event stream, since it is the only writer of a leased run's events.
                        List<string> heldWatched = held.Where(r => watched.Contains(r.Id)).Select(r => r.Id).ToList();
                        List<Approval> approvals = heldWatched.Count == 0 ? new List<Approval>() : await _Database.Approvals.ListByRunsAsync(heldWatched, 500, token).ConfigureAwait(false);
                        response.Approvals = approvals.Where(a => !known.Contains(NodeApprovalNotice.KeyOf(a.Id, a.Status))).Select(Notice).ToList();
                    }
                    if (response.CancelRunIds.Count > 0 || response.Approvals.Count > 0) return response;

                    int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                    if (remaining <= 0) return response;
                    int wait = Math.Min(remaining, subscription == null ? 1000 : WatchRecheckMs);
                    if (subscription != null) await subscription.Signal.WaitAsync(version, wait, token).ConfigureAwait(false);
                    else await Task.Delay(wait, token).ConfigureAwait(false);
                }
            }
        }

        #endregion

        #region Private-Methods

        private async Task EnsureBindableAsync(RequestContext ctx, Node existing, CancellationToken token)
        {
            // SR-16: a node name stays bound to the credential that registered it. Another credential may take it over only
            // when the bound credential is gone or deactivated (for example after the node credential was replaced).
            if (ctx.IsAdmin || String.IsNullOrEmpty(existing.CredentialId) || existing.CredentialId == ctx.CredentialId) return;
            Credential? bound = await _Database.Credentials.ReadAsync(existing.CredentialId, token).ConfigureAwait(false);
            if (bound == null || !bound.Active) return;
            throw new ConflictException("NodeIdentityMismatch", "Node " + existing.Name + " is registered to a different credential. Use that node's credential, pick another node name, or have an administrator delete the node.");
        }

        private static NodeApprovalNotice Notice(Approval approval)
        {
            NodeApprovalNotice notice = new NodeApprovalNotice();
            notice.RunId = approval.RunId;
            notice.ApprovalId = approval.Id;
            notice.Status = approval.Status;
            notice.Decision = approval.Decision;
            notice.DecisionSource = approval.DecisionSource;
            notice.ToolName = approval.ToolName;
            notice.Summary = approval.Summary;
            notice.RulePattern = approval.RulePattern;
            notice.DecidedBy = approval.DecidedBy;
            notice.Reason = approval.Reason;
            notice.ExpiresUtc = approval.ExpiresUtc;
            notice.RequestedUtc = approval.RequestedUtc;
            notice.DecidedUtc = approval.DecidedUtc;
            return notice;
        }

        #endregion
    }
}
