namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Decision applied to a pending pipeline review with a compare-and-set update from Pending (P12.9).
    /// </summary>
    public class PipelineReviewResolution
    {
        #region Public-Members

        /// <summary>
        /// Review.
        /// </summary>
        public string ReviewId
        {
            get
            {
                return _ReviewId;
            }
            set
            {
                _ReviewId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// New status.
        /// </summary>
        public PipelineReviewStatusEnum Status { get; set; } = PipelineReviewStatusEnum.Approved;

        /// <summary>
        /// Decision, or null for a cancelled review.
        /// </summary>
        public PipelineReviewDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who decided.
        /// </summary>
        public PipelineReviewSourceEnum Source { get; set; } = PipelineReviewSourceEnum.User;

        /// <summary>
        /// Comment.
        /// </summary>
        public string? Comment { get; set; } = null;

        /// <summary>
        /// Decider display name.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Decider identifier.
        /// </summary>
        public string? DecidedById { get; set; } = null;

        /// <summary>
        /// Decision time (UTC).
        /// </summary>
        public DateTime DecidedUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _ReviewId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineReviewResolution()
        {
        }

        #endregion
    }
}
