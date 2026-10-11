namespace Garrison.Core.Codex
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Error body with a nested error object: <c>{"error": {"code": "refresh_token_reused", "message": "..."}}</c>.
    /// </summary>
    public class CodexTokenNestedErrorResponse
    {
        #region Public-Members

        /// <summary>
        /// Nested error, or null.
        /// </summary>
        [JsonPropertyName("error")]
        public CodexTokenErrorDetail? Error { get; set; } = null;

        /// <summary>
        /// Top-level code some issuers add, or null.
        /// </summary>
        [JsonPropertyName("code")]
        public string? Code { get; set; } = null;

        #endregion
    }
}
