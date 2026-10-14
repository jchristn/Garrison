namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Status of a pipeline stage review (P12.9). Pending is the only state that can change.
    /// </summary>
    public enum PipelineReviewStatusEnum
    {
        /// <summary>
        /// Waiting for a person to decide.
        /// </summary>
        Pending,

        /// <summary>
        /// Approved; the pipeline continues.
        /// </summary>
        Approved,

        /// <summary>
        /// Changes were requested; the stage runs again with the feedback.
        /// </summary>
        ChangesRequested,

        /// <summary>
        /// Rejected; the pipeline run fails.
        /// </summary>
        Rejected,

        /// <summary>
        /// Nobody decided before the stage review timeout; the timeout action was applied.
        /// </summary>
        Expired,

        /// <summary>
        /// The pipeline run was cancelled while the review was pending.
        /// </summary>
        Cancelled
    }
}
