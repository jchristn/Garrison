namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Pipeline run fields carried by a pipeline notification (P12.14). No input, no stage output, no error text.
    /// </summary>
    public class NotificationPipelineRunSummary
    {
        #region Public-Members

        /// <summary>
        /// Pipeline run identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Pipeline identifier.
        /// </summary>
        public string PipelineId { get; set; } = String.Empty;

        /// <summary>
        /// Pipeline name.
        /// </summary>
        public string PipelineName { get; set; } = String.Empty;

        /// <summary>
        /// Final status.
        /// </summary>
        public PipelineRunStatusEnum Status { get; set; } = PipelineRunStatusEnum.Succeeded;

        /// <summary>
        /// Outcome.
        /// </summary>
        public PipelineRunOutcomeEnum Outcome { get; set; } = PipelineRunOutcomeEnum.None;

        /// <summary>
        /// Number of stages.
        /// </summary>
        public int StageCount { get; set; } = 0;

        /// <summary>
        /// Last stage run, or null.
        /// </summary>
        public string? FinalRunId { get; set; } = null;

        /// <summary>
        /// Trigger that started the pipeline run, or null.
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Start time (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completion time (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationPipelineRunSummary()
        {
        }

        #endregion
    }
}
