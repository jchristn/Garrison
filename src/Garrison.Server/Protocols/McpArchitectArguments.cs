namespace Garrison.Server.Protocols
{
    /// <summary>Typed architect and architect prompt tool arguments (AD7.14).</summary>
    public class McpArchitectArguments
    {
        /// <summary>Architect deployment identifier or name, for the architect prompt get and set tools.</summary>
        public string? Deployment { get; set; } = null;

        /// <summary>Architect identifier or name, for get, update, and delete.</summary>
        public string? Architect { get; set; } = null;

        /// <summary>Architect name, for create and update.</summary>
        public string? Name { get; set; } = null;

        /// <summary>Description, for create and update.</summary>
        public string? Description { get; set; } = null;

        /// <summary>Harness profile identifier, for create and update.</summary>
        public string? HarnessProfileId { get; set; } = null;

        /// <summary>Model, for create and update; null keeps the harness profile's default.</summary>
        public string? Model { get; set; } = null;

        /// <summary>Whether the architect accepts new turns, for create and update.</summary>
        public bool? Active { get; set; } = null;

        /// <summary>System template identifier or name, for set, create, and update.</summary>
        public string? ArchitectPromptTemplateId { get; set; } = null;

        /// <summary>Version to pin, for set, create, and update; omit to follow the current version.</summary>
        public int? ArchitectPromptVersion { get; set; } = null;

        /// <summary>Part of a name to match, for the list tools.</summary>
        public string? Search { get; set; } = null;

        /// <summary>Only active architects, for list.</summary>
        public bool? ActiveOnly { get; set; } = null;

        /// <summary>Page size for the list tools. Minimum 1, maximum 100, default 25.</summary>
        public int? MaxResults { get; set; } = null;

        /// <summary>Records to skip for the list tools. Minimum 0, default 0.</summary>
        public int? Skip { get; set; } = null;
    }
}
