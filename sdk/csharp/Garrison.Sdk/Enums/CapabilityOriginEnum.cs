namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Where a capability descriptor comes from.
    /// </summary>
    public enum CapabilityOriginEnum
    {
        /// <summary>
        /// Derived from its source (a published agent revision, an MCP server's tool list, or a harness tool probe) and
        /// refreshed by Garrison. Derived descriptors cannot be changed or deleted directly.
        /// </summary>
        Derived,

        /// <summary>
        /// Written by a person through the API.
        /// </summary>
        Manual
    }
}
