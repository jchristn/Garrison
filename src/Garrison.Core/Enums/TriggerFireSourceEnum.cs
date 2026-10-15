namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why a trigger fired (P12.5).
    /// </summary>
    public enum TriggerFireSourceEnum
    {
        /// <summary>
        /// The cron schedule came due.
        /// </summary>
        Cron,

        /// <summary>
        /// A signed webhook delivery arrived.
        /// </summary>
        Webhook,

        /// <summary>
        /// A person or credential fired it through the fire action.
        /// </summary>
        Manual
    }
}
