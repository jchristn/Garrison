namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// The activity trail of a run (LP1): every step from where the work started, through the runs and records it reached,
    /// back to the reply. Built by the server on each request from records it already keeps. It carries identifiers, kinds,
    /// states, times, and usage, never text an agent wrote. Not thread-safe.
    /// </summary>
    public class RunTrail
    {
        /// <summary>
        /// Identifier of the node where the work started: a Caller, Trigger, KeeperTick, or PipelineRun node, the oldest
        /// run reached when the walk back stopped at a cap, or a Redacted placeholder.
        /// </summary>
        public string OriginId { get; set; } = String.Empty;

        /// <summary>
        /// Identifier of the run the trail was requested for. Its node has IsFocus set.
        /// </summary>
        public string FocusRunId { get; set; } = String.Empty;

        /// <summary>
        /// Steps of the trail. Never null.
        /// </summary>
        public List<RunTrailNode> Nodes { get; set; } = new List<RunTrailNode>();

        /// <summary>
        /// Links between steps, from cause to effect. Never null.
        /// </summary>
        public List<RunTrailEdge> Edges { get; set; } = new List<RunTrailEdge>();

        /// <summary>
        /// Why the trail stopped short, or None when it is complete.
        /// </summary>
        public RunTrailTruncationEnum Truncation { get; set; } = RunTrailTruncationEnum.None;

        /// <summary>
        /// Number of nodes. Minimum 0.
        /// </summary>
        public int NodeCount { get; set; } = 0;

        /// <summary>
        /// Deepest message hop reached from the origin. Minimum 0.
        /// </summary>
        public int HopCount { get; set; } = 0;

        /// <summary>
        /// When the server built the trail (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;
    }
}
