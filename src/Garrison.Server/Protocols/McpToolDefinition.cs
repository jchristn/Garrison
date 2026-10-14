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
        /// JSON Schema for the tool input as most callers see it in tools/list: without administrator-only arguments.
        /// </summary>
        public string InputSchemaJson { get; set; } = "{\"type\":\"object\",\"properties\":{}}";

        /// <summary>
        /// JSON Schema for the tool input including administrator-only arguments (tenantId). Shown in tools/list only
        /// to system administrators, and registered with the MCP server so arguments are validated against it.
        /// </summary>
        public string AdministratorInputSchemaJson { get; set; } = "{\"type\":\"object\",\"properties\":{}}";

        /// <summary>
        /// Resource type the tool requires.
        /// </summary>
        public Garrison.Core.Enums.ResourceTypeEnum ResourceType { get; set; } = Garrison.Core.Enums.ResourceTypeEnum.Agent;

        /// <summary>
        /// Operation the tool requires.
        /// </summary>
        public Garrison.Core.Enums.OperationTypeEnum Operation { get; set; } = Garrison.Core.Enums.OperationTypeEnum.Read;

        /// <summary>Tenant configuration tool. Hidden from and denied to hosted run tokens.</summary>
        public bool ManagementTool { get; set; } = false;

        /// <summary>
        /// Tool for people and API credentials only: hidden from and denied to hosted run and node tokens. True for every
        /// management tool and for the pipeline tools (D-048). Default false.
        /// </summary>
        public bool UserOnly { get; set; } = false;

        /// <summary>
        /// True for an agent offered as its own MCP tool (exposeMcpTool): calling it invokes that agent in the caller's
        /// tenant and waits for the answer. False for the built-in Garrison tools.
        /// </summary>
        public bool AgentTool { get; set; } = false;
    }
}
