namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a freeze stops (AA3, AA-017). A freeze refuses new runs in its scope and keeps keepers in its scope from
    /// ticking until it is lifted.
    /// </summary>
    public enum FreezeTargetKindEnum
    {
        /// <summary>
        /// One agent: every run of it, on any deployment, and every keeper bound to it.
        /// </summary>
        Agent,

        /// <summary>
        /// One deployment: every run on it and every keeper bound to it.
        /// </summary>
        Deployment,

        /// <summary>
        /// One mandate: its ticks. The mandate shows status Frozen until the freeze is lifted.
        /// </summary>
        Mandate,

        /// <summary>
        /// One agentic app: every run its users start through the app gateway.
        /// </summary>
        App,

        /// <summary>
        /// An org unit and everything beneath it (AA7.7): every lead and member of the unit's subtree in the live revision.
        /// </summary>
        OrgUnit,

        /// <summary>
        /// A whole organization (AA7.7): every lead and member in its live revision. The organization's status becomes
        /// Frozen until the freeze is lifted.
        /// </summary>
        Organization,

        /// <summary>
        /// The tenant's autonomous work: the autonomy kill switch. Keeper ticks stop; ordinary invocations keep working.
        /// The target identifier is the tenant identifier.
        /// </summary>
        TenantAutonomy
    }
}
