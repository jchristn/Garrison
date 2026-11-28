namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One step of an activity trail. The server leaves out properties that are null. Not thread-safe.
    /// </summary>
    public class RunTrailNode
    {
        /// <summary>
        /// Identifier of the record the step stands for (a run, message, report, and so on), the caller's principal
        /// identifier for a Caller node, rep_ plus the run identifier for a Reply node, or red_ plus a number for a
        /// Redacted placeholder.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// What the step is.
        /// </summary>
        public RunTrailNodeKindEnum Kind { get; set; } = RunTrailNodeKindEnum.Run;

        /// <summary>
        /// State of the record (for a run, its status), or null.
        /// </summary>
        public string? State { get; set; } = null;

        /// <summary>
        /// Agent identifier, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent name, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Identifier of the agent's unit in a live organization, or null.
        /// </summary>
        public string? UnitId { get; set; } = null;

        /// <summary>
        /// Name of that unit in the live revision, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Deployment identifier for a Run node, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// When the step started (UTC), or null.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the step ended (UTC), or null while it runs or when it has no end.
        /// </summary>
        public DateTime? EndedUtc { get; set; } = null;

        /// <summary>
        /// Duration in milliseconds, or null.
        /// </summary>
        public long? DurationMs { get; set; } = null;

        /// <summary>
        /// Input tokens of a Run node, or null.
        /// </summary>
        public long? InputTokens { get; set; } = null;

        /// <summary>
        /// Output tokens of a Run node, or null.
        /// </summary>
        public long? OutputTokens { get; set; } = null;

        /// <summary>
        /// Cost of a Run node in US dollars, or null when unknown.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Kind of a Run node, or null.
        /// </summary>
        public RunKindEnum? RunKind { get; set; } = null;

        /// <summary>
        /// True for the run the trail was requested for.
        /// </summary>
        public bool IsFocus { get; set; } = false;

        /// <summary>
        /// Swim lane: caller for Caller, Trigger, and Reply steps, otherwise the agent identifier.
        /// </summary>
        public string Lane { get; set; } = "caller";

        /// <summary>
        /// Caller type for Caller and Reply nodes, or null.
        /// </summary>
        public PrincipalTypeEnum? CallerType { get; set; } = null;

        /// <summary>
        /// Caller name for Caller and Reply nodes, or null.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Tool name of an Effect node, never its arguments, or null.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// For a Redacted placeholder, the kind of the step you may not read; otherwise null.
        /// </summary>
        public RunTrailNodeKindEnum? RedactedKind { get; set; } = null;
    }
}
