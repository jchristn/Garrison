namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// A decision on a pipeline stage review (P12.9), also used as a stage review timeout action.
    /// </summary>
    public enum PipelineReviewDecisionEnum
    {
        /// <summary>
        /// Continue the pipeline; an optional comment reaches the next stage as review notes.
        /// </summary>
        Approve,

        /// <summary>
        /// Run the stage again with the comment as feedback (comment required, limited by maxRevisions).
        /// </summary>
        RequestChanges,

        /// <summary>
        /// Fail the pipeline run with outcome ReviewRejected.
        /// </summary>
        Reject
    }
}
