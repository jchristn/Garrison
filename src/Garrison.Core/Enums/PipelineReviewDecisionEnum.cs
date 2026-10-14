namespace Garrison.Core.Enums
{
    /// <summary>
    /// Decision on a pipeline stage review (P12.9). Also the timeout action of a stage (Approve or Reject).
    /// </summary>
    public enum PipelineReviewDecisionEnum
    {
        /// <summary>
        /// Accept the stage output; optional notes reach the next stage as pipeline.reviewNotes.
        /// </summary>
        Approve,

        /// <summary>
        /// Run the same stage again with the comment as pipeline.revision.feedback (comment required, bounded by maxRevisions).
        /// </summary>
        RequestChanges,

        /// <summary>
        /// Fail the pipeline run with outcome ReviewRejected.
        /// </summary>
        Reject
    }
}
