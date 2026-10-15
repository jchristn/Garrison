namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of a notification delivery in the outbox (P12.14).
    /// </summary>
    public enum NotificationDeliveryStatusEnum
    {
        /// <summary>
        /// Waiting for its next attempt (nextAttemptUtc).
        /// </summary>
        Pending,

        /// <summary>
        /// Claimed by a control-plane replica and being sent. A claim that outlives claimUntilUtc is taken over by another replica, so a delivery can be sent more than once (at least once).
        /// </summary>
        Delivering,

        /// <summary>
        /// The endpoint answered with a 2xx status.
        /// </summary>
        Succeeded,

        /// <summary>
        /// Gave up: the endpoint answered with a status that is not retried, the destination is blocked, or the attempts ran out.
        /// </summary>
        Failed
    }
}
