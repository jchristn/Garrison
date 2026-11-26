namespace Garrison.Core.Enums
{
    /// <summary>
    /// Where a message between agents is in its life (AA6).
    /// </summary>
    public enum MessageStatusEnum
    {
        /// <summary>
        /// Accepted and waiting in the recipient's inbox.
        /// </summary>
        Queued,

        /// <summary>
        /// Handed to a run of the recipient: a keeper tick, a Message run, or garrison_read_inbox.
        /// </summary>
        Delivered,

        /// <summary>
        /// The recipient acknowledged it with garrison_ack_message.
        /// </summary>
        Acknowledged,

        /// <summary>
        /// Its expiry passed before it was delivered.
        /// </summary>
        Expired,

        /// <summary>
        /// Refused when it was sent; the rejection reason says why. Never delivered.
        /// </summary>
        Rejected
    }
}
