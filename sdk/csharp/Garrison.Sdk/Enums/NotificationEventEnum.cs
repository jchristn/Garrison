namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Event a notification endpoint can subscribe to (P12.14).
    /// </summary>
    public enum NotificationEventEnum
    {
        /// <summary>
        /// A run finished with status Succeeded.
        /// </summary>
        RunSucceeded,

        /// <summary>
        /// A run finished with status Failed or Rejected.
        /// </summary>
        RunFailed,

        /// <summary>
        /// A run finished with status Cancelled.
        /// </summary>
        RunCancelled,

        /// <summary>
        /// A run finished with status TimedOut.
        /// </summary>
        RunTimedOut,

        /// <summary>
        /// A pipeline run finished with status Succeeded.
        /// </summary>
        PipelineCompleted,

        /// <summary>
        /// A pipeline run finished with status Failed, TimedOut, or Cancelled.
        /// </summary>
        PipelineFailed,

        /// <summary>
        /// A permission approval or a pipeline stage review waits for a decision.
        /// </summary>
        ApprovalRequested,

        /// <summary>
        /// A test notification from the test action. Endpoints cannot subscribe to it.
        /// </summary>
        Test
    }
}
