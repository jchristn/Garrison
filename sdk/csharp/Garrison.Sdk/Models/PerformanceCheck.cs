namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A scheduled check in an organization's performance (AA11.3): a trigger with target EvalSet whose deployment belongs
    /// to an agent in scope, with the outcome of its newest eval run. Agents cannot create or change these checks. Not
    /// thread-safe.
    /// </summary>
    public class PerformanceCheck
    {
        /// <summary>
        /// Trigger identifier.
        /// </summary>
        public string TriggerId { get; set; } = String.Empty;

        /// <summary>
        /// Trigger name, or null.
        /// </summary>
        public string? TriggerName { get; set; } = null;

        /// <summary>
        /// Whether the trigger fires.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Eval set identifier.
        /// </summary>
        public string EvalSetId { get; set; } = String.Empty;

        /// <summary>
        /// Eval set name, or null.
        /// </summary>
        public string? EvalSetName { get; set; } = null;

        /// <summary>
        /// Deployment the check replays recent inputs of.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent of the deployment, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Cron expression of the trigger, or null.
        /// </summary>
        public string? CronExpression { get; set; } = null;

        /// <summary>
        /// Next scheduled fire (UTC), or null.
        /// </summary>
        public DateTime? NextFireUtc { get; set; } = null;

        /// <summary>
        /// Newest eval run the check started, or null before the first fire.
        /// </summary>
        public string? LastEvalRunId { get; set; } = null;

        /// <summary>
        /// When the newest eval run was created (UTC), or null.
        /// </summary>
        public DateTime? LastRunUtc { get; set; } = null;

        /// <summary>
        /// Status of the newest eval run, or null.
        /// </summary>
        public EvalRunStatusEnum? LastStatus { get; set; } = null;

        /// <summary>
        /// Score of the newest eval run, 0 to 1, or null.
        /// </summary>
        public double? LastScore { get; set; } = null;

        /// <summary>
        /// Whether the newest eval run passed, or null.
        /// </summary>
        public bool? LastPassed { get; set; } = null;
    }
}
