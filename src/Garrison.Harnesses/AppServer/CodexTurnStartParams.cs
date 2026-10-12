namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>turn/start</c> (<c>TurnStartParams</c>).
    /// </summary>
    public class CodexTurnStartParams
    {
        #region Public-Members

        /// <summary>
        /// Thread identifier.
        /// </summary>
        [JsonPropertyName("threadId")]
        public string ThreadId
        {
            get
            {
                return _ThreadId;
            }
            set
            {
                _ThreadId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Input items.
        /// </summary>
        [JsonPropertyName("input")]
        public List<CodexUserInput> Input
        {
            get
            {
                return _Input;
            }
            set
            {
                _Input = value ?? new List<CodexUserInput>();
            }
        }

        /// <summary>
        /// JSON Schema that constrains the final assistant message of the turn, or null.
        /// </summary>
        [JsonPropertyName("outputSchema")]
        public JsonElement? OutputSchema { get; set; } = null;

        #endregion

        #region Private-Members

        private string _ThreadId = String.Empty;
        private List<CodexUserInput> _Input = new List<CodexUserInput>();

        #endregion
    }
}
