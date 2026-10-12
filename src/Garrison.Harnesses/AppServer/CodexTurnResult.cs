namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Result of <c>turn/start</c> (<c>TurnStartResponse</c>).
    /// </summary>
    public class CodexTurnResult
    {
        #region Public-Members

        /// <summary>
        /// The turn that started.
        /// </summary>
        [JsonPropertyName("turn")]
        public CodexTurn? Turn { get; set; } = null;

        #endregion
    }
}
