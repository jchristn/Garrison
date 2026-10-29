namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Kind of a capability catalog entry.
    /// </summary>
    public enum CapabilityKindEnum
    {
        /// <summary>
        /// An agent, described from its latest published revision.
        /// </summary>
        Agent,

        /// <summary>
        /// A tool exposed by a registered MCP server.
        /// </summary>
        McpTool,

        /// <summary>
        /// A tool a harness can use when its host has it installed (declared by a harness profile tool probe), such as
        /// pandoc.
        /// </summary>
        HarnessBuiltIn
    }
}
