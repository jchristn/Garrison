namespace Garrison.Worker.Execution
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Chooses the executor for each run from its execution spec (plan D-033): Process specs go to the process
    /// executor, KubernetesJob specs to the Kubernetes Job executor. A KubernetesJob spec on a worker without that
    /// executor fails with outcome NoCapableWorker instead of silently running as a subprocess. Thread-safe.
    /// </summary>
    public class RoutingRunExecutor : IRunExecutor
    {
        #region Private-Members

        private readonly IRunExecutor _Process;
        private readonly IRunExecutor? _KubernetesJob;
        private readonly IRunExecutor _Remote;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="process">Process executor.</param>
        /// <param name="kubernetesJob">Kubernetes Job executor, or null when the worker has none.</param>
        /// <param name="remote">Remote A2A/MCP executor; null uses the built-in implementation.</param>
        /// <exception cref="ArgumentNullException">Thrown when process is null.</exception>
        public RoutingRunExecutor(IRunExecutor process, IRunExecutor? kubernetesJob, IRunExecutor? remote = null)
        {
            _Process = process ?? throw new ArgumentNullException(nameof(process));
            _KubernetesJob = kubernetesJob;
            _Remote = remote ?? new RemoteRunExecutor();
        }

        #endregion

        #region Public-Methods

        /// <inheritdoc />
        public Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            RunExecutorEnum executor = assignment.Spec?.Executor ?? RunExecutorEnum.Process;
            if (executor == RunExecutorEnum.Process && assignment.Spec != null && assignment.Spec.EgressRules.Count > 0)
            {
                // P11.15 (D-052), defense in depth: the control plane never leases an allowlisted run to Process, but if
                // one arrives, fail it rather than run it with the worker's unrestricted network.
                RunCompleteRequest refused = new RunCompleteRequest();
                refused.Status = RunStatusEnum.Failed;
                refused.Outcome = RunOutcomeEnum.NoCapableWorker;
                refused.ErrorMessage = "This run's deployment has an egress allowlist, which only the KubernetesJob executor enforces; the Process executor refused to run it so the allowlist is never bypassed.";
                refused.CompletedUtc = DateTime.UtcNow;
                return Task.FromResult(refused);
            }
            if (executor == RunExecutorEnum.RemoteA2A || executor == RunExecutorEnum.RemoteMcp) return _Remote.ExecuteAsync(assignment, reporter, token);
            if (executor == RunExecutorEnum.Process) return _Process.ExecuteAsync(assignment, reporter, token);
            if (executor == RunExecutorEnum.KubernetesJob && _KubernetesJob != null) return _KubernetesJob.ExecuteAsync(assignment, reporter, token);

            RunCompleteRequest complete = new RunCompleteRequest();
            complete.Status = RunStatusEnum.Failed;
            complete.Outcome = RunOutcomeEnum.NoCapableWorker;
            complete.ErrorMessage = "This worker has no " + executor + " executor; the run was leased to it by mistake. Enable Kubernetes.Enabled on workers that should run it.";
            complete.CompletedUtc = DateTime.UtcNow;
            return Task.FromResult(complete);
        }

        /// <inheritdoc />
        public void Release(RunAssignment assignment, bool succeeded)
        {
            if (assignment == null) throw new ArgumentNullException(nameof(assignment));
            RunExecutorEnum executor = assignment.Spec?.Executor ?? RunExecutorEnum.Process;
            if (executor == RunExecutorEnum.KubernetesJob) _KubernetesJob?.Release(assignment, succeeded);
            else if (executor == RunExecutorEnum.RemoteA2A || executor == RunExecutorEnum.RemoteMcp) _Remote.Release(assignment, succeeded);
            else _Process.Release(assignment, succeeded);
        }

        #endregion
    }
}
