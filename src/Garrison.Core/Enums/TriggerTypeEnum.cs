namespace Garrison.Core.Enums
{
    /// <summary>
    /// What starts a trigger (P12.5).
    /// </summary>
    public enum TriggerTypeEnum
    {
        /// <summary>
        /// A five-field cron schedule evaluated in the trigger time zone by the control-plane leader.
        /// </summary>
        Cron,

        /// <summary>
        /// An HTTP POST to the trigger webhook URL, authorized by an HMAC-SHA256 signature made with the trigger signing secret.
        /// </summary>
        Webhook
    }
}
