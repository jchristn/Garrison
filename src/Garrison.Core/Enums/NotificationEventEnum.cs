namespace Garrison.Core.Enums
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
        /// A permission approval or a pipeline stage review is waiting for a decision.
        /// </summary>
        ApprovalRequested,

        /// <summary>
        /// A run raised an escalation (AA2), or one was escalated up. Endpoints can require a minimum severity.
        /// </summary>
        EscalationRaised,

        /// <summary>
        /// An escalation's timeout passed with no answer and nowhere left to escalate (AA2).
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
        /// A run or a person filed a report with health Unhealthy (AA5).
        /// </summary>
        ReportUnhealthy,

        /// <summary>
        /// Change rules applied an executive's proposal without a person (AA8.10). A rollback of its organization undoes it.
        /// </summary>
        OrgProposalApplied,

        /// <summary>
        /// A canary release crossed a threshold and its deployment weights were rolled back (AA9.8).
        /// </summary>
        CanaryRolledBack,

        /// <summary>
        /// A report of kind Brief was filed (AA10.3), usually by an organization's top agent for its board.
        /// </summary>
        BoardBrief,
        /// <summary>
        /// The budget guard froze a unit whose subtree spend passed its budget plus the organization's freeze margin
        /// (AA11.5). The freeze stays until a person lifts it.
        /// </summary>
        OrgBudgetFrozen,

        /// <summary>
        /// A test notification sent by the test action. Endpoints cannot subscribe to it.
        /// </summary>
        Test
    }
}
