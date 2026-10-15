namespace Test.Shared.Infrastructure
{
    using System;

    /// <summary>
    /// One request a <see cref="FakeWebhookReceiver"/> received.
    /// </summary>
    public class WebhookReceipt
    {
        /// <summary>
        /// Request path.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Raw body bytes.
        /// </summary>
        public byte[] Body { get; set; } = Array.Empty<byte>();

        /// <summary>
        /// X-Garrison-Signature header, or null.
        /// </summary>
        public string? Signature { get; set; } = null;

        /// <summary>
        /// X-Garrison-Event header, or null.
        /// </summary>
        public string? Event { get; set; } = null;

        /// <summary>
        /// X-Garrison-Delivery header, or null.
        /// </summary>
        public string? Delivery { get; set; } = null;

        /// <summary>
        /// Content-Type header, or null.
        /// </summary>
        public string? ContentType { get; set; } = null;

        /// <summary>
        /// Status answered.
        /// </summary>
        public int StatusCode { get; set; } = 200;
    }
}
