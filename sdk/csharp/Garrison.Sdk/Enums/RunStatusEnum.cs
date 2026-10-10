namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Run lifecycle status.
    /// </summary>
    public enum RunStatusEnum
    {
        /// <summary>
        /// Pending.
        /// </summary>
        Pending,

        /// <summary>
        /// Queued.
        /// </summary>
        Queued,

        /// <summary>
        /// Leased.
        /// </summary>
        Leased,

        /// <summary>
        /// Running.
        /// </summary>
        Running,

        /// <summary>
        /// Cancelling.
        /// </summary>
        Cancelling,

        /// <summary>
        /// Succeeded.
        /// </summary>
        Succeeded,

        /// <summary>
        /// Failed.
        /// </summary>
        Failed,

        /// <summary>
        /// Cancelled.
        /// </summary>
        Cancelled,

        /// <summary>
        /// TimedOut.
        /// </summary>
        TimedOut,

        /// <summary>
        /// Rejected.
        /// </summary>
        Rejected
    }
}
