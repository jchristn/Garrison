namespace Garrison.Worker.Execution
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Executes one leased run and returns its completion report. The MVP implementation runs a subprocess; Phase 11
    /// adds a Kubernetes Job executor.
    /// </summary>
    public interface IRunExecutor
    {
        /// <summary>
        /// Execute a run.
        /// </summary>
        /// <param name="assignment">Leased run with its execution spec.</param>
        /// <param name="reporter">Progress reporter.</param>
        /// <param name="token">Cancellation token; cancellation stops the harness and yields a Cancelled report.</param>
        /// <returns>Completion report (NodeId and Epoch are filled by the caller).</returns>
        Task<RunCompleteRequest> ExecuteAsync(RunAssignment assignment, IRunReporter reporter, CancellationToken token);
    }
}
