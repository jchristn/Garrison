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
        /// A run raised an escalation (AA2). Endpoints can skip ones below EscalationMinimumSeverity.
        /// </summary>
        EscalationRaised,

        /// <summary>
        /// An escalation timed out before anyone answered it (AA2).
        /// </summary>
        EscalationExpired,

        /// <summary>
        /// A freeze was applied, including turning the autonomy kill switch on (AA3).
        /// </summary>
        FreezeApplied,

        /// <summary>
        /// A keeper reached its daily spend cap and stops ticking until the window resets (AA3).
        /// </summary>
        MandateCapReached,

        /// <summary>
        /// A test notification from the test action. Endpoints cannot subscribe to it.
        /// </summary>
        Test
    }
}
