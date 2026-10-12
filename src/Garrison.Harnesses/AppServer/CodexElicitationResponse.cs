namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Answer to <c>mcpServer/elicitation/request</c> (<c>McpServerElicitationRequestResponse</c>).
    /// </summary>
    public class CodexElicitationResponse
    {
        #region Public-Members

        /// <summary>
        /// Action: accept, decline, or cancel. Default decline.
        /// </summary>
        [JsonPropertyName("action")]
        public string Action
        {
            get
            {
                return _Action;
            }
            set
            {
                _Action = value ?? "decline";
            }
        }

        /// <summary>
        /// Structured input for an accepted elicitation; null otherwise (always written).
        /// </summary>
        [JsonPropertyName("content")]
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public object? Content { get; set; } = null;

        /// <summary>
        /// Client metadata; null (always written).
        /// </summary>
        [JsonPropertyName("_meta")]
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public object? Meta { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Action = "decline";

        #endregion
    }
}
