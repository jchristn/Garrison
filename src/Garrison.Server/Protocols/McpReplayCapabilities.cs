namespace Garrison.Server.Protocols
{
    /// <summary>
    /// Client capabilities sent when a replica replays an initialize handshake for a session another replica opened.
    /// Empty: Garrison's MCP server never calls back into the client (no sampling, roots, or elicitation), so the
    /// original capabilities are not stored.
    /// </summary>
    public class McpReplayCapabilities
    {
    }
}
