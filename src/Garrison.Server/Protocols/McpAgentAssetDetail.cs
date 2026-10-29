namespace Garrison.Server.Protocols
{
    using Garrison.Core.Models;

    /// <summary>An asset with one of its versions, as garrison_get_agent_asset returns it (AD2.7).</summary>
    public class McpAgentAssetDetail
    {
        /// <summary>Asset.</summary>
        public AgentAsset Asset { get; set; } = new AgentAsset();

        /// <summary>The requested version with its file list, or null when the asset has none (always null for SystemPrompt assets).</summary>
        public AgentAssetVersion? Version { get; set; } = null;
    }
}
