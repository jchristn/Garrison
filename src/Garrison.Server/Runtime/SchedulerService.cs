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
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Requests;
    using Garrison.Core.Telemetry;
    using Garrison.Server.Services;
    using Radiant;
    using SyslogLogging;

    /// <summary>
    /// Hands queued runs to worker nodes. Candidates are filtered by harness capability, node pool, tenant dedication,
    /// node labels, and deployment concurrency, then claimed with an atomic compare-and-set that increments the fencing
    /// epoch (plan section 9.3). Claimed runs are compiled into execution specs; compile failures fail the run.
    /// Thread-safe.
    /// </summary>
    public class SchedulerService
    {
        #region Private-Members

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
            if (node.Status != NodeStatusEnum.Ready) return response;

            int maxRuns = Math.Clamp(request.MaxRuns, 1, 64);
            int waitMs = Math.Clamp(request.WaitMs, 0, Math.Min(60000, _Options.LeaseWaitMs));
            DateTime deadline = DateTime.UtcNow.AddMilliseconds(waitMs);

            while (true)
            {
                token.ThrowIfCancellationRequested();
                List<RunAssignment> claimed = await ClaimAsync(node, maxRuns - response.Assignments.Count, token).ConfigureAwait(false);
                response.Assignments.AddRange(claimed);
                if (response.Assignments.Count > 0) return response;

                int remaining = (int)(deadline - DateTime.UtcNow).TotalMilliseconds;
                if (remaining <= 0) return response;
                await _Signals.QueueChanged.WaitAsync(Math.Min(remaining, _Options.LeasePollMs), token).ConfigureAwait(false);
            }
        }

        #endregion

        #region Private-Methods

        private async Task<List<RunAssignment>> ClaimAsync(Node node, int maxRuns, CancellationToken token)
        {
            List<RunAssignment> assignments = new List<RunAssignment>();
            List<HarnessTypeEnum> harnessTypes = node.Capabilities.Where(c => c.Available).Select(c => c.HarnessType).Distinct().ToList();
            if (harnessTypes.Count == 0 || maxRuns <= 0) return assignments;

            List<Run> candidates = await _Database.Runs.ListClaimCandidatesAsync(harnessTypes, Math.Max(maxRuns * 4, 16), token).ConfigureAwait(false);
            if (candidates.Count == 0) return assignments;

            NodePool? pool = String.IsNullOrEmpty(node.NodePoolId) ? null : await _Database.NodePools.ReadAsync(node.NodePoolId, token).ConfigureAwait(false);
            Dictionary<string, long> activeByDeployment = new Dictionary<string, long>(StringComparer.Ordinal);
            Dictionary<string, Deployment?> deployments = new Dictionary<string, Deployment?>(StringComparer.Ordinal);

            foreach (Run candidate in candidates)
            {
                if (assignments.Count >= maxRuns) break;
                if (!PlacementRules.MatchesPlacement(node, pool, candidate)) continue;

                if (!deployments.TryGetValue(candidate.DeploymentId, out Deployment? deployment))
                {
                    deployment = await _Database.Deployments.ReadAsync(candidate.DeploymentId, token).ConfigureAwait(false);
                    deployments[candidate.DeploymentId] = deployment;
                }
                if (deployment != null && deployment.MaxConcurrentRuns > 0)
                {
                    if (!activeByDeployment.TryGetValue(deployment.Id, out long active))
                    {
                        active = await _Database.Runs.CountActiveByDeploymentAsync(deployment.Id, token).ConfigureAwait(false);
                    }
                    if (active >= deployment.MaxConcurrentRuns)
                    {
                        _Telemetry.Increment("garrison.claims", new RadiantTag("result", "limit"));
                        continue;
                    }
                    activeByDeployment[deployment.Id] = active + 1;
                }

                // The claim and compile spans join the run's trace (recorded at creation), not the lease request's.
                using (Activity? claim = RunTracing.Start("run:claim", candidate.TraceParent))
                {
                    claim?.SetTag("garrison.run_id", candidate.Id);
                    claim?.SetTag("garrison.node", node.Name);
                    claim?.SetTag("garrison.harness", candidate.HarnessType.ToString());

                    Stopwatch timer = Stopwatch.StartNew();
                    DateTime leaseExpires = DateTime.UtcNow.AddMilliseconds(_Options.LeaseDurationMs);
                    long? epoch = await _Database.Runs.TryClaimAsync(candidate.Id, node.Id, node.Name, leaseExpires, token).ConfigureAwait(false);
                    if (!epoch.HasValue)
                    {
                        _Telemetry.Increment("garrison.claims", new RadiantTag("result", "lost"));
                        claim?.SetTag("garrison.claim_result", "lost");
                        continue;
                    }
                    _Telemetry.Increment("garrison.claims", new RadiantTag("result", "won"));
                    claim?.SetTag("garrison.claim_result", "won");
                    _Logging.Info(_Header + "run " + candidate.Id + " leased to " + node.Name + " (epoch " + epoch.Value + ") " + RunTracing.LogFields(candidate.Id, candidate.TraceId));

                    RunAssignment? assignment = await PrepareAsync(candidate.TenantId, candidate.Id, node, epoch.Value, leaseExpires, claim, token).ConfigureAwait(false);
                    _Telemetry.Record("garrison.compile.duration", timer.Elapsed.TotalSeconds, new RadiantTag("harness", candidate.HarnessType.ToString()));
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
                HarnessProfile? profile = deployment == null ? null : await _Database.HarnessProfiles.ReadAsync(tenantId, deployment.HarnessProfileId, token).ConfigureAwait(false);
                int timeoutSeconds = deployment?.TimeoutSeconds ?? profile?.DefaultTimeoutSeconds ?? 1800;
                DateTime deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds + _Options.DeadlineGraceSeconds);

                string? runToken = null;
                if (agent != null && agent.DelegationMode != DelegationModeEnum.None)
                {
                    runToken = await _Authentication.IssueForRunAsync(run, deadline, token).ConfigureAwait(false);
                }

                CompilationResult compiled;
                using (Activity? compile = RunTracing.Start("run:compile", claim?.Id ?? run.TraceParent))
                {
                    compile?.SetTag("garrison.run_id", run.Id);
                    compiled = await _Compiler().CompileAsync(run, runToken, token).ConfigureAwait(false);
                }

                // The worker parents its harness span on this, so the whole run shares one trace.
                compiled.Spec.TraceParent = claim?.Id ?? run.TraceParent ?? compiled.Spec.TraceParent;
                compiled.Spec.TimeoutSeconds = compiled.Spec.TimeoutSeconds > 0 ? compiled.Spec.TimeoutSeconds : timeoutSeconds;

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
                failed.Outcome = RunOutcomeEnum.CompileFailed;
                failed.ErrorMessage = e.Code + ": " + e.Message;
                failed.ClearLease = true;
                failed.SetCompleted = true;
                await _Database.Runs.TransitionAsync(failed, token).ConfigureAwait(false);
                await _Database.Sessions.RevokeByRunAsync(run.Id, "Run failed to compile.", token).ConfigureAwait(false);
                _Signals.Complete(run.Id);
                return null;
            }
        }

        #endregion
    }
}
