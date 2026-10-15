namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// One execution of a pipeline (P12.9). Holds a snapshot of the pipeline's stages taken at start, so editing the
    /// pipeline never changes a run in flight. Advancement is idempotent and compare-and-set guarded (casVersion), so a
    /// completion hook on any replica and the leader's sweep can drive it safely.
    /// </summary>
    public class PipelineRun
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix plr_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewPipelineRunId() : value;
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
        /// Pipeline that was started.
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
        /// Pipeline definition version at start.
        /// </summary>
        public int PipelineVersion { get; set; } = 1;

        /// <summary>
        /// Status.
        /// </summary>
        public PipelineRunStatusEnum Status { get; set; } = PipelineRunStatusEnum.Running;

        /// <summary>
        /// Why the pipeline run ended; None while it is active.
        /// </summary>
        public PipelineRunOutcomeEnum Outcome { get; set; } = PipelineRunOutcomeEnum.None;

        /// <summary>
        /// Position of the stage being run or reviewed (1 to StageCount).
        /// </summary>
        public int CurrentPosition { get; set; } = 1;

        /// <summary>
        /// Number of stages.
        /// </summary>
        public int StageCount { get; set; } = 0;

        /// <summary>
        /// Compare-and-set version, increased by every change of the pipeline run row.
        /// </summary>
        public int CasVersion { get; set; } = 0;

        /// <summary>
        /// Caller input. Every stage run receives it as its input; earlier outputs reach a stage only through its
        /// PipelineStage prompt.
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
        /// Input content type. Default text/plain.
        /// </summary>
        public string InputContentType
        {
            get
            {
                return _InputContentType;
            }
            set
            {
                _InputContentType = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Caller principal type.
        /// </summary>
        public PrincipalTypeEnum CallerType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Caller principal identifier.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Caller display name.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Idempotency key of the start request, or null.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>
        /// Trigger that started this pipeline run (P12.5), or null.
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// Priority given to every stage run.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Run of the last stage when the pipeline run succeeded.
        /// </summary>
        public string? FinalRunId { get; set; } = null;

        /// <summary>
        /// Why the pipeline run failed, timed out, or was cancelled.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// End of the pipeline run's allowed duration (UTC), or null without a limit.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// Whether cancellation was requested.
        /// </summary>
        public bool CancelRequested { get; set; } = false;

        /// <summary>
        /// W3C traceparent of the start request, or null.
        /// </summary>
        public string? TraceParent { get; set; } = null;

        /// <summary>
        /// Start time (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completion time (UTC), or null while active.
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
        /// Stage snapshots in order, with their progress.
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
        /// Reviews of this pipeline run, oldest first. Filled in by the detail read only.
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
        /// Summaries of the stage runs, oldest first. Filled in by the detail read only.
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

        private string _Id = IdGenerator.NewPipelineRunId();
        private string _TenantId = String.Empty;
        private string _PipelineId = String.Empty;
        private string _PipelineName = String.Empty;
        private string _InputText = String.Empty;
        private string _InputContentType = "text/plain";
        private List<PipelineRunStage> _Stages = new List<PipelineRunStage>();
        private List<PipelineReview> _Reviews = new List<PipelineReview>();
        private List<PipelineStageRunSummary> _Runs = new List<PipelineStageRunSummary>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineRun()
        {
        }

        #endregion
    }
}
