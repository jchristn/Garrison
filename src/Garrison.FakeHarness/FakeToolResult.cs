namespace Garrison.FakeHarness
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// An MCP tools/call result as the fake harness reads it.
    /// </summary>
    public class FakeToolResult
    {
        #region Public-Members

        /// <summary>
        /// Content blocks.
        /// </summary>
        [JsonPropertyName("content")]
        public List<FakeToolContent>? Content { get; set; } = null;

        #endregion
    }
}
