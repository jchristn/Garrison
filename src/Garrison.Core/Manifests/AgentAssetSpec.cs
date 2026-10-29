namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

    /// <summary>
    /// AgentAsset manifest spec (AD2.6). References use names.
    /// </summary>
    public class AgentAssetSpec
    {
        /// <summary>
        /// Kind: SystemPrompt, Skill, ReferenceFile, or DocumentTemplate. Required.
        /// </summary>
        public string? Kind { get; set; } = null;

        /// <summary>
        /// Description.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Prompt template name, for SystemPrompt assets.
        /// </summary>
        public string? PromptTemplate { get; set; } = null;

        /// <summary>
        /// Artifact store name, or null to keep the files in the Garrison database.
        /// </summary>
        public string? ArtifactStore { get; set; } = null;

        /// <summary>
        /// Tags.
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();

        /// <summary>
        /// Files of the current version. Omit to leave the files alone.
        /// </summary>
        public List<AgentAssetFileSpec>? Files { get; set; } = null;

        /// <summary>
        /// Change note for a new version written by this document.
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
