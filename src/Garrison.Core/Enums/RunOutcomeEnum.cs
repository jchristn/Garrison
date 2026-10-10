namespace Garrison.Core.Enums
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
        /// SchemaValidationFailed.
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
        /// The run stayed queued with no Ready worker able to run it for longer than the cluster setting
        /// Runtime.FailBlockedAfterSeconds allows.
        /// </summary>
        NoCapableWorker,

        /// <summary>
        /// InternalError.
        /// </summary>
        InternalError,

        /// <summary>
        /// The worker's repetition guard stopped the run: the most recent assistant text was one short unit repeated
        /// over and over, or contained no letters or digits for too long (a degenerate generation loop).
        /// </summary>
        RepetitionDetected,

        /// <summary>
        /// The worker's no-progress guard stopped the run: the harness produced no assistant text, thinking, tool
        /// call, or tool result for longer than the run's noProgressSeconds while no tool call was open.
        /// </summary>
        NoProgress
    }
}
