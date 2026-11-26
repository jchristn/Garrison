namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why a message was refused when it was sent (AA6.3, AA6.4). Every rejection is stored and counted.
    /// </summary>
    public enum MessageRejectionEnum
    {
        /// <summary>
        /// The message would travel more hops than Messaging.MaxHops allows.
        /// </summary>
        HopLimit,

        /// <summary>
        /// The sender already sent Messaging.LineRatePerMinute messages to this recipient in the last minute.
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
        /// The recipient agent is under a freeze.
        /// </summary>
        Frozen
    }
}
