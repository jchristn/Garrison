namespace Garrison.Core.Enums
{
    /// <summary>
    /// MCP configuration file format a harness expects.
    /// </summary>
    public enum McpConfigFormatEnum
    {
        /// <summary>
        /// None.
        /// </summary>
        None,

        /// <summary>
        /// ClaudeJson.
        /// </summary>
        ClaudeJson,

        /// <summary>
        /// CodexToml.
        /// </summary>
        CodexToml,

        /// <summary>
        /// MuxJson.
        /// </summary>
        MuxJson,

        /// <summary>
        /// GeminiSettings.
        /// </summary>
        GeminiSettings,

        /// <summary>
        /// OpenCodeJson: an opencode config file (OPENCODE_CONFIG) with an <c>mcp</c> object of <c>local</c> and
        /// <c>remote</c> servers.
        /// </summary>
        OpenCodeJson,

        /// <summary>
        /// PiJson: a pi <c>mcp.json</c> (<c>mcpServers</c>) in the agent directory named by PI_CODING_AGENT_DIR.
        /// </summary>
        PiJson
    }
}
