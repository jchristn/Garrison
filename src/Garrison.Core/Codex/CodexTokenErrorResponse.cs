namespace Garrison.Core.Codex
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Standard OAuth error body from the token endpoint: <c>{"error": "invalid_grant", "error_description": "..."}</c>,
    /// sometimes with a top-level <c>code</c>. See <see cref="CodexTokenNestedErrorResponse"/> for the nested form.
    /// </summary>
    public class CodexTokenErrorResponse
    {
        #region Public-Members

        /// <summary>
        /// Error code, for example <c>invalid_grant</c> or <c>refresh_token_reused</c>, or null.
        /// </summary>
        [JsonPropertyName("error")]
        public string? Error { get; set; } = null;

        /// <summary>
        /// Human-readable description, or null.
        /// </summary>
        [JsonPropertyName("error_description")]
        public string? ErrorDescription { get; set; } = null;

        /// <summary>
        /// Top-level code some issuers add, or null.
        /// </summary>
        [JsonPropertyName("code")]
        public string? Code { get; set; } = null;

        #endregion
    }
}
