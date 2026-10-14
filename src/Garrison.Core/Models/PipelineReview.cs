namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A human review gate of one execution of a pipeline stage (P12.9). Created when a stage that requires review
    /// finishes; decisions are compare-and-set updates from Pending, so concurrent deciders on any replica produce exactly
    /// one decision. Authorized as ResourceType Approval (Read to list, Update to decide); run tokens can never list or
    /// decide reviews.
    /// </summary>
    public class PipelineReview
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix prv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineReviewId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline run.
        /// </summary>
        public string PipelineRunId
        {
            get
            {
                return _PipelineRunId;
            }
            set
            {
                _PipelineRunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline.
        /// </summary>
        public string PipelineId
        {
            get
            {
                return _PipelineId;
            }
            set
            {
                _PipelineId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline name.
        /// </summary>
        public string PipelineName
        {
            get
            {
                return _PipelineName;
            }
            set
            {
                _PipelineName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pipeline run stage under review.
        /// </summary>
        public string RunStageId
        {
            get
            {
                return _RunStageId;
            }
            set
            {
                _RunStageId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Stage position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name.
        /// </summary>
        public string StageName
        {
            get
            {
                return _StageName;
            }
            set
            {
                _StageName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Stage run under review.
        /// </summary>
        public string RunId
        {
            get
            {
                return _RunId;
            }
            set
            {
                _RunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Stage execution under review (unique per stage).
        /// </summary>
        public int Execution { get; set; } = 0;

        /// <summary>
        /// Status.
        /// </summary>
        public PipelineReviewStatusEnum Status { get; set; } = PipelineReviewStatusEnum.Pending;

        /// <summary>
        /// Decision, or null while pending (and for cancelled reviews).
        /// </summary>
        public PipelineReviewDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who decided, or null while pending.
        /// </summary>
        public PipelineReviewSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Reviewer comment (at most 8000 characters): notes for the next stage on Approve, the feedback on
        /// RequestChanges, or the reason on Reject.
        /// </summary>
        public string? Comment { get; set; } = null;

        /// <summary>
        /// Display name of the decider.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// User or credential identifier of the decider.
        /// </summary>
        public string? DecidedById { get; set; } = null;

        /// <summary>
        /// Decision applied when the review expires.
        /// </summary>
        public PipelineReviewDecisionEnum TimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// When the review was requested (UTC).
        /// </summary>
        public DateTime RequestedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the timeout action applies (UTC), or null to wait indefinitely.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// When the review was decided (UTC).
        /// </summary>
        public DateTime? DecidedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewPipelineReviewId();
        private string _TenantId = String.Empty;
        private string _PipelineRunId = String.Empty;
        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private string _RunStageId = String.Empty;
        private string _StageName = String.Empty;
        private string _RunId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineReview()
        {
        }

        #endregion
    }
}
