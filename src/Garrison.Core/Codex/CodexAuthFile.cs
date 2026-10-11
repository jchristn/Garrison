namespace Garrison.Core.Codex
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The Codex CLI <c>auth.json</c> file stored in a CodexAuthJson secret (G-22). Only the fields Garrison reads or
    /// writes are typed; every other field is kept in <see cref="Extra"/> and written back unchanged, so a refresh
    /// never drops a field Codex expects. Not thread-safe.
    /// </summary>
    public class CodexAuthFile
    {
        #region Public-Members

        /// <summary>
        /// API key, when the login is an API key login. Null for a ChatGPT login. Always written, as Codex writes it.
        /// </summary>
        [JsonPropertyName("OPENAI_API_KEY")]
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public string? OpenAiApiKey { get; set; } = null;

        /// <summary>
        /// ChatGPT login tokens, or null for an API key login.
        /// </summary>
        [JsonPropertyName("tokens")]
        public CodexAuthTokens? Tokens { get; set; } = null;

        /// <summary>
        /// When the tokens were last refreshed, as the RFC 3339 text Codex writes (for example
        /// <c>2026-10-11T08:00:00.123456Z</c>), or null. Kept as text so an unusual format never breaks parsing.
        /// </summary>
        [JsonPropertyName("last_refresh")]
        public string? LastRefresh { get; set; } = null;

        /// <summary>
        /// Fields Garrison does not interpret, written back as they were read. Null when there are none.
        /// </summary>
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? Extra { get; set; } = null;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether the file holds a ChatGPT login that can be refreshed: tokens with a non-empty refresh token.
        /// </summary>
        /// <returns>True when refreshable.</returns>
        public bool IsRefreshable()
        {
            return Tokens != null && !String.IsNullOrEmpty(Tokens.RefreshToken);
        }

        /// <summary>
        /// The parsed <see cref="LastRefresh"/> time (UTC), or null when it is missing or unreadable.
        /// </summary>
        /// <returns>Time or null.</returns>
        public DateTime? LastRefreshUtc()
        {
            if (String.IsNullOrWhiteSpace(LastRefresh)) return null;
            if (DateTimeOffset.TryParse(LastRefresh, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AssumeUniversal, out DateTimeOffset parsed)) return parsed.UtcDateTime;
            return null;
        }

        #endregion
    }
}
