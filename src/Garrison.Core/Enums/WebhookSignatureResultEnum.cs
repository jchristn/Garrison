namespace Garrison.Core.Enums
{
    /// <summary>
    /// Result of verifying a Garrison webhook signature header (P12.5).
    /// </summary>
    public enum WebhookSignatureResultEnum
    {
        /// <summary>
        /// A v1 signature matched and the timestamp is inside the tolerance window.
        /// </summary>
        Valid,

        /// <summary>
        /// No signature header was sent.
        /// </summary>
        Missing,

        /// <summary>
        /// The header is not t=&lt;unix seconds&gt;,v1=&lt;hex&gt;.
        /// </summary>
        Malformed,

        /// <summary>
        /// The timestamp is outside the tolerance window (a replay or a skewed clock).
        /// </summary>
        Stale,

        /// <summary>
        /// No v1 signature matched the body.
        /// </summary>
        Mismatch
    }
}
