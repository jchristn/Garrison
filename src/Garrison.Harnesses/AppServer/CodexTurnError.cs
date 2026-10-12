namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Error of a failed or interrupted turn (<c>TurnError</c>, the parts the driver reads).
    /// </summary>
    public class CodexTurnError
    {
        #region Public-Members

        /// <summary>
        /// Message.
        /// </summary>
        [JsonPropertyName("message")]
        public string? Message { get; set; } = null;

        /// <summary>
        /// Additional details, or null.
        /// </summary>
        [JsonPropertyName("additionalDetails")]
        public string? AdditionalDetails { get; set; } = null;

        #endregion
    }
}
