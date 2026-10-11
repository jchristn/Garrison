namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Detailed run outcome code.
    /// </summary>
    public enum RunOutcomeEnum
    {
        /// <summary>
        /// None.
        /// </summary>
        None,

        /// <summary>
        /// Succeeded.
        /// </summary>
        Succeeded,

        /// <summary>
        /// HarnessFailed.
        /// </summary>
        HarnessFailed,

        /// <summary>
        /// NotInstalled.
        /// </summary>
        NotInstalled,

        /// <summary>
        /// NotCredentialed.
        /// </summary>
        NotCredentialed,

        /// <summary>
        /// McpPreflightFailed.
        /// </summary>
        McpPreflightFailed,

        /// <summary>
        /// NodeLost.
        /// </summary>
        NodeLost,

        /// <summary>
        /// OutputLimitExceeded.
        /// </summary>
        OutputLimitExceeded,

        /// <summary>
        /// SchemaValidationFailed: the final output did not validate against the agent's output schema, after the one
        /// repair attempt or at once when the harness profile cannot resume a session.
        /// </summary>
        SchemaValidationFailed,

        /// <summary>
        /// TimedOut.
        /// </summary>
        TimedOut,

        /// <summary>
        /// Cancelled.
        /// </summary>
        Cancelled,

        /// <summary>
        /// StaleLease.
        /// </summary>
        StaleLease,

        /// <summary>
        /// CompileFailed.
        /// </summary>
        CompileFailed,

        /// <summary>
        /// WorkspaceFailed.
        /// </summary>
        WorkspaceFailed,

        /// <summary>
        /// Rejected.
        /// </summary>
        Rejected,

        /// <summary>
        /// NoCapableWorker: the run stayed queued with no Ready worker able to run it for longer than the cluster
        /// setting Runtime.FailBlockedAfterSeconds allows.
        /// </summary>
        NoCapableWorker,

        /// <summary>
        /// InternalError.
        /// </summary>
        InternalError,

        /// <summary>
        /// RepetitionDetected: the worker's repetition guard stopped the run because its assistant text degenerated into
        /// one short repeated unit or into text with no letters or digits. The partial output is the result text.
        /// </summary>
        RepetitionDetected,

        /// <summary>
        /// NoProgress: the worker's no-progress guard stopped the run because the harness produced no assistant text,
        /// thinking, tool call, or tool result for longer than the deployment's noProgressSeconds.
        /// </summary>
        NoProgress,

        /// <summary>
        /// PodFailed: the run pod of a KubernetesJob run failed outside the harness (unschedulable or Pending too long,
        /// image pull failure, OOMKilled, evicted, or exited without reporting a completion). The error message names
        /// the cause.
        /// </summary>
        PodFailed
    }
}
