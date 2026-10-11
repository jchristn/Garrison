namespace Garrison.Core.Codex
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The registered JWT claims Garrison reads from a Codex access token. The signature is never checked: the
    /// control plane only uses these times to decide when to refresh, and the provider validates the token itself.
    /// </summary>
    public class CodexJwtClaims
    {
        #region Public-Members

        /// <summary>
        /// Expiration time in seconds since the Unix epoch, or null.
        /// </summary>
        [JsonPropertyName("exp")]
        public long? Exp { get; set; } = null;

        /// <summary>
        /// Issue time in seconds since the Unix epoch, or null.
        /// </summary>
        [JsonPropertyName("iat")]
        public long? Iat { get; set; } = null;

        /// <summary>
        /// Expiration time (UTC), or null when the claim is missing or out of range.
        /// </summary>
        [JsonIgnore]
        public DateTime? ExpiresUtc
        {
            get
            {
                return FromUnix(Exp);
            }
        }

        /// <summary>
        /// Issue time (UTC), or null when the claim is missing or out of range.
        /// </summary>
        [JsonIgnore]
        public DateTime? IssuedUtc
        {
            get
            {
                return FromUnix(Iat);
            }
        }

        #endregion

        #region Private-Methods

        private static DateTime? FromUnix(long? seconds)
        {
            if (!seconds.HasValue) return null;
            if (seconds.Value < 0 || seconds.Value > 253402300799L) return null;
            return DateTimeOffset.FromUnixTimeSeconds(seconds.Value).UtcDateTime;
        }

        #endregion
    }
}
