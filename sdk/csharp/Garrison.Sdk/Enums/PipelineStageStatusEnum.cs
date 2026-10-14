namespace Garrison.Sdk.Enums
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
        /// A stage run is queued or running.
        /// </summary>
        Running,

        /// <summary>
        /// The stage finished and waits for its review.
        /// </summary>
        AwaitingReview,

        /// <summary>
        /// The stage finished and, when it requires review, was approved.
        /// </summary>
        Succeeded,

        /// <summary>
        /// The stage failed or was rejected.
        /// </summary>
        Failed,

        /// <summary>
        /// The pipeline run was cancelled during the stage.
        /// </summary>
        Cancelled
    }
}
