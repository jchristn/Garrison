namespace Garrison.Core.Enums
{
    /// <summary>
    /// Status of one stage of a pipeline run (P12.9).
    /// </summary>
    public enum PipelineStageStatusEnum
    {
        /// <summary>
        /// Not started yet.
        /// </summary>
        Pending,

        /// <summary>
        /// An execution of the stage is starting or running (or waiting to be retried after a transient start failure).
        /// </summary>
        Running,

        /// <summary>
        /// The stage finished and waits for its review.
        /// </summary>
        AwaitingReview,

        /// <summary>
        /// The stage finished and, when required, was approved.
        /// </summary>
        Succeeded,

        /// <summary>
        /// The stage failed, could not start, or was rejected.
        /// </summary>
        Failed,

        /// <summary>
        /// The stage was cancelled with its pipeline run.
        /// </summary>
        Cancelled
    }
}
