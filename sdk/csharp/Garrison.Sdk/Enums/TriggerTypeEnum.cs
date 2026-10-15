namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What starts a trigger (P12.5).
    /// </summary>
    public enum TriggerTypeEnum
    {
        /// <summary>
        /// A five-field cron schedule evaluated in the trigger time zone.
        /// </summary>
        Cron,

        /// <summary>
        /// A signed HTTP POST to the trigger webhook URL.
        /// </summary>
        Webhook
    }
}
