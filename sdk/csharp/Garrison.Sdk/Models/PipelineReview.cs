namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A review gate of a pipeline stage: a person approves the stage output, requests changes, or rejects it.
    /// </summary>
    public class PipelineReview
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Pipeline run identifier.
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
        /// Pipeline identifier.
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
        /// Pipeline run stage identifier.
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
        /// Stage execution under review.
        /// </summary>
        public int Execution { get; set; } = 0;

        /// <summary>
        /// Review status.
        /// </summary>
        public PipelineReviewStatusEnum Status { get; set; } = PipelineReviewStatusEnum.Pending;

        /// <summary>
        /// Decision, or null while pending.
        /// </summary>
        public PipelineReviewDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who decided, or null while pending.
        /// </summary>
        public PipelineReviewSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Reviewer comment (notes or feedback), or null.
        /// </summary>
        public string? Comment { get; set; } = null;

        /// <summary>
        /// Name of who decided, or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// User or credential identifier of who decided, or null.
        /// </summary>
        public string? DecidedById { get; set; } = null;

        /// <summary>
        /// Action applied when the review times out.
        /// </summary>
        public PipelineReviewDecisionEnum TimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// When the review was requested (UTC).
        /// </summary>
        public DateTime RequestedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the timeout action applies, or null to wait forever.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// When it was decided, or null.
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

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _PipelineRunId = String.Empty;
        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private string _RunStageId = String.Empty;
        private string _StageName = String.Empty;
        private string _RunId = String.Empty;

        #endregion
    }
}
