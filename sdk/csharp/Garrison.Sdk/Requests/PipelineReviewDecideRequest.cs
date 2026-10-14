namespace Garrison.Sdk.Requests
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A decision on a pending pipeline stage review.
    /// </summary>
    public class PipelineReviewDecideRequest
    {
        #region Public-Members

        /// <summary>
        /// Approve, RequestChanges, or Reject. Required.
        /// </summary>
        public PipelineReviewDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Optional comment (at most 8000 characters); required for RequestChanges. Approve notes reach the next stage.
        /// </summary>
        public string? Comment { get; set; } = null;

        #endregion
    }
}
