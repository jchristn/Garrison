namespace Garrison.Core.Enums
{
    /// <summary>
    /// Where a scoped memory entry lives, and so who may read and write it (AA4, AA-018). See MemoryAccessPolicy.
    /// </summary>
    public enum MemoryScopeKindEnum
    {
        /// <summary>
        /// Private memory of one agent. The scope identifier is the agent identifier. The agent's runs read and write it.
        /// </summary>
        Agent,

        /// <summary>
        /// Shared memory of one agentic app. The scope identifier is the app identifier. Runs of the app's member agents
        /// read and write it.
        /// </summary>
        App,

        /// <summary>
        /// Shared memory of one organization unit (AA7). The scope identifier is the unit identifier. A run reads and
        /// writes its own unit's scope, reads the units above it, and reads the units below it when it leads its unit.
        /// </summary>
        OrgUnit,

        /// <summary>
        /// Shared memory of one organization (AA7). The scope identifier is the organization identifier. Every member
        /// run reads it; only the lead of the root unit writes it.
        /// </summary>
        Organization
    }
}
