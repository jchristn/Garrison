namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of the <c>turn/completed</c> notification (<c>TurnCompletedNotification</c>).
    /// </summary>
    public class CodexTurnCompletedNotification
    {
        #region Public-Members

        /// <summary>
        /// Thread identifier.
        /// </summary>
        [JsonPropertyName("threadId")]
        public string? ThreadId { get; set; } = null;

        /// <summary>
        /// The finished turn.
        /// </summary>
        [JsonPropertyName("turn")]
        public CodexTurn? Turn { get; set; } = null;

        #endregion
    }
}
