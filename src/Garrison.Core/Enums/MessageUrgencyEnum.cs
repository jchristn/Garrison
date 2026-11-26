namespace Garrison.Core.Enums
{
    /// <summary>
    /// How soon a message between agents should reach its recipient (AA6, AA-020).
    /// </summary>
    public enum MessageUrgencyEnum
    {
        /// <summary>
        /// Delivered with the recipient keeper's next tick, or when the recipient reads its inbox. Default.
        /// </summary>
        Normal,

        /// <summary>
        /// Wakes the recipient now: its keeper ticks at once, or a recipient without a keeper starts a Message run.
        /// Limited by Messaging.UrgentWakesPerHour; above the limit, and while the autonomy kill switch is on, an urgent
        /// message waits like a normal one.
        /// </summary>
        Urgent
    }
}
