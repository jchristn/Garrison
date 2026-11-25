namespace Garrison.Core.Enums
{
    /// <summary>
    /// How a keeper's interval changes between ticks (AA1, AA-014).
    /// </summary>
    public enum WakeModeEnum
    {
        /// <summary>
        /// The interval stays at the revision's minimum interval, unless a tick asks for a different next wake.
        /// </summary>
        Fixed,

        /// <summary>
        /// The interval multiplies by the revision's backoff factor after each Quiet tick, up to the maximum interval, and
        /// returns to the minimum after an Attention, Escalated, or Failed tick.
        /// </summary>
        Backoff
    }
}
