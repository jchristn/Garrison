namespace Garrison.Core.Enums
{
    /// <summary>
    /// Where a capability comes from (AD-006). The catalog treats the three the same way.
    /// </summary>
    public enum CapabilityKindEnum
    {
        /// <summary>
        /// A Garrison agent, described from its latest published revision.
        /// </summary>
        Agent,

        /// <summary>
        /// A tool of an MCP server registered in the tenant, described from the server's tools/list.
        /// </summary>
        McpTool,

        /// <summary>
        /// Something the harness or its host provides, such as pandoc or LibreOffice, reported by worker tool probes.
        /// A run that needs one is placed on a node that reports it.
        /// </summary>
        HarnessBuiltIn
    }
}
