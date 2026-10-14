namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Snapshot and progress of one stage of a pipeline run (P12.9). The definition columns are copied from the
    /// pipeline stage at start. Executions counts every claimed execution (first, retries, revisions, resumes) and is the
    /// stage's compare-and-set version; the run of execution N carries the idempotency key pipeline:{pipelineRunId}:{position}:{N}.
    /// </summary>
    public class PipelineRunStage
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix prs_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineRunStageId() : value;
            }
        }

        /// <summary>
        /// Owning pipeline run.
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
        /// Position, starting at 1.
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
        /// Stage description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent that runs the stage.
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
        /// Deployment, or null for the agent's weighted selection.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// PipelineStage template override, or null.
        /// </summary>
        public string? HandoffTemplateId { get; set; } = null;

        /// <summary>
        /// Pinned handoff template version, or null.
        /// </summary>
        public int? HandoffTemplateVersion { get; set; } = null;

        /// <summary>
        /// Most characters of each earlier output rendered into the prompt (1000 to 200000).
        /// </summary>
        public int OutputCharLimit { get; set; } = 16000;

        /// <summary>
        /// Executions before a failure counts (1 to 5).
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Whether the pipeline continues after this stage fails.
        /// </summary>
        public bool ContinueOnFailure { get; set; } = false;

        /// <summary>
        /// Whether a person reviews the result.
        /// </summary>
        public bool RequiresReview { get; set; } = false;

        /// <summary>
        /// Review timeout in seconds; 0 waits indefinitely.
        /// </summary>
        public int ReviewTimeoutSeconds { get; set; } = 0;

        /// <summary>
        /// Decision applied when the review times out.
        /// </summary>
        public PipelineReviewDecisionEnum ReviewTimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// Most RequestChanges decisions (0 to 10).
        /// </summary>
        public int MaxRevisions { get; set; } = 3;

        /// <summary>
        /// Status.
        /// </summary>
        public PipelineStageStatusEnum Status { get; set; } = PipelineStageStatusEnum.Pending;

        /// <summary>
        /// Executions claimed so far (also the compare-and-set version of the stage).
        /// </summary>
        public int Executions { get; set; } = 0;

        /// <summary>
        /// Attempt number of the current execution within its retry cycle (reset by a revision or a resume).
        /// </summary>
        public int Attempts { get; set; } = 0;

        /// <summary>
        /// RequestChanges decisions applied to this stage.
        /// </summary>
        public int Revisions { get; set; } = 0;

        /// <summary>
        /// Run of the current execution, or null before it is created.
        /// </summary>
        public string? CurrentRunId { get; set; } = null;

        /// <summary>
        /// Run of the previous execution, or null.
        /// </summary>
        public string? LastRunId { get; set; } = null;

        /// <summary>
        /// Why the current execution could not be created yet (a transient refusal such as QuotaExceeded), or null.
        /// </summary>
        public string? BlockedReason { get; set; } = null;

        /// <summary>
        /// When the blocked execution is tried again (UTC), or null.
        /// </summary>
        public DateTime? NextAttemptUtc { get; set; } = null;

        /// <summary>
        /// When the first execution was claimed (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the stage finished (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Run parameter overrides snapshot.
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

        private string _Id = IdGenerator.NewPipelineRunStageId();
        private string _PipelineRunId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private List<PipelineRunStageParameter> _Parameters = new List<PipelineRunStageParameter>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineRunStage()
        {
        }

        #endregion
    }
}
