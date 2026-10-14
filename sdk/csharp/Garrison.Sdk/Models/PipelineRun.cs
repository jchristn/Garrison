namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An execution of a pipeline (P12.9). The detail read also carries its stages, stage runs, and reviews.
    /// </summary>
    public class PipelineRun
    {
        #region Public-Members

        /// <summary>
        /// Identifier (plr_).
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
        /// Pipeline name at start.
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
        /// Pipeline version at start.
        /// </summary>
        public int PipelineVersion { get; set; } = 1;

        /// <summary>
        /// Status.
        /// </summary>
        public PipelineRunStatusEnum Status { get; set; } = PipelineRunStatusEnum.Running;

        /// <summary>
        /// Outcome; None while active.
        /// </summary>
        public PipelineRunOutcomeEnum Outcome { get; set; } = PipelineRunOutcomeEnum.None;

        /// <summary>
        /// Position of the current (or stopping) stage.
        /// </summary>
        public int CurrentPosition { get; set; } = 1;

        /// <summary>
        /// Number of stages.
        /// </summary>
        public int StageCount { get; set; } = 0;

        /// <summary>
        /// Compare-and-set version (advances on every transition).
        /// </summary>
        public int CasVersion { get; set; } = 0;

        /// <summary>
        /// Caller input given to every stage.
        /// </summary>
        public string InputText
        {
            get
            {
                return _InputText;
            }
            set
            {
                _InputText = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Media type of the input.
        /// </summary>
        public string InputContentType
        {
            get
            {
                return _InputContentType;
            }
            set
            {
                _InputContentType = value ?? "text/plain";
            }
        }

        /// <summary>
        /// Kind of caller that started it.
        /// </summary>
        public PrincipalTypeEnum CallerType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Caller identifier, or null.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Caller name, or null.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Idempotency key of the start, or null.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>
        /// Priority of the stage runs.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Stage run whose result is the pipeline result, or null.
        /// </summary>
        public string? FinalRunId { get; set; } = null;

        /// <summary>
        /// Why it failed or was cancelled, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// When it times out, or null.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Whether cancellation was requested.
        /// </summary>
        public bool CancelRequested { get; set; } = false;

        /// <summary>
        /// W3C traceparent of the start, or null.
        /// </summary>
        public string? TraceParent { get; set; } = null;

        /// <summary>
        /// Start time, or null.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completion time, or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Stages (snapshot plus progress).
        /// </summary>
        public List<PipelineRunStage> Stages
        {
            get
            {
                return _Stages;
            }
            set
            {
                _Stages = value ?? new List<PipelineRunStage>();
            }
        }

        /// <summary>
        /// Reviews (detail read only).
        /// </summary>
        public List<PipelineReview> Reviews
        {
            get
            {
                return _Reviews;
            }
            set
            {
                _Reviews = value ?? new List<PipelineReview>();
            }
        }

        /// <summary>
        /// Stage runs (detail read only).
        /// </summary>
        public List<PipelineStageRunSummary> Runs
        {
            get
            {
                return _Runs;
            }
            set
            {
                _Runs = value ?? new List<PipelineStageRunSummary>();
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private string _InputText = String.Empty;
        private string _InputContentType = "text/plain";
        private List<PipelineRunStage> _Stages = new List<PipelineRunStage>();
        private List<PipelineReview> _Reviews = new List<PipelineReview>();
        private List<PipelineStageRunSummary> _Runs = new List<PipelineStageRunSummary>();

        #endregion
    }
}
