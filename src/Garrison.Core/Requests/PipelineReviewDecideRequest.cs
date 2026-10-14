namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Decide a pending pipeline stage review (P12.9).
    /// </summary>
    public class PipelineReviewDecideRequest
    {
        #region Public-Members

        /// <summary>
        /// Approve, RequestChanges, or Reject. Required.
        /// </summary>
        public PipelineReviewDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Comment, at most 8000 characters. Required for RequestChanges (the feedback the stage runs again with);
        /// optional notes for the next stage on Approve; optional reason on Reject.
        /// </summary>
        public string? Comment { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineReviewDecideRequest()
        {
        }

        #endregion
    }
}
