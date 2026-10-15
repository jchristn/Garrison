namespace Garrison.Sdk.Enums
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
        /// Someone fired it through the fire action.
        /// </summary>
        Manual
    }
}
