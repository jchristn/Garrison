namespace Garrison.Core.Enums
{
    /// <summary>
    /// Which delegation capacity limit refused a synchronous delegation (P12.38).
    /// </summary>
    public enum DelegationCapacityLimitEnum
    {
        /// <summary>
        /// No limit refused the delegation.
        /// </summary>
        None,

        /// <summary>
        /// The parent's worker node already has as many runs waiting on a child as it may keep resident: its
        /// MaxResidentWaiters, and never so many that every regular and child reserve slot would hold a waiting run.
        /// </summary>
        ResidentWaiters,

        /// <summary>
        /// The cluster already has Runs.DelegationChildQueueDepth queued children whose parents are waiting on them.
        /// </summary>
        ChildQueueDepth
    }
}
