namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A link between two steps of an activity trail. Not thread-safe.
    /// </summary>
    public class RunTrailEdge
    {
        /// <summary>
        /// Identifier of the node the link starts at.
        /// </summary>
        public string FromId { get; set; } = String.Empty;

        /// <summary>
        /// Identifier of the node the link ends at.
        /// </summary>
        public string ToId { get; set; } = String.Empty;

        /// <summary>
        /// How the two steps are linked.
        /// </summary>
        public RunTrailEdgeKindEnum Kind { get; set; } = RunTrailEdgeKindEnum.Started;

        /// <summary>
        /// When the link happened (UTC).
        /// </summary>
        public DateTime AtUtc { get; set; } = DateTime.UtcNow;
    }
}
