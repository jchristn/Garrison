namespace Garrison.Server.WebSockets
{
    using System;

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

        /// <summary>
        /// A second cursor for channels that follow two streams, such as the organization channel's report cursor, or null.
        /// </summary>
        public string? SecondaryFingerprint { get; set; } = null;

        /// <summary>
        /// Fingerprint of the last periodic summary sent, such as the organization channel's spend, or null.
        /// </summary>
        public string? SummaryFingerprint { get; set; } = null;

        /// <summary>
        /// When the periodic summary was last computed (UTC).
        /// </summary>
        public DateTime SummaryCheckedUtc { get; set; } = DateTime.MinValue;
    }
}
