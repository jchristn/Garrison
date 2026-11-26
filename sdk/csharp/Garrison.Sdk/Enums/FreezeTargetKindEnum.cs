namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What a freeze stops (AA3).
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
        /// An org unit and everything beneath it. The target identifier is the unit identifier.
        /// </summary>
        OrgUnit,

        /// <summary>
        /// A whole organization. The target identifier is the organization identifier.
        /// </summary>
        Organization,

        /// <summary>
        /// The autonomy kill switch. The target identifier is the tenant identifier. Set it with the kill switch methods, not by applying a freeze.
        /// </summary>
        TenantAutonomy
    }
}
