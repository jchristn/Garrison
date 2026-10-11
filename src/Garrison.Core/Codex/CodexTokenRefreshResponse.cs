namespace Garrison.Core.Codex
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Successful response of the token endpoint to a refresh request. Each token is optional; a token the response
    /// omits keeps its previous value, as the Codex CLI does.
    /// </summary>
    public class CodexTokenRefreshResponse
    {
        #region Public-Members

        /// <summary>
        /// New ID token, or null.
        /// </summary>
        [JsonPropertyName("id_token")]
        public string? IdToken { get; set; } = null;

        /// <summary>
        /// New access token, or null.
        /// </summary>
        [JsonPropertyName("access_token")]
        public string? AccessToken { get; set; } = null;

        /// <summary>
        /// Replacement refresh token, or null.
        /// </summary>
        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; } = null;

        #endregion
    }
}
