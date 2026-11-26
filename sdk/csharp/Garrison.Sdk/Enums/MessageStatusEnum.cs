namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Where a message between agents is in its life (AA6).
    /// </summary>
    public enum MessageStatusEnum
    {
        /// <summary>
        /// Waiting in the recipient's inbox.
        /// </summary>
        Queued,

        /// <summary>
        /// Handed to a run of the recipient.
        /// </summary>
        Delivered,

        /// <summary>
        /// The recipient acknowledged it.
        /// </summary>
        Acknowledged,

        /// <summary>
        /// Its expiry passed before it was delivered.
        /// </summary>
        Expired,

        /// <summary>
        /// Refused when it was sent; RejectionReason says why.
        /// </summary>
        Rejected
    }
}
