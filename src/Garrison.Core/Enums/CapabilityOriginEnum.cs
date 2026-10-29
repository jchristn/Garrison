namespace Garrison.Core.Enums
{
    /// <summary>
    /// How a capability descriptor is maintained (AD-022).
    /// </summary>
    public enum CapabilityOriginEnum
    {
        /// <summary>
        /// Garrison keeps it in step with its source: an agent revision, an MCP server's tool list, or a harness tool
        /// probe. Derived descriptors cannot be edited or deleted through the API; they follow their source.
        /// </summary>
        Derived,

        /// <summary>
        /// Written by a person for something Garrison cannot derive. Garrison never changes it, apart from hints.
        /// </summary>
        Manual
    }
}
