namespace Garrison.FakeHarness
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One server of a Claude Code <c>--mcp-config</c> file, as the fake harness reads it to find the permission prompt
    /// server.
    /// </summary>
    public class FakeMcpServerConfig
    {
        #region Public-Members

        /// <summary>
        /// Transport type (http or stdio).
        /// </summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; } = null;

        /// <summary>
        /// Endpoint URL of an HTTP server.
        /// </summary>
        [JsonPropertyName("url")]
        public string? Url { get; set; } = null;

        /// <summary>
        /// Request headers of an HTTP server.
        /// </summary>
        [JsonPropertyName("headers")]
        public Dictionary<string, string>? Headers { get; set; } = null;

        #endregion
    }
}
