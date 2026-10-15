namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Run fields carried by a run notification (P12.14). No input, no output (unless the endpoint opts in to result
    /// text), no error text, and no secrets.
    /// </summary>
    public class NotificationRunSummary
    {
        #region Public-Members

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Run kind.
        /// </summary>
        public RunKindEnum Kind { get; set; } = RunKindEnum.Invoke;

        /// <summary>
        /// Final status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Succeeded;

        /// <summary>
        /// Outcome.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.None;

        /// <summary>
        /// Attempt number.
        /// </summary>
        public int Attempt { get; set; } = 1;

        /// <summary>
        /// Parent run identifier for delegated runs, or null.
        /// </summary>
        public string? ParentRunId { get; set; } = null;

        /// <summary>
        /// Pipeline run identifier for pipeline stage runs, or null.
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Trigger that started the run, or null.
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Start time (UTC), or null when the run never started.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completion time (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Result text cut to the endpoint's resultTextMaxChars; present only when the endpoint sets includeResultText.
        /// </summary>
        public string? ResultText { get; set; } = null;

        /// <summary>
        /// True when resultText was cut.
        /// </summary>
        public bool? ResultTruncated { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationRunSummary()
        {
        }

        #endregion
    }
}
