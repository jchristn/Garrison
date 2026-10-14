namespace Garrison.Core.Enums
{
    /// <summary>
    /// Status of a pipeline stage review (P12.9).
    /// </summary>
    public enum PipelineReviewStatusEnum
    {
        /// <summary>
        /// Waiting for a decision.
        /// </summary>
        Pending,

        /// <summary>
        /// Approved by a person or by the timeout action Approve.
        /// </summary>
        Approved,

        /// <summary>
        /// A person asked for changes; the stage runs again with the feedback.
        /// </summary>
        ChangesRequested,

        /// <summary>
        /// A person rejected the stage; the pipeline run fails.
        /// </summary>
        Rejected,

        /// <summary>
        /// The review timed out with the timeout action Reject; the pipeline run fails.
        /// </summary>
        Expired,

        /// <summary>
        /// The pipeline run was cancelled or timed out while the review was pending.
        /// </summary>
        Cancelled
    }
}
