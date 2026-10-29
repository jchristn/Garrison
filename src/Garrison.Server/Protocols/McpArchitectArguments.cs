namespace Garrison.Server.Protocols
{
    /// <summary>Typed architect prompt tool arguments (AD7.14).</summary>
    public class McpArchitectArguments
    {
        /// <summary>Architect deployment identifier or name, for get and set.</summary>
        public string? Deployment { get; set; } = null;

        /// <summary>System template identifier or name, for set.</summary>
        public string? ArchitectPromptTemplateId { get; set; } = null;

        /// <summary>Version to pin, for set; omit to follow the current version.</summary>
        public int? ArchitectPromptVersion { get; set; } = null;
    }
}
