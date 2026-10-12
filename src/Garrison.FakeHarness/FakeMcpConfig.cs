namespace Garrison.FakeHarness
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// A Claude Code <c>--mcp-config</c> file.
    /// </summary>
    public class FakeMcpConfig
    {
        #region Public-Members

        /// <summary>
        /// Servers by name.
        /// </summary>
        [JsonPropertyName("mcpServers")]
        public Dictionary<string, FakeMcpServerConfig>? McpServers { get; set; } = null;

        #endregion
    }
}
