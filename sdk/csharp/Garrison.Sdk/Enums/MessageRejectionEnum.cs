namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a message was refused when it was sent (AA6).
    /// </summary>
    public enum MessageRejectionEnum
    {
        /// <summary>
        /// It would travel more hops than Messaging.MaxHops allows.
        /// </summary>
        HopLimit,

        /// <summary>
        /// The sender reached Messaging.LineRatePerMinute to this recipient.
        /// </summary>
        LineRate,

        /// <summary>
        /// The thread already holds Messaging.ThreadBudget messages.
        /// </summary>
        ThreadBudget,

        /// <summary>
        /// No allowed line connects the sender and the recipient.
        /// </summary>
        NoLine,

        /// <summary>
        /// The recipient agent is frozen.
        /// </summary>
        Frozen
    }
}
