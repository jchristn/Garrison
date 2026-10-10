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
        /// InternalError.
        /// </summary>
        InternalError
    }
}
