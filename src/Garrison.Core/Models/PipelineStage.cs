namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One stage of a pipeline definition (P12.9): which agent runs, how its prompt receives the previous stages'
    /// outputs, how failures are retried, and whether a person reviews the result before the next stage starts.
    /// </summary>
    public class PipelineStage
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix pst_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineStageId() : value;
            }
        }

        /// <summary>
        /// Owning pipeline.
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
        /// Position in the pipeline, starting at 1. Assigned from list order when the pipeline is saved.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name, unique within the pipeline, 1 to 128 characters.
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
        /// Optional description (not sent to the harness).
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
        /// Deployment of the agent to use, or null for the agent's weighted deployment selection.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// PipelineStage prompt template for this stage, or null to use the deployment's PipelineStage binding and then
        /// builtin/pipeline-stage. Must be a Task template.
        /// </summary>
        public string? HandoffTemplateId { get; set; } = null;

        /// <summary>
        /// Pinned version of the handoff template, or null for its current version.
        /// </summary>
        public int? HandoffTemplateVersion { get; set; } = null;

        /// <summary>
        /// Most characters of each earlier stage's output (and of a revised output) rendered into this stage's prompt;
        /// longer outputs are cut and marked as truncated. Minimum 1000, maximum 200000, default 16000.
        /// </summary>
        public int OutputCharLimit { get; set; } = 16000;

        /// <summary>
        /// Executions of the stage, including the first, before a failure counts. Minimum 1, maximum 5, default 1.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Whether the pipeline continues with the next stage after this stage fails all its attempts (the next stage sees
        /// pipeline.previous.status Failed). Default false: the pipeline run fails with StageFailed.
        /// </summary>
        public bool ContinueOnFailure { get; set; } = false;

        /// <summary>
        /// Whether a person reviews the stage result before the pipeline continues. Default false.
        /// </summary>
        public bool RequiresReview { get; set; } = false;

        /// <summary>
        /// Seconds a review waits for a decision before ReviewTimeoutAction applies. 0 (the default) waits indefinitely;
        /// minimum 0, maximum 2592000 (30 days). The pipeline's MaxDurationSeconds still applies.
        /// </summary>
        public int ReviewTimeoutSeconds { get; set; } = 0;

        /// <summary>
        /// Decision applied when a review times out: Approve or Reject (default). RequestChanges is not allowed.
        /// </summary>
        public PipelineReviewDecisionEnum ReviewTimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// Most RequestChanges decisions for this stage in one pipeline run; a further RequestChanges answers 409
        /// RevisionLimitReached. Minimum 0, maximum 10, default 3.
        /// </summary>
        public int MaxRevisions { get; set; } = 3;

        /// <summary>
        /// Run parameter overrides passed to every run of the stage, validated against the deployment's allowed run
        /// overrides when the pipeline is saved (only possible when the stage names a deployment).
        /// </summary>
        public List<PipelineStageParameter> Parameters
        {
            get
            {
                return _Parameters;
            }
            set
            {
                _Parameters = value ?? new List<PipelineStageParameter>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewPipelineStageId();
        private string _PipelineId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private List<PipelineStageParameter> _Parameters = new List<PipelineStageParameter>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineStage()
        {
        }

        #endregion
    }
}
