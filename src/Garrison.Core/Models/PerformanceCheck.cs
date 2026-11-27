namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A scheduled check (AA11.3): an EvalSet trigger and the result of the newest eval run it started. Results are written
    /// only by the eval runner, never by agents. Not thread-safe.
    /// </summary>
    public class PerformanceCheck
    {
        /// <summary>
        /// Trigger identifier.
        /// </summary>
        public string TriggerId { get; set; } = String.Empty;

        /// <summary>
        /// Trigger name.
        /// </summary>
        public string? TriggerName { get; set; } = null;

        /// <summary>
        /// Whether the trigger fires.
        /// </summary>
        public bool Active { get; set; } = false;

        /// <summary>
        /// Eval set version the check runs.
        /// </summary>
        public string EvalSetId { get; set; } = String.Empty;

        /// <summary>
        /// Eval set name, or null when the set no longer exists.
        /// </summary>
        public string? EvalSetName { get; set; } = null;

        /// <summary>
        /// Deployment whose recent inputs the check replays.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// The deployment's agent, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Cron expression of a Cron trigger, or null.
        /// </summary>
        public string? CronExpression { get; set; } = null;

        /// <summary>
        /// Next scheduled fire (UTC), or null.
        /// </summary>
        public DateTime? NextFireUtc { get; set; } = null;

        /// <summary>
        /// Newest eval run the check started, or null before the first.
        /// </summary>
        public string? LastEvalRunId { get; set; } = null;

        /// <summary>
        /// When that eval run was created (UTC), or null.
        /// </summary>
        public DateTime? LastRunUtc { get; set; } = null;

        /// <summary>
        /// Status of that eval run, or null.
        /// </summary>
        public EvalRunStatusEnum? LastStatus { get; set; } = null;

        /// <summary>
        /// Score (0 to 1) of that eval run, or null while it runs or when it failed.
        /// </summary>
        public double? LastScore { get; set; } = null;

        /// <summary>
        /// Whether that eval run passed its threshold, or null.
        /// </summary>
        public bool? LastPassed { get; set; } = null;
    }
}
