namespace Garrison.Core.Codex
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Body of the OAuth refresh request the Codex CLI sends to its token endpoint, as JSON with
    /// <c>Content-Type: application/json</c> (codex-rs <c>login/src/oauth/client.rs</c>, <c>OAuthClient::refresh</c>).
    /// </summary>
    public class CodexTokenRefreshRequest
    {
        #region Public-Members

        /// <summary>
        /// OAuth client identifier.
        /// </summary>
        [JsonPropertyName("client_id")]
        public string ClientId
        {
            get
            {
                return _ClientId;
            }
            set
            {
                _ClientId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Grant type. Always <c>refresh_token</c>.
        /// </summary>
        [JsonPropertyName("grant_type")]
        public string GrantType { get; set; } = "refresh_token";

        /// <summary>
        /// Refresh token being exchanged. Single use: the response carries its replacement.
        /// </summary>
        [JsonPropertyName("refresh_token")]
        public string RefreshToken
        {
            get
            {
                return _RefreshToken;
            }
            set
            {
                _RefreshToken = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _ClientId = String.Empty;
        private string _RefreshToken = String.Empty;

        #endregion
    }
}
