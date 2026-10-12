namespace Garrison.Harnesses.AppServer
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// An MCP <c>tools/call</c> result: content blocks and the error flag.
    /// </summary>
    public class McpToolCallReply
    {
        #region Public-Members

        /// <summary>
        /// Content blocks.
        /// </summary>
        [JsonPropertyName("content")]
        public List<McpTextContent>? Content { get; set; } = null;

        /// <summary>
        /// Whether the tool reported an error.
        /// </summary>
        [JsonPropertyName("isError")]
        public bool IsError { get; set; } = false;

        #endregion
    }
}
