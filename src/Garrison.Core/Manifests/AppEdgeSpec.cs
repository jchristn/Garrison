namespace Garrison.Core.Manifests
{
    using System;

    /// <summary>
    /// One call allowed between members of an AgenticApp manifest (AD6.11).
    /// </summary>
    public class AppEdgeSpec
    {
        /// <summary>
        /// Calling member's agent name.
        /// </summary>
        public string From { get; set; } = String.Empty;

        /// <summary>
        /// Called member's agent name.
        /// </summary>
        public string To { get; set; } = String.Empty;

        /// <summary>
        /// Whether the caller may start the callee in a fan-out group. Default true.
        /// </summary>
        public bool? FanOut { get; set; } = null;
    }
}
