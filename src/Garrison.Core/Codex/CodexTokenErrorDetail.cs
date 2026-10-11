namespace Garrison.Core.Codex
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// The nested error object of a <see cref="CodexTokenNestedErrorResponse"/>.
    /// </summary>
    public class CodexTokenErrorDetail
    {
        #region Public-Members

        /// <summary>
        /// Error code, or null.
        /// </summary>
        [JsonPropertyName("code")]
        public string? Code { get; set; } = null;

        /// <summary>
        /// Message, or null.
        /// </summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; } = null;

        #endregion
    }
}
