namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Compare-and-set change of a pipeline run row (P12.9). Applied only while the row's status is one of
    /// FromStatuses and, when ExpectedCasVersion is set, its casVersion matches; every applied change increases casVersion.
    /// </summary>
    public class PipelineRunTransition
    {
        #region Public-Members

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
        /// Required casVersion, or null to accept any.
        /// </summary>
        public int? ExpectedCasVersion { get; set; } = null;

        /// <summary>
        /// Statuses the row must have; at least one.
        /// </summary>
        public List<PipelineRunStatusEnum> FromStatuses
        {
            get
            {
                return _FromStatuses;
            }
            set
            {
                _FromStatuses = value ?? new List<PipelineRunStatusEnum>();
            }
        }

        /// <summary>
        /// New status.
        /// </summary>
        public PipelineRunStatusEnum ToStatus { get; set; } = PipelineRunStatusEnum.Running;

        /// <summary>
        /// New outcome, or null to keep it.
        /// </summary>
        public PipelineRunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// New current position, or null to keep it.
        /// </summary>
        public int? CurrentPosition { get; set; } = null;

        /// <summary>
        /// Whether to write ErrorMessage (null clears it).
        /// </summary>
        public bool SetErrorMessage { get; set; } = false;

        /// <summary>
        /// Error message written when SetErrorMessage is true.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Final run identifier, or null to keep it.
        /// </summary>
        public string? FinalRunId { get; set; } = null;

        /// <summary>
        /// Set completedUtc to now.
        /// </summary>
        public bool SetCompleted { get; set; } = false;

        /// <summary>
        /// Clear completedUtc (a resumed run).
        /// </summary>
        public bool ClearCompleted { get; set; } = false;

        /// <summary>
        /// Whether to write DeadlineUtc (null clears it).
        /// </summary>
        public bool SetDeadline { get; set; } = false;

        /// <summary>
        /// Deadline written when SetDeadline is true.
        /// </summary>
        public DateTime? DeadlineUtc { get; set; } = null;

        /// <summary>
        /// New cancelRequested flag, or null to keep it.
        /// </summary>
        public bool? CancelRequested { get; set; } = null;

        #endregion

        #region Private-Members

        private string _PipelineRunId = String.Empty;
        private List<PipelineRunStatusEnum> _FromStatuses = new List<PipelineRunStatusEnum>();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineRunTransition()
        {
        }

        #endregion
    }
}
