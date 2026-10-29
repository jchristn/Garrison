namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;

    /// <summary>Typed agent asset tool arguments (AD2.7). Tenant identity comes from the authenticated caller.</summary>
    public class McpAgentAssetArguments
    {
        /// <summary>Asset identifier or name, for every tool except list and create.</summary>
        public string? Asset { get; set; } = null;

        /// <summary>Version number to read; default the current version.</summary>
        public int? Version { get; set; } = null;

        /// <summary>Kind filter for list: SystemPrompt, Skill, ReferenceFile, or DocumentTemplate.</summary>
        public string? Kind { get; set; } = null;

        /// <summary>Name search for list.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Most assets to list, 1 to 100. Default 25.</summary>
        public int? MaxResults { get; set; } = null;

        /// <summary>Asset configuration for create and update.</summary>
        public AgentAsset? Configuration { get; set; } = null;

        /// <summary>Files of a new version: path, optional mediaType, and content (text) or contentBase64.</summary>
        public List<AgentAssetFileSpec>? Files { get; set; } = null;

        /// <summary>Change note of a new version.</summary>
        public string? ChangeNote { get; set; } = null;
    }
}
