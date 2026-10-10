namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// A Garrison MCP tool: name, description template key, input schema, and required permission.
    /// </summary>
    public class McpToolDefinition
    {
        /// <summary>
        /// Tool name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Built-in prompt template whose content is the tool description.
        /// </summary>
        public string DescriptionTemplate { get; set; } = String.Empty;

        /// <summary>
        /// Default description content seeded into the built-in template.
        /// </summary>
        public string DefaultDescription { get; set; } = String.Empty;

        /// <summary>
        /// JSON Schema for the tool input.
        /// </summary>
        public string InputSchemaJson { get; set; } = "{\"type\":\"object\",\"properties\":{}}";

        /// <summary>
        /// Resource type the tool requires.
        /// </summary>
        public Garrison.Core.Enums.ResourceTypeEnum ResourceType { get; set; } = Garrison.Core.Enums.ResourceTypeEnum.Agent;

        /// <summary>
        /// Operation the tool requires.
        /// </summary>
        public Garrison.Core.Enums.OperationTypeEnum Operation { get; set; } = Garrison.Core.Enums.OperationTypeEnum.Read;
    }
}
