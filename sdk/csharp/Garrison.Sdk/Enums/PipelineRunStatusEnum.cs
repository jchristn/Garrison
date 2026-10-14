namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Status of a pipeline run (P12.9). Succeeded, Failed, Cancelled, and TimedOut are final.
    /// </summary>
    public enum PipelineRunStatusEnum
    {
        /// <summary>
        /// A stage is queued, running, or about to start.
        /// </summary>
        Running,

        /// <summary>
        /// A stage finished and waits for a person to review it.
        /// </summary>
        AwaitingReview,

        /// <summary>
        /// Cancellation was requested; the current stage run is being cancelled.
        /// </summary>
        Cancelling,

        /// <summary>
        /// Every stage finished and every review was approved.
        /// </summary>
        Succeeded,

        /// <summary>
        /// A stage failed, could not start, or a review rejected it.
        /// </summary>
        Failed,

        /// <summary>
        /// Cancelled by a caller.
        /// </summary>
        Cancelled,

        /// <summary>
        /// The pipeline ran longer than its maxDurationSeconds.
        /// </summary>
        TimedOut
    }
}
