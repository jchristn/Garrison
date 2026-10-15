namespace Garrison.Sdk
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using System.Text;

    /// <summary>
    /// The Garrison webhook signature scheme (P12.5, P12.14). Senders of trigger webhooks sign with
    /// <see cref="Header(string, long, byte[])"/>; receivers of notifications check with <see cref="Verify"/>. The
    /// X-Garrison-Signature header is t=&lt;unix seconds&gt;,v1=&lt;hex&gt; where the hex value is the lowercase
    /// HMAC-SHA256, keyed with the UTF-8 bytes of the signing secret, of the ASCII timestamp, a period, and the raw body.
    /// Thread-safe.
    /// </summary>
    public static class WebhookSignature
    {
        #region Public-Members

        /// <summary>
        /// Signature header name: X-Garrison-Signature.
        /// </summary>
        public static readonly string SignatureHeader = "X-Garrison-Signature";

        /// <summary>
        /// Delivery identifier header name: X-Garrison-Delivery.
        /// </summary>
        public static readonly string DeliveryHeader = "X-Garrison-Delivery";

        /// <summary>
        /// Event header name on notifications: X-Garrison-Event.
        /// </summary>
        public static readonly string EventHeader = "X-Garrison-Event";

        #endregion

        #region Public-Methods

        /// <summary>
        /// Compute the v1 signature of a body.
        /// </summary>
        /// <param name="secret">Signing secret.</param>
        /// <param name="unixSeconds">Timestamp (Unix seconds).</param>
        /// <param name="body">Raw body bytes; null is treated as empty.</param>
        /// <returns>Lowercase hexadecimal HMAC-SHA256.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null or empty.</exception>
        public static string Sign(string secret, long unixSeconds, byte[]? body)
        {
            if (String.IsNullOrEmpty(secret)) throw new ArgumentNullException(nameof(secret));
            return Convert.ToHexString(Hmac(Encoding.UTF8.GetBytes(secret), unixSeconds, body)).ToLowerInvariant();
        }

        /// <summary>
        /// Build the X-Garrison-Signature header value for a body.
        /// </summary>
        /// <param name="secret">Signing secret.</param>
        /// <param name="unixSeconds">Timestamp (Unix seconds).</param>
        /// <param name="body">Raw body bytes; null is treated as empty.</param>
        /// <returns>t=&lt;unix&gt;,v1=&lt;hex&gt;.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null or empty.</exception>
        public static string Header(string secret, long unixSeconds, byte[]? body)
        {
            return "t=" + unixSeconds.ToString(CultureInfo.InvariantCulture) + ",v1=" + Sign(secret, unixSeconds, body);
        }

        /// <summary>
        /// Verify an X-Garrison-Signature header against the raw body: any v1 value may match (constant-time comparison),
        /// and the timestamp must be within the tolerance of the current time.
        /// </summary>
        /// <param name="header">Header value, or null.</param>
        /// <param name="secret">Signing secret.</param>
        /// <param name="body">Raw body bytes; null is treated as empty.</param>
        /// <param name="toleranceSeconds">Largest accepted clock difference in seconds, in either direction. Default 300, minimum 1.</param>
        /// <returns>True when the signature is valid and fresh.</returns>
        public static bool Verify(string? header, string secret, byte[]? body, int toleranceSeconds = 300)
        {
            if (String.IsNullOrWhiteSpace(header) || String.IsNullOrEmpty(secret)) return false;
            long? timestamp = null;
            List<byte[]> candidates = new List<byte[]>();
            foreach (string part in header.Split(','))
            {
                string item = part.Trim();
                int equals = item.IndexOf('=');
                if (equals <= 0) return false;
                string name = item.Substring(0, equals).Trim();
                string value = item.Substring(equals + 1).Trim();
                if (name == "t")
                {
                    if (timestamp.HasValue || !Int64.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out long parsed)) return false;
                    timestamp = parsed;
                }
                else if (name == "v1")
                {
                    if (value.Length != 64) return false;
                    try
                    {
                        candidates.Add(Convert.FromHexString(value));
                    }
                    catch (FormatException)
                    {
                        return false;
                    }
                }
            }
            if (!timestamp.HasValue || candidates.Count == 0) return false;
            if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - timestamp.Value) > Math.Max(1, toleranceSeconds)) return false;
            byte[] expected = Hmac(Encoding.UTF8.GetBytes(secret), timestamp.Value, body);
            bool matched = false;
            foreach (byte[] candidate in candidates)
            {
                if (CryptographicOperations.FixedTimeEquals(candidate, expected)) matched = true;
            }
            return matched;
        }

        #endregion

        #region Private-Methods

        private static byte[] Hmac(byte[] key, long unixSeconds, byte[]? body)
        {
            byte[] prefix = Encoding.ASCII.GetBytes(unixSeconds.ToString(CultureInfo.InvariantCulture) + ".");
            byte[] payload = body ?? Array.Empty<byte>();
            byte[] message = new byte[prefix.Length + payload.Length];
            Buffer.BlockCopy(prefix, 0, message, 0, prefix.Length);
            Buffer.BlockCopy(payload, 0, message, prefix.Length, payload.Length);
            return HMACSHA256.HashData(key, message);
        }

        #endregion
    }
}
