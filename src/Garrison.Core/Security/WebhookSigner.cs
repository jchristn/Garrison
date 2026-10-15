namespace Garrison.Core.Security
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Security.Cryptography;
    using System.Text;
    using Garrison.Core.Enums;

    /// <summary>
    /// The Garrison webhook signature scheme, used to verify inbound trigger webhooks (P12.5) and to sign outbound
    /// notifications (P12.14). The X-Garrison-Signature header is <c>t=&lt;unix seconds&gt;,v1=&lt;hex&gt;</c> where the
    /// hex value is the lowercase HMAC-SHA256, keyed with the UTF-8 bytes of the signing secret, of the ASCII timestamp,
    /// a period, and the raw request body bytes. A header may carry several v1 values; any match is accepted. Comparison
    /// is constant time. Thread-safe.
    /// </summary>
    public static class WebhookSigner
    {
        #region Public-Members

        /// <summary>
        /// Prefix of generated signing secrets: whsec_.
        /// </summary>
        public static readonly string SecretPrefix = "whsec_";

        #endregion

        #region Private-Members

        private static readonly byte[] _DecoyKey = RandomNumberGenerator.GetBytes(32);

        #endregion

        #region Public-Methods

        /// <summary>
        /// New signing secret: whsec_ followed by 40 random alphanumeric characters (about 238 bits).
        /// </summary>
        /// <returns>Secret.</returns>
        public static string NewSecret()
        {
            return SecretPrefix + SecretGenerator.Alphanumeric(40);
        }

        /// <summary>
        /// Compute the v1 signature of a body.
        /// </summary>
        /// <param name="secret">Signing secret.</param>
        /// <param name="unixSeconds">Timestamp (Unix seconds).</param>
        /// <param name="body">Raw body bytes; null is treated as empty.</param>
        /// <returns>Lowercase hexadecimal HMAC-SHA256.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null or empty.</exception>
        public static string Signature(string secret, long unixSeconds, byte[]? body)
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
        /// <returns>Header value t=&lt;unix&gt;,v1=&lt;hex&gt;.</returns>
        /// <exception cref="ArgumentNullException">Thrown when secret is null or empty.</exception>
        public static string Header(string secret, long unixSeconds, byte[]? body)
        {
            return "t=" + unixSeconds.ToString(CultureInfo.InvariantCulture) + ",v1=" + Signature(secret, unixSeconds, body);
        }

        /// <summary>
        /// Verify an X-Garrison-Signature header against a body.
        /// </summary>
        /// <param name="header">Header value, or null when absent.</param>
        /// <param name="secret">Signing secret, or null when the target does not exist (a decoy key is used so the
        /// response time does not reveal it; the result is then never Valid).</param>
        /// <param name="body">Raw body bytes; null is treated as empty.</param>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="toleranceSeconds">Largest accepted difference between the timestamp and now, in either direction.
        /// Minimum 1.</param>
        /// <returns>Result.</returns>
        public static WebhookSignatureResultEnum Verify(string? header, string? secret, byte[]? body, DateTime nowUtc, int toleranceSeconds)
        {
            if (String.IsNullOrWhiteSpace(header)) return WebhookSignatureResultEnum.Missing;
            long? timestamp = null;
            List<byte[]> candidates = new List<byte[]>();
            foreach (string part in header.Split(','))
            {
                string item = part.Trim();
                int equals = item.IndexOf('=');
                if (equals <= 0) return WebhookSignatureResultEnum.Malformed;
                string name = item.Substring(0, equals).Trim();
                string value = item.Substring(equals + 1).Trim();
                if (name == "t")
                {
                    if (timestamp.HasValue || !Int64.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out long parsed)) return WebhookSignatureResultEnum.Malformed;
                    timestamp = parsed;
                }
                else if (name == "v1")
                {
                    if (value.Length != 64) return WebhookSignatureResultEnum.Malformed;
                    try
                    {
                        candidates.Add(Convert.FromHexString(value));
                    }
                    catch (FormatException)
                    {
                        return WebhookSignatureResultEnum.Malformed;
                    }
                }
            }
            if (!timestamp.HasValue || candidates.Count == 0 || candidates.Count > 8) return WebhookSignatureResultEnum.Malformed;

            // Compute the expected value before the timestamp check so a stale and a fresh request cost the same.
            byte[] key = String.IsNullOrEmpty(secret) ? _DecoyKey : Encoding.UTF8.GetBytes(secret);
            byte[] expected = Hmac(key, timestamp.Value, body);
            bool matched = false;
            foreach (byte[] candidate in candidates)
            {
                if (CryptographicOperations.FixedTimeEquals(candidate, expected)) matched = true;
            }

            long now = new DateTimeOffset(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc)).ToUnixTimeSeconds();
            if (Math.Abs(now - timestamp.Value) > Math.Max(1, toleranceSeconds)) return WebhookSignatureResultEnum.Stale;
            if (!matched || String.IsNullOrEmpty(secret)) return WebhookSignatureResultEnum.Mismatch;
            return WebhookSignatureResultEnum.Valid;
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
