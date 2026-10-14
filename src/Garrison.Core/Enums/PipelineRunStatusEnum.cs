namespace Garrison.Core.Enums
{
    /// <summary>
    /// Status of a pipeline run (P12.9). Running, AwaitingReview, and Cancelling are active; the rest are terminal.
    /// </summary>
    public enum PipelineRunStatusEnum
    {
        /// <summary>
        /// A stage is starting or running.
        /// </summary>
        Running,

        /// <summary>
        /// A stage finished and waits for its review decision.
        /// </summary>
        AwaitingReview,

        /// <summary>
        /// Cancellation was requested; the current stage run and any pending review are being stopped.
        /// </summary>
        Cancelling,

        /// <summary>
        /// Every stage finished (approved where a review was required).
        /// </summary>
        Succeeded,

        /// <summary>
        /// A stage failed, could not start, or its review rejected it. See the outcome.
        /// </summary>
        Failed,

        /// <summary>
        /// The pipeline run was cancelled.
        /// </summary>
        Cancelled,

        /// <summary>
        /// The pipeline run passed its maxDurationSeconds deadline.
        /// </summary>
        TimedOut
    }
}
