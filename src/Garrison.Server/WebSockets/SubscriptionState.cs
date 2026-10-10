namespace Garrison.Server.WebSockets
{
    /// <summary>
    /// Per-subscription cursor.
    /// </summary>
    public class SubscriptionState
    {
        /// <summary>
        /// Fingerprint of the last snapshot sent.
        /// </summary>
        public string? Fingerprint { get; set; } = null;

        /// <summary>
        /// Last event sequence sent for run subscriptions.
        /// </summary>
        public long LastSequence { get; set; } = 0;
    }
}
