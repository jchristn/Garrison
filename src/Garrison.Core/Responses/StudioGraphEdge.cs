namespace Garrison.Core.Responses
{
    using System;

    /// <summary>
    /// One call edge of a draft app: the From member may call the To member.
    /// </summary>
    public class StudioGraphEdge
    {
        /// <summary>
        /// App name.
        /// </summary>
        public string App { get; set; } = String.Empty;

        /// <summary>
        /// Calling agent name.
        /// </summary>
        public string From { get; set; } = String.Empty;

        /// <summary>
        /// Called agent name.
        /// </summary>
        public string To { get; set; } = String.Empty;

        /// <summary>
        /// Whether the edge allows fan-out.
        /// </summary>
        public bool FanOut { get; set; } = true;

        /// <summary>
        /// Delegation depth the edge needs: one plus the longest chain of calls below the called member. Minimum 1.
        /// </summary>
        public int Depth { get; set; } = 1;
    }
}
