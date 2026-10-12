namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// One MCP content block; only text blocks are read.
    /// </summary>
    public class McpTextContent
    {
        #region Public-Members

        /// <summary>
        /// Block type, for example text.
        /// </summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; } = null;

        /// <summary>
        /// Text of a text block.
        /// </summary>
        [JsonPropertyName("text")]
        public string? Text { get; set; } = null;

        #endregion
    }
}
