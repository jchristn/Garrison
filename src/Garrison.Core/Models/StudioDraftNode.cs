namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Where the visual editor placed one node of a draft's graph (AD7.1, AD8).
    /// </summary>
    public class StudioDraftNode
    {
        /// <summary>
        /// Node key, for example Agent/researcher.
        /// </summary>
        public string NodeKey { get; set; } = String.Empty;

        /// <summary>
        /// Horizontal position.
        /// </summary>
        public double X { get; set; } = 0;

        /// <summary>
        /// Vertical position.
        /// </summary>
        public double Y { get; set; } = 0;
    }
}
