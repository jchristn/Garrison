namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How soon a message between agents should reach its recipient (AA6).
    /// </summary>
    public enum MessageUrgencyEnum
    {
        /// <summary>
        /// Delivered with the recipient keeper's next tick, or when it reads its inbox. Default.
        /// </summary>
        Normal,

        /// <summary>
        /// Wakes the recipient now, within Messaging.UrgentWakesPerHour.
        /// </summary>
        Urgent
    }
}
