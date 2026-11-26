namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Where a memory entry lives, and so who may read and write it (AA4).
    /// </summary>
    public enum MemoryScopeKindEnum
    {
        /// <summary>
        /// Private memory of one agent. The scope identifier is the agent identifier.
        /// </summary>
        Agent,

        /// <summary>
        /// Memory shared by the member agents of one agentic app. The scope identifier is the app identifier.
        /// </summary>
        App,

        /// <summary>
        /// Memory of one organization unit. Refused until organizations exist.
        /// </summary>
        OrgUnit,

        /// <summary>
        /// Memory of one organization. Refused until organizations exist.
        /// </summary>
        Organization
    }
}
