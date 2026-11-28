namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why an activity trail stopped short (LP-001). A trail that hit a cap still holds every step found before it.
    /// </summary>
    public enum RunTrailTruncationEnum
    {
        /// <summary>
        /// The trail is complete.
        /// </summary>
        None,

        /// <summary>
        /// The trail reached RunTrail.MaxNodes steps.
        /// </summary>
        NodeCap,

        /// <summary>
        /// The trail reached RunTrail.MaxMessageHops message hops, walking back to the origin or forward from it.
        /// </summary>
        HopCap,

        /// <summary>
        /// Steps later than RunTrail.MaxSpanHours after the origin were left out.
        /// </summary>
        SpanCap
    }
}
