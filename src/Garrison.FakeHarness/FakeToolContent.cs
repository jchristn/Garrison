namespace Garrison.FakeHarness
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// One MCP content block; the fake harness reads text blocks.
    /// </summary>
    public class FakeToolContent
    {
        #region Public-Members

        /// <summary>
        /// Text of a text block, or null.
        /// </summary>
        [JsonPropertyName("text")]
        public string? Text { get; set; } = null;

        #endregion
    }
}
