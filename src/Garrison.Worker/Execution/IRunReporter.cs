namespace Garrison.Worker.Execution
{
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Protocol;

    /// <summary>
    /// Receives run progress from an executor: start notification and normalized events. Implementations assign
    /// sequence numbers and must be thread-safe.
    /// </summary>
    public interface IRunReporter
    {
        /// <summary>
        /// Report that the harness process started.
        /// </summary>
        /// <param name="processId">Process identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task StartedAsync(int? processId, CancellationToken token);

        /// <summary>
        /// Queue an event; the reporter assigns the next sequence number.
        /// </summary>
        /// <param name="report">Event.</param>
        void Emit(RunEventReport report);

        /// <summary>
        /// Deliver every queued event, retrying until delivered, stale, or cancelled.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task FlushAsync(CancellationToken token);
    }
}
