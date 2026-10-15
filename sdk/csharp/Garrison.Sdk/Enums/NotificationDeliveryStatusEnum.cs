namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// State of a notification delivery (P12.14).
    /// </summary>
    public enum NotificationDeliveryStatusEnum
    {
        /// <summary>
        /// Waiting for its next attempt.
        /// </summary>
        Pending,

        /// <summary>
        /// Claimed by a control-plane replica and being sent.
        /// </summary>
        Delivering,

        /// <summary>
        /// The endpoint answered with a 2xx status.
        /// </summary>
        Succeeded,

        /// <summary>
        /// Gave up: a status that is not retried, a refused destination, or no attempts left.
        /// </summary>
        Failed
    }
}
