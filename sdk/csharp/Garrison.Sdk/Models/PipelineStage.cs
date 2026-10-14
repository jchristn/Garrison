namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One ordered stage of a pipeline: the agent that runs it and its handoff, retry, and review settings.
    /// </summary>
    public class PipelineStage
    {
        #region Public-Members

        /// <summary>
        /// Identifier (pst_). Assigned by the server.
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
        /// Position (1-based). The server numbers stages in list order.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage name. Required.
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
        /// Optional description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Agent that runs the stage. Required.
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
        /// Deployment of that agent to pin, or null for the agent's weighted deployment selection.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// PipelineStage prompt template that frames the stage prompt, or null for the deployment binding or the built-in.
        /// </summary>
        public string? HandoffTemplateId { get; set; } = null;

        /// <summary>
        /// Pinned template version, or null for the current version.
        /// </summary>
        public int? HandoffTemplateVersion { get; set; } = null;

        /// <summary>
        /// Most characters of earlier stage output handed to this stage (1000 to 200000). Default 16000.
        /// </summary>
        public int OutputCharLimit { get; set; } = 16000;

        /// <summary>
        /// Attempts before the stage fails (1 to 5). Default 1.
        /// </summary>
        public int MaxAttempts { get; set; } = 1;

        /// <summary>
        /// Continue to the next stage when this stage fails. Default false.
        /// </summary>
        public bool ContinueOnFailure { get; set; } = false;

        /// <summary>
        /// Wait for a person to review the stage output before continuing. Default false.
        /// </summary>
        public bool RequiresReview { get; set; } = false;

        /// <summary>
        /// Seconds a review waits before its timeout action applies; 0 waits forever. Default 0.
        /// </summary>
        public int ReviewTimeoutSeconds { get; set; } = 0;

        /// <summary>
        /// Action at the review timeout: Approve or Reject. Default Reject.
        /// </summary>
        public PipelineReviewDecisionEnum ReviewTimeoutAction { get; set; } = PipelineReviewDecisionEnum.Reject;

        /// <summary>
        /// Most RequestChanges decisions for this stage (0 to 10). Default 3.
        /// </summary>
        public int MaxRevisions { get; set; } = 3;

        /// <summary>
        /// Run parameter overrides.
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

        private string _Id = String.Empty;
        private string _PipelineId = String.Empty;
        private string _TenantId = String.Empty;
        private string _Name = String.Empty;
        private string _AgentId = String.Empty;
        private List<PipelineStageParameter> _Parameters = new List<PipelineStageParameter>();

        #endregion
    }
}
