namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A stage of a pipeline run: a snapshot of the stage definition taken at start plus its progress.
    /// </summary>
    public class PipelineRunStage
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prs_).
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
        /// Position (1-based).
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name.
        /// </summary>
        public string Name
        {
            get
            {
                return _Name;
            }
            set
            {
                _Name = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent name at start.
        /// </summary>
        public string AgentName
        {
            get
            {
                return _AgentName;
            }
            set
            {
                _AgentName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Pinned deployment, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Stage handoff template, or null.
        /// </summary>
        public string? HandoffTemplateId { get; set; } = null;

        /// <summary>
        /// Pinned template version, or null.
        /// </summary>
        public int? HandoffTemplateVersion { get; set; } = null;

        /// <summary>
        /// Most characters of earlier output handed to the stage.
        /// </summary>
        public int OutputCharLimit { get; set; } = 16000;

        /// <summary>
        /// Attempts before the stage fails.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Continue when the stage fails.
        /// </summary>
        public bool ContinueOnFailure { get; set; } = false;

        /// <summary>
        /// Whether the stage waits for a review.
        /// </summary>
        public bool RequiresReview { get; set; } = false;

        /// <summary>
        /// Review timeout seconds; 0 waits forever.
        /// </summary>
        public int ReviewTimeoutSeconds { get; set; } = 0;

        /// <summary>
        /// Action at the review timeout.
        /// </summary>
        public PipelineReviewDecisionEnum ReviewTimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// Most RequestChanges decisions.
        /// </summary>
        public int MaxRevisions { get; set; } = 3;

        /// <summary>
        /// Stage status.
        /// </summary>
        public PipelineStageStatusEnum Status { get; set; } = PipelineStageStatusEnum.Pending;

        /// <summary>
        /// Stage runs created for this stage so far.
        /// </summary>
        public int Executions { get; set; } = 0;

        /// <summary>
        /// Attempts of the current execution series.
        /// </summary>
        public int Attempts { get; set; } = 0;

        /// <summary>
        /// RequestChanges decisions applied so far.
        /// </summary>
        public int Revisions { get; set; } = 0;

        /// <summary>
        /// Stage run in progress, or null.
        /// </summary>
        public string? CurrentRunId { get; set; } = null;

        /// <summary>
        /// Most recent stage run, or null.
        /// </summary>
        public string? LastRunId { get; set; } = null;

        /// <summary>
        /// Why the stage run could not be created yet (for example QuotaExceeded), or null.
        /// </summary>
        public string? BlockedReason { get; set; } = null;

        /// <summary>
        /// When a blocked stage is retried, or null.
        /// </summary>
        public DateTime? NextAttemptUtc { get; set; } = null;

        /// <summary>
        /// When the stage started, or null.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the stage finished, or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Snapshot of the stage parameters.
        /// </summary>
        public List<PipelineRunStageParameter> Parameters
        {
            get
            {
                return _Parameters;
            }
            set
            {
                _Parameters = value ?? new List<PipelineRunStageParameter>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _PipelineRunId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private List<PipelineRunStageParameter> _Parameters = new List<PipelineRunStageParameter>();

        #endregion
    }
}
