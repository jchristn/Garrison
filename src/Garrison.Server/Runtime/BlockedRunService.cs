namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Explains why queued runs are not being picked up: no Ready node at all, no Ready node that reports the run's
    /// harness, no Ready node that can isolate an Untrusted run or enforce a run's egress allowlist, or no capable Ready
    /// node that matches the deployment's node pool and selectors. The reason is computed
    /// on read from a short-lived snapshot of node state, so reads never query nodes per run. Thread-safe.
    /// </summary>
    public class BlockedRunService
    {
        #region Public-Members

        /// <summary>
        /// How long a node snapshot is reused, in milliseconds. 0 always reads fresh node state. Minimum 0, maximum
        /// 60000, default 3000.
        /// </summary>
        public int SnapshotTtlMs
        {
            get
            {
                return _SnapshotTtlMs;
            }
            set
            {
                _SnapshotTtlMs = Math.Clamp(value, 0, 60000);
            }
        }

        /// <summary>
        /// Maximum queued runs examined by one count or maintenance pass (oldest first). Minimum 1, maximum 100000,
        /// default 5000.
        /// </summary>
        public int MaxQueuedRunsScanned
        {
            get
            {
                return _MaxQueuedRunsScanned;
            }
            set
            {
                _MaxQueuedRunsScanned = Math.Clamp(value, 1, 100000);
            }
        }

        #endregion

        #region Private-Members

        private readonly DatabaseDriverBase _Database;
        private int _SnapshotTtlMs = 3000;
        private int _MaxQueuedRunsScanned = 5000;
        private PlacementSnapshot? _Snapshot = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public BlockedRunService(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Why a run cannot be placed on any Ready node, or null when it is not Queued or some Ready node could run it.
        /// </summary>
        /// <param name="snapshot">Node snapshot.</param>
        /// <param name="run">Run.</param>
        /// <returns>Reason or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when snapshot or run is null.</exception>
        public static RunBlockedReasonEnum? Evaluate(PlacementSnapshot snapshot, Run run)
        {
            if (snapshot == null) throw new ArgumentNullException(nameof(snapshot));
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.Status != RunStatusEnum.Queued) return null;
            if (snapshot.ReadyNodes.Count == 0) return RunBlockedReasonEnum.NoReadyWorker;

            List<Node> withHarness = snapshot.ReadyNodes.Where(n => PlacementRules.Supports(n, run.HarnessType)).ToList();
            List<Node> capable = withHarness.Where(n => ExecutorCapabilityRules.Supports(n, run)).ToList();
            if (capable.Count == 0)
            {
                // Untrusted runs (P11.14) and runs that need egress control (P11.15, an egress allowlist) name missing
                // isolation or egress enforcement when that is what no worker with the harness offers.
                bool needsIsolation = run.TrustLevel == DeploymentTrustLevelEnum.Untrusted || run.RequiredCapabilities.EgressControl;
                if (needsIsolation && withHarness.Count > 0 && !withHarness.Any(n => ExecutorCapabilityRules.Isolates(n, run)))
                    return RunBlockedReasonEnum.NoIsolatingWorker;
                return RunBlockedReasonEnum.NoCapableWorker;
            }
            if (!capable.Any(n => PlacementRules.MatchesPlacement(n, snapshot.PoolOf(n), run))) return RunBlockedReasonEnum.NoMatchingPool;
            return null;
        }

        /// <summary>
        /// Human-readable explanation of a blocked reason, used in run events and failure messages.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="reason">Reason.</param>
        /// <returns>Explanation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static string Describe(Run run, RunBlockedReasonEnum reason)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            string harness = HarnessName(run.HarnessType);
            switch (reason)
            {
                case RunBlockedReasonEnum.NoReadyWorker:
                    return "No worker node is Ready. The run waits in the queue until a worker registers or returns to Ready.";
                case RunBlockedReasonEnum.NoCapableWorker:
                    if (ExecutorCapabilityRules.RequiresReport(run.RequiredCapabilities)) return "No Ready worker reports the " + harness + " harness, " + run.Executor + " executor, and required capabilities: " + Garrison.Core.Serialization.Serializer.Serialize(run.RequiredCapabilities) + ". The run waits until a matching worker registers.";
                    if (run.Executor != RunExecutorEnum.Process) return "No Ready worker reports both the " + harness + " harness and the " + run.Executor + " executor. The run waits until one registers (a worker reports KubernetesJob only when it runs in a cluster with permission to create Jobs).";
                    return "No Ready worker reports the " + harness + " harness. The run waits until one registers.";
                case RunBlockedReasonEnum.NoIsolatingWorker:
                    return "This run " + Needs(run) + ", but no Ready worker with the " + harness + " harness offers the " + run.Executor + " executor with " + (run.RequiredCapabilities.EgressControl ? "that isolation and egress control" : "that isolation") + ". The run waits until one registers (a worker reports KubernetesJob only when it runs in a cluster with permission to create Jobs" + (run.RequiredCapabilities.EgressControl ? ", and egress control only when Kubernetes.EgressAllowlists is on and it may create NetworkPolicies" : String.Empty) + ").";
                default:
                    return "Ready workers report the " + harness + " harness, but none matches this deployment's node pool or node selectors. The run waits until a matching worker registers.";
            }
        }

        /// <summary>
        /// Short past-tense cause of a blocked reason, used in failure messages.
        /// </summary>
        /// <param name="run">Run.</param>
        /// <param name="reason">Reason.</param>
        /// <returns>Cause, without a trailing period.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static string Cause(Run run, RunBlockedReasonEnum reason)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            string harness = HarnessName(run.HarnessType);
            switch (reason)
            {
                case RunBlockedReasonEnum.NoReadyWorker:
                    return "no worker node was Ready";
                case RunBlockedReasonEnum.NoCapableWorker:
                    if (run.Executor != RunExecutorEnum.Process) return "no Ready worker reported both the " + harness + " harness and the " + run.Executor + " executor";
                    return "no Ready worker reported the " + harness + " harness";
                case RunBlockedReasonEnum.NoIsolatingWorker:
                    return "no Ready worker with the " + harness + " harness offered the " + (run.RequiredCapabilities.EgressControl ? run.RequiredCapabilities.Isolation + " isolation and egress control" : run.RequiredCapabilities.Isolation + " isolation") + " this run needs";
                default:
                    return "no Ready worker with the " + harness + " harness matched the deployment's node pool or node selectors";
            }
        }

        /// <summary>
        /// Current node snapshot, reused for up to <see cref="SnapshotTtlMs"/> milliseconds.
        /// </summary>
        /// <param name="refresh">True to read fresh node state regardless of age.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Snapshot.</returns>
        public async Task<PlacementSnapshot> SnapshotAsync(bool refresh = false, CancellationToken token = default)
        {
            PlacementSnapshot? current = Volatile.Read(ref _Snapshot);
            if (!refresh && current != null && (DateTime.UtcNow - current.TakenUtc).TotalMilliseconds < _SnapshotTtlMs) return current;

            PlacementSnapshot snapshot = new PlacementSnapshot();
            snapshot.TakenUtc = DateTime.UtcNow;
            int skip = 0;
            while (true)
            {
                token.ThrowIfCancellationRequested();
                EnumerationQuery query = new EnumerationQuery();
                query.MaxResults = 1000;
                query.Skip = skip;
                EnumerationResult<Node> page = await _Database.Nodes.EnumerateAsync(query, token).ConfigureAwait(false);
                snapshot.ReadyNodes.AddRange(page.Objects.Where(n => n.Status == NodeStatusEnum.Ready));
                skip += page.Objects.Count;
                if (page.EndOfResults || page.Objects.Count == 0) break;
            }

            if (snapshot.ReadyNodes.Any(n => !String.IsNullOrEmpty(n.NodePoolId)))
            {
                skip = 0;
                while (true)
                {
                    token.ThrowIfCancellationRequested();
                    EnumerationQuery query = new EnumerationQuery();
                    query.MaxResults = 1000;
                    query.Skip = skip;
                    EnumerationResult<NodePool> page = await _Database.NodePools.EnumerateAsync(query, token).ConfigureAwait(false);
                    foreach (NodePool pool in page.Objects) snapshot.Pools[pool.Id] = pool;
                    skip += page.Objects.Count;
                    if (page.EndOfResults || page.Objects.Count == 0) break;
                }
            }

            Volatile.Write(ref _Snapshot, snapshot);
            return snapshot;
        }

        /// <summary>
        /// Discard the cached node snapshot so the next read sees current node state.
        /// </summary>
        public void Invalidate()
        {
            Volatile.Write(ref _Snapshot, null);
        }

        /// <summary>
        /// Fill <see cref="Run.BlockedReason"/> on one run. Node state is only read when the run is Queued. The run's
        /// placement requirements must be loaded (single-run reads load them).
        /// </summary>
        /// <param name="run">Run, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The same run.</returns>
        public async Task<Run?> AnnotateAsync(Run? run, CancellationToken token = default)
        {
            if (run == null) return null;
            if (run.Status != RunStatusEnum.Queued)
            {
                run.BlockedReason = null;
                return run;
            }
            PlacementSnapshot snapshot = await SnapshotAsync(false, token).ConfigureAwait(false);
            run.BlockedReason = Evaluate(snapshot, run);
            return run;
        }

        /// <summary>
        /// Fill <see cref="Run.BlockedReason"/> on a list of runs with one node snapshot. Placement requirements of queued
        /// runs are reloaded in one batched query, so the runs may come from list queries that do not load them.
        /// </summary>
        /// <param name="runs">Runs, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task AnnotateManyAsync(IEnumerable<Run>? runs, CancellationToken token = default)
        {
            if (runs == null) return;
            List<Run> list = runs.Where(r => r != null).ToList();
            foreach (Run run in list) run.BlockedReason = null;
            List<Run> queued = list.Where(r => r.Status == RunStatusEnum.Queued).ToList();
            if (queued.Count == 0) return;
            await _Database.Runs.LoadRequirementsAsync(queued, token).ConfigureAwait(false);
            PlacementSnapshot snapshot = await SnapshotAsync(false, token).ConfigureAwait(false);
            foreach (Run run in queued) run.BlockedReason = Evaluate(snapshot, run);
        }

        /// <summary>
        /// Queued runs that no Ready node can run right now, with <see cref="Run.BlockedReason"/> filled. Examines at most
        /// <see cref="MaxQueuedRunsScanned"/> queued runs, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for every tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Blocked runs.</returns>
        public async Task<List<Run>> ListBlockedAsync(string? tenantId, CancellationToken token = default)
        {
            List<Run> queued = await _Database.Runs.ListQueuedAsync(tenantId, _MaxQueuedRunsScanned, token).ConfigureAwait(false);
            if (queued.Count == 0) return queued;
            PlacementSnapshot snapshot = await SnapshotAsync(false, token).ConfigureAwait(false);
            foreach (Run run in queued) run.BlockedReason = Evaluate(snapshot, run);
            return queued.Where(r => r.BlockedReason != null).ToList();
        }

        /// <summary>
        /// Count of queued runs in a tenant that no Ready node can run right now.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        public async Task<long> CountBlockedAsync(string tenantId, CancellationToken token = default)
        {
            return (await ListBlockedAsync(tenantId, token).ConfigureAwait(false)).Count;
        }

        #endregion

        #region Private-Methods

        private static string Needs(Run run)
        {
            List<string> reasons = new List<string>();
            if (run.TrustLevel == DeploymentTrustLevelEnum.Untrusted) reasons.Add("is Untrusted and needs " + run.RequiredCapabilities.Isolation + " isolation or stronger");
            if (run.RequiredCapabilities.EgressControl) reasons.Add("needs egress control (its deployment has an egress allowlist, enforced only by KubernetesJob run pods with a NetworkPolicy)");
            if (reasons.Count == 0) reasons.Add("needs " + run.RequiredCapabilities.Isolation + " isolation or stronger");
            return String.Join(" and ", reasons);
        }

        private static string HarnessName(HarnessTypeEnum harness)
        {
            switch (harness)
            {
                case HarnessTypeEnum.ClaudeCode:
                    return "Claude Code";
                case HarnessTypeEnum.GeminiCli:
                    return "Gemini CLI";
                default:
                    return harness.ToString();
            }
        }

        #endregion
    }
}
