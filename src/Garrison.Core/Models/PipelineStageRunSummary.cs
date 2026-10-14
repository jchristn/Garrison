namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Summary of one stage run of a pipeline run, returned by the pipeline run detail read (P12.9).
    /// </summary>
    public class PipelineStageRunSummary
    {
        #region Public-Members

        /// <summary>
        /// Run identifier.
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
        /// Stage position.
        /// </summary>
        public int Position { get; set; } = 0;

        /// <summary>
        /// Stage execution.
        /// </summary>
        public int Execution { get; set; } = 0;

        /// <summary>
        /// Agent name.
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
        /// Run status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Run outcome, or null while active.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Run error message, or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Completion time (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        #endregion

        #region Private-Members

        private string _RunId = String.Empty;
        private string _AgentName = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineStageRunSummary()
        {
        }

        #endregion
    }
}
