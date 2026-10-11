namespace Garrison.Core.Codex
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The <c>tokens</c> object of a Codex CLI <c>auth.json</c> ChatGPT login. Fields Garrison does not interpret are
    /// kept in <see cref="Extra"/>. Not thread-safe.
    /// </summary>
    public class CodexAuthTokens
    {
        #region Public-Members

        /// <summary>
        /// OpenID Connect ID token (a JWT), or null.
        /// </summary>
        [JsonPropertyName("id_token")]
        public string? IdToken { get; set; } = null;

        /// <summary>
        /// Access token (a JWT whose exp claim says when it expires), or null.
        /// </summary>
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; } = null;

        /// <summary>
        /// Refresh token, or null. OpenAI rotates it on every refresh, so a used refresh token never works twice.
        /// </summary>
        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; } = null;

        /// <summary>
        /// ChatGPT account identifier, or null.
        /// </summary>
        [JsonPropertyName("account_id")]
        public string? AccountId { get; set; } = null;

        /// <summary>
        /// Fields Garrison does not interpret, written back as they were read. Null when there are none.
        /// </summary>
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? Extra { get; set; } = null;

        #endregion
    }
}
