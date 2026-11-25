namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of a mandate (AA1). Only Active mandates are woken by the scheduler.
    /// </summary>
    public enum MandateStatusEnum
    {
        /// <summary>
        /// Created without a published revision. It never wakes until a revision is published and it is resumed.
        /// </summary>
        Draft,

        /// <summary>
        /// Wakes on its schedule, on manual wakes, and (later phases) on messages and escalation answers.
        /// </summary>
        Active,

        /// <summary>
        /// Paused by a person. Wakes are not scheduled; a manual wake is refused until it is resumed.
        /// </summary>
        Paused,

        /// <summary>
        /// Stopped by a freeze (AA3). Set and cleared by the brakes, not by pause and resume.
        /// </summary>
        Frozen,

        /// <summary>
        /// Reached its daily spend cap (AA3). It wakes again when the window resets.
        /// </summary>
        CapReached,

        /// <summary>
        /// Retired. Kept for history; it never wakes again.
        /// </summary>
        Retired
    }
}
