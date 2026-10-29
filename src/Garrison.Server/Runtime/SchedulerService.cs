namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Services;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using QoSKit;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Hands queued runs to worker nodes. Candidates are filtered by harness capability, node pool, tenant dedication,
    /// node labels, and deployment concurrency, then claimed with an atomic compare-and-set that increments the fencing
    /// epoch (plan section 9.3). Delegated runs are ordered ahead of new top-level work through a QoSKit priority queue
    /// (D-036), and a lease into a worker's child reserve only takes a run whose parent waits on it, while the node has
    /// an open reserve slot (P12.38). Claimed runs are compiled into execution specs; compile failures fail the run.
    /// Thread-safe.
    /// </summary>
    public class SchedulerService
    {
        /// <summary>Enable run tokens for optional agent memory independently of delegation. Default false.</summary>
        public bool AgentMemoryEnabled { get; set; } = false;

        #region Public-Members

        /// <summary>Revocable credential provider, or null when disabled.</summary>
        public CredentialBrokerService? CredentialBroker { get; set; } = null;

        /// <summary>Durable continuation coordinator; null disables portable restore.</summary>
        public ContinuationService? Continuations { get; set; } = null;

        /// <summary>Called with every compiled spec before it is leased, for example to add asset download URLs (AD2.4); null does nothing.</summary>
        public Func<Run, ExecutionSpec, CancellationToken, Task>? DecorateSpec { get; set; } = null;


        /// <summary>
        /// Cancelled when the replica starts shutting down; waiting lease long-polls then return empty at once so the
        /// worker re-polls another replica. Default <see cref="CancellationToken.None"/>.
        /// </summary>
        public CancellationToken ShutdownToken { get; set; } = CancellationToken.None;

        /// <summary>
        /// Activity counters that record lease long polls while they wait, or null (the default) to not count them.
        /// </summary>
        public ControlNodeActivity? Activity { get; set; } = null;

        /// <summary>
        /// Conversation service: conversation turns wait for their affinity node, and a turn claimed elsewhere falls back
        /// to a fresh session seeded with the transcript. Null claims conversation turns like any other run. Default
        /// null; the runtime module sets it.
        /// </summary>
        public ConversationService? Conversations { get; set; } = null;

        /// <summary>
        /// Pipeline service (P12.9). When set, a pipeline stage run is compiled with its pipeline inputs (earlier stage
        /// outputs, review notes, revision feedback) through the PipelineStage prompt role. Default null.
        /// </summary>
        public PipelineService? Pipelines { get; set; } = null;

        #endregion

        #region Private-Members

        private readonly TenantFairQueue _TenantFairQueue = new TenantFairQueue();

        private readonly DatabaseDriverBase _Database;
        private readonly Func<InvocationCompiler> _Compiler;
        private readonly AuthenticationService _Authentication;
        private readonly RunSignals _Signals;
        private readonly RuntimeOptions _Options;
        private readonly GarrisonTelemetry _Telemetry;
        private readonly LoggingModule _Logging;
        private readonly string _Header = "[Scheduler] ";

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="compiler">Compiler accessor (resolved lazily so module order does not matter).</param>
        /// <param name="authentication">Authentication service (mints run tokens).</param>
        /// <param name="signals">Run signals.</param>
        /// <param name="options">Runtime options.</param>
        /// <param name="telemetry">Telemetry.</param>
        /// <param name="logging">Logging.</param>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public SchedulerService(DatabaseDriverBase database, Func<InvocationCompiler> compiler, AuthenticationService authentication, RunSignals signals, RuntimeOptions options, GarrisonTelemetry telemetry, LoggingModule logging)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
            _Compiler = compiler ?? throw new ArgumentNullException(nameof(compiler));
            _Authentication = authentication ?? throw new ArgumentNullException(nameof(authentication));
            _Signals = signals ?? throw new ArgumentNullException(nameof(signals));
            _Options = options ?? throw new ArgumentNullException(nameof(options));
            _Telemetry = telemetry ?? throw new ArgumentNullException(nameof(telemetry));
            _Logging = logging ?? throw new ArgumentNullException(nameof(logging));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Lease up to maxRuns runs for a node, waiting up to waitMs when none are available.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="request">Lease request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Lease response.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public async Task<NodeLeaseResponse> LeaseAsync(Node node, NodeLeaseRequest request, CancellationToken token = default)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (request == null) throw new ArgumentNullException(nameof(request));

            NodeLeaseResponse response = new NodeLeaseResponse();
            if (node.Status != NodeStatusEnum.Ready || ShutdownToken.IsCancellationRequested) return response;

            DateTime? registration = node.RegisteredUtc;
            int maxRuns = Math.Clamp(request.MaxRuns, 1, 64);
            int waitMs = Math.Clamp(request.WaitMs, 0, Math.Min(60000, _Options.LeaseWaitMs));
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(waitMs);

            // Register before looking for work, so a run queued (on any replica) while this claim pass runs makes the
            // wait below return at once instead of being slept through (P10.24).
            LeaseWaiter waiter = _Signals.Waiters.Register(node.Id, node.NodePoolId, HarnessTypes(node), request.ChildReserve);
            ControlNodeActivity? activity = Activity;
            bool holding = false;
            long requestStart = Stopwatch.GetTimestamp();
            try
            {
                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    if (ShutdownToken.IsCancellationRequested) return response;
                    long claimStart = Stopwatch.GetTimestamp();
                    // A long poll holds the node snapshot read when its request arrived. Recheck before every claim,
                    // including after a queue wakeup: a lost, cordoned, deleted, or replaced registration cannot lease
                    // work through an old request (G-28). Use the current capabilities and placement for this pass.
                    Node? current = await ApplicationOperation.MeasureAsync("scheduler", "node_refresh", ct => _Database.Nodes.ReadAsync(node.Id, ct), token).ConfigureAwait(false);
                    if (current == null || !current.Active || current.Status != NodeStatusEnum.Ready || current.RegisteredUtc != registration) return response;
                    node = current;
                    _Signals.Waiters.Update(waiter, node.NodePoolId, HarnessTypes(node));
                    int wanted = maxRuns - response.Assignments.Count;
                    if (request.ChildReserve) wanted = Math.Min(wanted, await OpenReserveSlotsAsync(node, request.ReserveRunIds, token).ConfigureAwait(false) - response.Assignments.Count);
                    List<RunAssignment> claimed = wanted > 0 ? await ClaimAsync(node, wanted, request.ChildReserve, token).ConfigureAwait(false) : new List<RunAssignment>();
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.ClaimDuration, GarrisonMetrics.SecondsSince(claimStart), "result", claimed.Count > 0 ? "assigned" : "empty");
                    response.Assignments.AddRange(claimed);

                    // The notice that woke this pass is handed on when its run was not taken here and is still queued.
                    QueueNotice? notice = _Signals.Waiters.TakeCurrent(waiter);
                    if (notice != null) await HandOnAsync(notice, waiter, claimed, token).ConfigureAwait(false);

                    if (!request.ChildReserve && node.ExecutorCapabilities.Any(c => c.WarmStart)) response.QueuedKubernetesRuns = await WarmQueueDepthAsync(node, token).ConfigureAwait(false);
                    if (response.Assignments.Count > 0) return response;

                    int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                    if (remaining <= 0) return response;
                    if (!holding && activity != null)
                    {
                        // Counted only once the request actually waits (reported in the control node heartbeat).
                        activity.LongPollStarted();
                        holding = true;
                    }
                    using (CancellationTokenSource wait = CancellationTokenSource.CreateLinkedTokenSource(token, ShutdownToken))
                    {
                        try
                        {
                            LeaseWakeEnum woke = await _Signals.Waiters.WaitAsync(waiter, Math.Min(remaining, _Options.LeasePollMs), wait.Token).ConfigureAwait(false);
                            GarrisonMetrics.Count(GarrisonMetricCatalog.QueueWakeups, "source", WakeSource(woke));
                        }
                        catch (OperationCanceledException) when (ShutdownToken.IsCancellationRequested && !token.IsCancellationRequested)
                        {
                            return response;
                        }
                    }
                }
            }
            finally
            {
                // A notice this poll was handed and did not handle goes to the next matching poll.
                _Signals.Waiters.Unregister(waiter);
                if (holding && activity != null) activity.LongPollEnded();
                string leaseResult = response.Assignments.Count > 0 ? "assigned" : "empty";
                GarrisonMetrics.Count(GarrisonMetricCatalog.LeaseRequests, "result", leaseResult);
                GarrisonMetrics.Observe(GarrisonMetricCatalog.LeaseWait, GarrisonMetrics.SecondsSince(requestStart), "result", leaseResult);
            }
        }

        /// <summary>
        /// Why a claimed run must not start, or null when it may: its tenant, agent, or deployment was deactivated or
        /// deleted after the run was queued.
        /// </summary>
        /// <param name="tenant">Tenant, or null when deleted.</param>
        /// <param name="agent">Agent, or null when deleted.</param>
        /// <param name="deployment">Deployment, or null when deleted.</param>
        /// <param name="run">Run.</param>
        /// <returns>Reason, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static string? AdmissionRejection(Tenant? tenant, Agent? agent, Deployment? deployment, Run run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (tenant == null || !tenant.Active) return "Tenant " + run.TenantId + " is inactive or was deleted after the run was queued, so the run was rejected before it started.";
            if (agent == null) return "Agent " + run.AgentName + " was deleted after the run was queued, so the run was rejected before it started.";
            if (!agent.Active) return "Agent " + agent.Name + " was deactivated after the run was queued, so the run was rejected before it started.";
            if (run.Executor == RunExecutorEnum.RemoteA2A || run.Executor == RunExecutorEnum.RemoteMcp)
            {
                if (agent.Kind != AgentKindEnum.Remote) return "Remote agent registration changed to a hosted agent after admission.";
                if (RemoteAgentPolicy.Expired(agent, DateTime.UtcNow)) return "RemoteRegistrationExpired: remote agent must renew its registration before dispatch.";
                return null;
            }
            if (deployment == null) return "Deployment " + run.DeploymentId + " was deleted after the run was queued, so the run was rejected before it started.";
            if (!deployment.Active) return "Deployment " + deployment.Name + " was deactivated after the run was queued, so the run was rejected before it started.";
            return null;
        }

        #endregion

        #region Private-Methods

        private static List<HarnessTypeEnum> HarnessTypes(Node node)
        {
            return node.Capabilities.Where(c => c.Available).Select(c => c.HarnessType).Distinct().ToList();
        }

        private static string WakeSource(LeaseWakeEnum woke)
        {
            switch (woke)
            {
                case LeaseWakeEnum.Notify:
                    return "notify";
                case LeaseWakeEnum.Handoff:
                    return "handoff";
                case LeaseWakeEnum.Pending:
                    return "pending";
                case LeaseWakeEnum.Broadcast:
                    return "broadcast";
                default:
                    return "poll";
            }
        }

        private async Task HandOnAsync(QueueNotice notice, LeaseWaiter waiter, List<RunAssignment> claimed, CancellationToken token)
        {
            // Hand the notice on unless this pass took the run or the run is no longer queued. When the check cannot be
            // made (the request was cancelled, or the read failed), hand it on anyway: an extra wakeup is cheap, a lost
            // one leaves the run waiting for the fallback poll.
            if (claimed.Any(a => String.Equals(a.RunId, notice.RunId, StringComparison.Ordinal))) return;
            bool handOn = true;
            try
            {
                Run? run = await _Database.Runs.ReadAsync(notice.RunId, token).ConfigureAwait(false);
                handOn = run != null && run.Status == RunStatusEnum.Queued;
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                _Logging.Debug(_Header + "could not check run " + notice.RunId + " before handing its queue notice on: " + e.Message);
            }
            finally
            {
                if (handOn) _Signals.Waiters.Redeliver(notice, waiter);
            }
        }

        private async Task<int> WarmQueueDepthAsync(Node node, CancellationToken token)
        {
            NodePool? pool = String.IsNullOrEmpty(node.NodePoolId) ? null : await _Database.NodePools.ReadAsync(node.NodePoolId, token).ConfigureAwait(false);
            ClaimCandidateFilter filter = new ClaimCandidateFilter
            {
                HarnessTypes = node.Capabilities.Where(c => c.Available).Select(c => c.HarnessType).Distinct().ToList(),
                NodePoolId = node.NodePoolId,
                Executors = new List<RunExecutorEnum> { RunExecutorEnum.KubernetesJob },
                ExecutorCapabilities = ExecutorCapabilityRules.Of(node).Where(c => c.Executor == RunExecutorEnum.KubernetesJob).ToList(),
                AllowedTenantIds = pool != null && pool.Tenants.Count > 0 ? pool.Tenants : null,
                Limit = 64
            };
            List<Run> queued = await ApplicationOperation.MeasureAsync("scheduler", "candidate_query", ct => _Database.Runs.ListClaimCandidatesAsync(filter, ct), token).ConfigureAwait(false);
            return queued.Count(r => PlacementRules.MatchesPlacement(node, pool, r));
        }

        private async Task<int> OpenReserveSlotsAsync(Node node, List<string> reserveRunIds, CancellationToken token)
        {
            // One reserve slot opens for each run on the node waiting on a child, up to the node's ChildReserveSlots, less
            // the reserve runs the worker still has. Re-read on every pass: a long poll outlives the runs it was sent with.
            if (node.ChildReserveSlots <= 0) return 0;
            long waiting = await _Database.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false);
            int open = DelegationCapacity.OpenReserveSlots(node, waiting);
            if (open <= 0) return 0;
            int active = 0;
            foreach (string runId in reserveRunIds.Where(id => !String.IsNullOrEmpty(id)).Distinct(StringComparer.Ordinal).Take(64))
            {
                Run? run = await _Database.Runs.ReadAsync(runId, token).ConfigureAwait(false);
                if (run != null && run.LeaseNodeId == node.Id && !RunService.IsTerminal(run.Status)) active++;
            }
            return Math.Max(0, open - active);
        }

        private static ClaimCandidateFilter CandidateFilter(Node node, NodePool? pool, List<HarnessTypeEnum> harnessTypes, int limit)
        {
            ClaimCandidateFilter filter = new ClaimCandidateFilter();
            filter.HarnessTypes = harnessTypes;
            filter.NodePoolId = node.NodePoolId;
            filter.Executors = RunExecutors.Of(node);
            filter.ExecutorCapabilities = ExecutorCapabilityRules.Of(node);
            filter.AllowedTenantIds = pool != null && pool.Tenants.Count > 0 ? pool.Tenants : null;
            filter.Limit = limit;
            return filter;
        }

        private static List<Run> DelegatedFirst(List<Run> window, List<Run> delegated)
        {
            // D-036: delegated children are classified ahead of new top-level work. The database orders each window by
            // priority and age; QoSKit's strict priority bands keep that order within a band.
            Dictionary<string, Run> merged = new Dictionary<string, Run>(StringComparer.Ordinal);
            foreach (Run run in window.Concat(delegated)) merged.TryAdd(run.Id, run);
            List<Run> ordered = new List<Run>();
            QoSQueueOptions options = new QoSQueueOptions();
            options.Name = "garrison-claim-window";
            options.EnableMetrics = false;
            options.EnableTracing = false;
            using (PriorityQoSQueue<Run> queue = new PriorityQoSQueue<Run>(2, r => r.Kind == RunKindEnum.Delegated ? 0 : 1, options))
            {
                foreach (Run run in merged.Values.OrderByDescending(r => r.Priority).ThenBy(r => r.CreatedUtc)) queue.Enqueue(run);
                while (queue.TryDequeue(out Run next)) ordered.Add(next);
            }
            return ordered;
        }

        private async Task<List<string>> AncestorsAsync(Run run, Dictionary<string, string?> parents, CancellationToken token)
        {
            List<string> ancestors = new List<string>();
            string? current = run.ParentRunId;
            while (!String.IsNullOrEmpty(current) && ancestors.Count < 64 && !ancestors.Contains(current))
            {
                ancestors.Add(current);
                if (!parents.TryGetValue(current, out string? parent))
                {
                    Run? read = await _Database.Runs.ReadAsync(run.TenantId, current, token).ConfigureAwait(false);
                    parent = read?.ParentRunId;
                    parents[current] = parent;
                }
                current = parent;
            }
            return ancestors;
        }

        private async Task<List<RunAssignment>> ClaimAsync(Node node, int maxRuns, bool childReserve, CancellationToken token)
        {
            List<RunAssignment> assignments = new List<RunAssignment>();
            List<HarnessTypeEnum> harnessTypes = HarnessTypes(node);
            if (harnessTypes.Count == 0 || maxRuns <= 0) return assignments;

            // Pool and tenant dedication are applied in SQL, so a dedicated node is never starved by a backlog of runs it
            // may not take (P10.16); label requirements are checked below.
            NodePool? pool = String.IsNullOrEmpty(node.NodePoolId) ? null : await _Database.NodePools.ReadAsync(node.NodePoolId, token).ConfigureAwait(false);
            int limit = Math.Max(maxRuns * 4, 16);
            ClaimCandidateFilter filter = CandidateFilter(node, pool, harnessTypes, limit);
            // The child reserve (P12.38) only takes runs whose parent is waiting on them.
            filter.WaitedChildrenOnly = childReserve;
            filter.TenantFairWindow = true;
            List<Run> candidates = await ApplicationOperation.MeasureAsync("scheduler", "candidate_query", ct => _Database.Runs.ListClaimCandidatesAsync(filter, ct), token).ConfigureAwait(false);
            if (!childReserve)
            {
                // Delegated runs come first even when a backlog of older top-level runs fills the window.
                ClaimCandidateFilter delegatedFilter = CandidateFilter(node, pool, harnessTypes, limit);
                delegatedFilter.DelegatedOnly = true;
                delegatedFilter.TenantFairWindow = true;
                List<Run> delegated = await ApplicationOperation.MeasureAsync("scheduler", "delegated_candidate_query", ct => _Database.Runs.ListClaimCandidatesAsync(delegatedFilter, ct), token).ConfigureAwait(false);
                candidates = DelegatedFirst(candidates, delegated);
            }
            if (candidates.Count == 0) return assignments;
            Dictionary<string, int> tenantWeights = new Dictionary<string, int>(StringComparer.Ordinal);
            foreach (string tenantId in candidates.Select(r => r.TenantId).Distinct(StringComparer.Ordinal))
            {
                Tenant? tenant = await ApplicationOperation.MeasureAsync("scheduler", "tenant_weight", ct => _Database.Tenants.ReadAsync(tenantId, ct), token).ConfigureAwait(false);
                tenantWeights[tenantId] = tenant?.SchedulingWeight ?? 1;
            }
            // Child priority is retained; each band is fair across tenants.
            candidates = _TenantFairQueue.Order(candidates.Where(r => r.Kind == RunKindEnum.Delegated).ToList(), tenantWeights)
                .Concat(_TenantFairQueue.Order(candidates.Where(r => r.Kind != RunKindEnum.Delegated).ToList(), tenantWeights)).ToList();

            Dictionary<string, long> activeByDeployment = new Dictionary<string, long>(StringComparer.Ordinal);
            Dictionary<string, Deployment?> deployments = new Dictionary<string, Deployment?>(StringComparer.Ordinal);
            Dictionary<string, Node?> affinityNodes = new Dictionary<string, Node?>(StringComparer.Ordinal);
            Dictionary<string, string?> parents = new Dictionary<string, string?>(StringComparer.Ordinal);
            DateTime now = DateTime.UtcNow;

            foreach (Run candidate in candidates)
            {
                if (assignments.Count >= maxRuns) break;
                if (!PlacementRules.Supports(node, candidate.HarnessType) || !PlacementRules.MatchesPlacement(node, pool, candidate) || !ExecutorCapabilityRules.Supports(node, candidate)) continue;

                // A conversation turn that resumes a harness session waits (bounded) for the node holding the session
                // (P12.1); other nodes take it once that node is not Ready or the wait is over, as a fallback.
                if (Conversations != null && !String.IsNullOrEmpty(candidate.AffinityNodeId) && candidate.AffinityNodeId != node.Id)
                {
                    if (!affinityNodes.TryGetValue(candidate.AffinityNodeId, out Node? affinityNode))
                    {
                        affinityNode = await _Database.Nodes.ReadAsync(candidate.AffinityNodeId, token).ConfigureAwait(false);
                        affinityNodes[candidate.AffinityNodeId] = affinityNode;
                    }
                    if (ConversationService.DefersToAffinityNode(candidate, node, affinityNode, now))
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "affinity", "harness", candidate.HarnessType.ToString());
                        continue;
                    }
                }

                if (!deployments.TryGetValue(candidate.DeploymentId, out Deployment? deployment))
                {
                    deployment = await _Database.Deployments.ReadAsync(candidate.DeploymentId, token).ConfigureAwait(false);
                    deployments[candidate.DeploymentId] = deployment;
                }
                int deploymentLimit = deployment != null ? deployment.MaxConcurrentRuns : 0;
                // A delegated run's ancestors that wait on a descendant are left out of its deployment's count (P12.38),
                // so a parent and child in the same deployment cannot deadlock on maxConcurrentRuns.
                List<string> ancestors = deploymentLimit > 0 ? await AncestorsAsync(candidate, parents, token).ConfigureAwait(false) : new List<string>();
                if (deploymentLimit > 0)
                {
                    // A cheap pre-check skips deployments that are visibly full; the claim below enforces the limit
                    // exactly, across replicas (G-6).
                    long active;
                    if (ancestors.Count > 0)
                    {
                        active = await _Database.Runs.CountActiveByDeploymentAsync(candidate.DeploymentId, ancestors, token).ConfigureAwait(false);
                    }
                    else if (!activeByDeployment.TryGetValue(candidate.DeploymentId, out active))
                    {
                        active = await _Database.Runs.CountActiveByDeploymentAsync(candidate.DeploymentId, token).ConfigureAwait(false);
                        activeByDeployment[candidate.DeploymentId] = active;
                    }
                    if (active >= deploymentLimit)
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "limit", "harness", candidate.HarnessType.ToString());
                        continue;
                    }
                }

                // The claim and compile spans join the run's trace (recorded at creation), not the lease request's.
                using (Activity? claim = RunTracing.Start("run:claim", candidate.TraceParent))
                {
                    claim?.SetTag("garrison.run_id", candidate.Id);
                    claim?.SetTag("garrison.node", node.Name);
                    claim?.SetTag("garrison.harness", candidate.HarnessType.ToString());

                    Stopwatch timer = Stopwatch.StartNew();
                    DateTime leaseExpires = DateTime.UtcNow.AddMilliseconds(_Options.LeaseDurationMs);
                    ClaimResult result = await ApplicationOperation.MeasureAsync("scheduler", "claim", ct => RunDatabaseTelemetry.MeasureAsync(_Database, candidate.TenantId, candidate.Id, "claim", dbToken => _Database.Runs.TryClaimWithinLimitAsync(candidate.Id, node.Id, node.Name, leaseExpires, candidate.DeploymentId, deploymentLimit, ancestors, dbToken), ct), token).ConfigureAwait(false);
                    if (result.QuotaId != null)
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "quota", "harness", candidate.HarnessType.ToString());
                        claim?.SetTag("garrison.claim_result", "quota");
                        continue;
                    }
                    if (result.LimitReached)
                    {
                        if (ancestors.Count == 0) activeByDeployment[candidate.DeploymentId] = deploymentLimit;
                        GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "limit", "harness", candidate.HarnessType.ToString());
                        claim?.SetTag("garrison.claim_result", "limit");
                        continue;
                    }
                    if (!result.Claimed)
                    {
                        GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "lost", "harness", candidate.HarnessType.ToString());
                        claim?.SetTag("garrison.claim_result", "lost");
                        continue;
                    }
                    _TenantFairQueue.Claimed(candidate.TenantId, tenantWeights[candidate.TenantId], candidates.Select(r => r.TenantId));
                    long epoch = result.Epoch ?? 0;
                    double claimSeconds = timer.Elapsed.TotalSeconds;
                    if (deploymentLimit > 0 && activeByDeployment.TryGetValue(candidate.DeploymentId, out long counted)) activeByDeployment[candidate.DeploymentId] = counted + 1;
                    GarrisonMetrics.Count(GarrisonMetricCatalog.Claims, "result", "won", "harness", candidate.HarnessType.ToString());
                    claim?.SetTag("garrison.claim_result", "won");
                    claim?.SetTag("garrison.agent", candidate.AgentName);
                    claim?.SetTag("garrison.tenant", candidate.TenantId);
                    if (deployment != null) RunTelemetry.Remember(deployment.Id, deployment.Name);
                    _Logging.Info(_Header + "run " + candidate.Id + " leased to " + node.Name + " (epoch " + epoch + (childReserve ? ", child reserve" : String.Empty) + ") " + RunTracing.LogFields(candidate.Id, candidate.TraceId)
                        + " " + GarrisonTracing.LogFields("tenant", candidate.TenantId, "agent", candidate.AgentName, "deployment", deployment?.Name, "node", node.Name));

                    RunAssignment? assignment = await ApplicationOperation.MeasureAsync("scheduler", "compile", ct => RunDatabaseTelemetry.MeasureAsync(_Database, candidate.TenantId, candidate.Id, "compile", dbToken => PrepareAsync(candidate.TenantId, candidate.Id, node, epoch, leaseExpires, claim, dbToken), ct), token).ConfigureAwait(false);
                    GarrisonMetrics.Observe(GarrisonMetricCatalog.CompileDuration, Math.Max(0, timer.Elapsed.TotalSeconds - claimSeconds), "harness", candidate.HarnessType.ToString(), "agent", candidate.AgentName, "result", assignment != null ? "ok" : "failed");
                    if (assignment != null)
                    {
                        RunMetricLabels claimLabels = RunMetricLabels.For(candidate, deployment?.Name);
                        GarrisonMetrics.Observe(GarrisonMetricCatalog.RunStageDuration, claimSeconds, GarrisonMetrics.RunTags(claimLabels, "stage", "claim"));
                        GarrisonMetrics.Observe(GarrisonMetricCatalog.RunStageDuration, Math.Max(0, timer.Elapsed.TotalSeconds - claimSeconds), GarrisonMetrics.RunTags(claimLabels, "stage", "compile"));
                    }
                    if (assignment != null) assignments.Add(assignment);
                    else claim?.SetStatus(ActivityStatusCode.Error, "compile failed");
                }
            }

            return assignments;
        }

        private async Task<RunAssignment?> PrepareAsync(string tenantId, string runId, Node node, long epoch, DateTime leaseExpires, Activity? claim, CancellationToken token)
        {
            Run? run = await _Database.Runs.ReadAsync(tenantId, runId, token).ConfigureAwait(false);
            if (run == null) return null;

            try
            {
                Agent? agent = await _Database.Agents.ReadAsync(tenantId, run.AgentId, token).ConfigureAwait(false);
                Deployment? deployment = await _Database.Deployments.ReadAsync(tenantId, run.DeploymentId, token).ConfigureAwait(false);

                // Admission at start (G-5): a run accepted while its tenant, agent, and deployment were active is
                // rejected, not started, when one of them was deactivated or deleted while it waited in the queue.
                Tenant? tenant = await ApplicationOperation.MeasureAsync("scheduler", "tenant_weight", ct => _Database.Tenants.ReadAsync(tenantId, ct), token).ConfigureAwait(false);
                string? rejection = AdmissionRejection(tenant, agent, deployment, run);
                if (rejection != null)
                {
                    await RejectAsync(run, node, epoch, rejection, token).ConfigureAwait(false);
                    claim?.SetStatus(ActivityStatusCode.Error, "rejected");
                    return null;
                }
                HarnessProfile? profile = deployment == null ? null : await _Database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
                int timeoutSeconds = InvocationCompiler.EffectiveTimeoutSeconds(deployment, profile, run.Parameters, 1800, _Options.MaxRunSeconds);
                DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds + _Options.DeadlineGraceSeconds);

                string? runToken = null;
                if (agent != null && (AgentMemoryEnabled || agent.DelegationMode != DelegationModeEnum.None || (deployment != null && (deployment.ManagementAccess == ManagementAccessEnum.Drafts || deployment.ApprovalsEnabled || deployment.SuspensionEnabled || deployment.ArtifactGlobs.Count > 0 || (!String.IsNullOrEmpty(deployment.WorkspaceTemplateId) && !String.IsNullOrEmpty(deployment.ArtifactStoreId))))))
                {
                    runToken = await _Authentication.IssueForRunAsync(run, epoch, deadline, token).ConfigureAwait(false);
                }

                // A conversation turn claimed away from its affinity node starts a fresh session from the transcript.
                CompilationConversation? transcript = null;
                if (Conversations != null && !String.IsNullOrEmpty(run.ConversationId))
                {
                    await Conversations.ApplyClaimFallbackAsync(run, node, epoch, token).ConfigureAwait(false);
                    transcript = await Conversations.TranscriptAsync(run, token).ConfigureAwait(false);
                }

                // A pipeline stage run hands the earlier stages' outputs to its PipelineStage prompt (P12.9).
                CompilationPipeline? pipeline = Pipelines != null && !String.IsNullOrEmpty(run.PipelineRunId) ? await Pipelines.CompilationInputsAsync(run, token).ConfigureAwait(false) : null;

                if (Continuations != null) await Continuations.PrepareAsync(run, token).ConfigureAwait(false);
                CompilationResult compiled;
                using (Activity? compile = RunTracing.Start("run:compile", claim?.Id ?? run.TraceParent))
                {
                    compile?.SetTag("garrison.run_id", run.Id);
                    if (!String.IsNullOrEmpty(run.ConversationId)) compile?.SetTag("garrison.conversation_id", run.ConversationId);
                    if (pipeline != null) compile?.SetTag("garrison.pipeline_run_id", run.PipelineRunId);
                    compiled = await _Compiler().CompileAsync(run, runToken, transcript, pipeline, node, token).ConfigureAwait(false);
                }

                if (Continuations != null) await Continuations.ApplyAsync(run, compiled.Spec, token).ConfigureAwait(false);
                if (DecorateSpec != null) await DecorateSpec(run, compiled.Spec, token).ConfigureAwait(false);

                // A compile that waited on a credential refresh (G-22) may have used up part of the lease; give the
                // worker a full lease from now so the run is not reclaimed before its first heartbeat.
                if (DateTime.UtcNow > leaseExpires.AddMilliseconds(-_Options.LeaseDurationMs * 0.75))
                {
                    DateTime renewed = DateTime.UtcNow.AddMilliseconds(_Options.LeaseDurationMs);
                    if (await _Database.Runs.ExtendLeaseAsync(run.Id, node.Id, epoch, renewed, token).ConfigureAwait(false)) leaseExpires = renewed;
                }

                // The worker parents its harness span on this, so the whole run shares one trace.
                compiled.Spec.TraceParent = claim?.Id ?? run.TraceParent ?? compiled.Spec.TraceParent;
                compiled.Spec.TimeoutSeconds = Math.Min(compiled.Spec.TimeoutSeconds > 0 ? compiled.Spec.TimeoutSeconds : timeoutSeconds, _Options.MaxRunSeconds);

                RunTransition deadlineUpdate = new RunTransition();
                deadlineUpdate.RunId = run.Id;
                deadlineUpdate.FromStatuses.Add(RunStatusEnum.Leased);
                deadlineUpdate.ToStatus = RunStatusEnum.Leased;
                deadlineUpdate.Epoch = epoch;
                deadlineUpdate.NodeId = node.Id;
                deadlineUpdate.DeadlineUtc = DateTime.UtcNow.AddSeconds(compiled.Spec.TimeoutSeconds + _Options.DeadlineGraceSeconds);
                await _Database.Runs.TransitionAsync(deadlineUpdate, token).ConfigureAwait(false);

                if (compiled.TemplateVersions.Count > 0)
                {
                    run.TemplateVersions = compiled.TemplateVersions;
                    await _Database.Runs.ReplaceTemplateVersionsAsync(run, token).ConfigureAwait(false);
                }

                RunAssignment assignment = new RunAssignment();
                assignment.RunId = run.Id;
                assignment.Epoch = epoch;
                assignment.LeaseExpiresUtc = leaseExpires;
                assignment.EventSequenceStart = run.LastEventSequence;
                assignment.Spec = compiled.Spec;
                _Signals.Notify(run.Id);
                return assignment;
            }
            catch (CompilationException e)
            {
                _Logging.Warn(_Header + "run " + run.Id + " failed to compile: " + e.Code + " " + e.Message + " " + RunTracing.LogFields(run.Id, run.TraceId));
                RunTransition failed = new RunTransition();
                failed.RunId = run.Id;
                failed.FromStatuses.Add(RunStatusEnum.Leased);
                failed.ToStatus = RunStatusEnum.Failed;
                failed.Epoch = epoch;
                failed.NodeId = node.Id;
                // A bound login that needs reauthentication, or that could not be refreshed, is a credential problem,
                // not a configuration one (G-22).
                failed.Outcome = e is CredentialUnavailableException ? RunOutcomeEnum.NotCredentialed : RunOutcomeEnum.CompileFailed;
                failed.ErrorMessage = e.Code + ": " + e.Message;
                failed.ClearLease = true;
                failed.SetCompleted = true;
                await _Database.Runs.TransitionAsync(failed, token).ConfigureAwait(false);
                await _Database.Sessions.RevokeByRunAsync(run.Id, "Run failed to compile.", token).ConfigureAwait(false);
                if (CredentialBroker != null) await CredentialBroker.RevokeRunAsync(run.TenantId, run.Id, epoch, token).ConfigureAwait(false);
                _Signals.Complete(run.Id);
                run.Status = failed.ToStatus;
                run.Outcome = failed.Outcome ?? RunOutcomeEnum.CompileFailed;
                run.CompletedUtc = DateTime.UtcNow;
                await RunTelemetry.FinishedAsync(_Database, run, token).ConfigureAwait(false);
                return null;
            }
        }

        private async Task RejectAsync(Run run, Node node, long epoch, string reason, CancellationToken token)
        {
            _Logging.Info(_Header + "run " + run.Id + " rejected: " + reason + " " + RunTracing.LogFields(run.Id, run.TraceId));
            RunTransition rejected = new RunTransition();
            rejected.RunId = run.Id;
            rejected.FromStatuses.Add(RunStatusEnum.Leased);
            rejected.ToStatus = RunStatusEnum.Rejected;
            rejected.Epoch = epoch;
            rejected.NodeId = node.Id;
            rejected.Outcome = RunOutcomeEnum.Rejected;
            rejected.ErrorMessage = reason;
            rejected.ClearLease = true;
            rejected.SetCompleted = true;
            await _Database.Runs.TransitionAsync(rejected, token).ConfigureAwait(false);
            await _Database.Sessions.RevokeByRunAsync(run.Id, "Run rejected.", token).ConfigureAwait(false);
            _Signals.Complete(run.Id);
            run.Status = RunStatusEnum.Rejected;
            run.Outcome = RunOutcomeEnum.Rejected;
            run.CompletedUtc = DateTime.UtcNow;
            await RunTelemetry.FinishedAsync(_Database, run, token).ConfigureAwait(false);
        }

        #endregion
    }
}
