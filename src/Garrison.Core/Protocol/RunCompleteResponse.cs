namespace Garrison.Core.Protocol
{
    using Garrison.Core.Compilation;

    /// <summary>
    /// Control plane answer to a completion report. Usually only acknowledges it. When the run's structured output
    /// failed validation against the agent's output schema and a repair is possible, it carries the repair spec: the
    /// worker keeps the lease, runs the repair in the same run directories (resuming the harness session), and reports
    /// completion again with <see cref="RunCompleteRequest.RepairAttempt"/> set to <see cref="RepairAttempt"/>.
    /// </summary>
    public class RunCompleteResponse
    {
        #region Public-Members

        /// <summary>
        /// Whether the report was accepted.
        /// </summary>
        public bool Accepted { get; set; } = true;

        /// <summary>
        /// Optional message.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Execution spec for the structured output repair, or null when the run is finished.
        /// </summary>
        public ExecutionSpec? Repair { get; set; } = null;

        /// <summary>
        /// Repair attempt the spec runs (1), or 0 when there is no repair.
        /// </summary>
        public int RepairAttempt { get; set; } = 0;

        /// <summary>
        /// Last event sequence already stored for the run (including the control plane's validation warning). The
        /// worker numbers the repair's events after it. 0 when there is no repair.
        /// </summary>
        public long EventSequenceStart { get; set; } = 0;

        #endregion
    }
}
