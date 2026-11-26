namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Lifecycle of a canary release (AA9.8).
    /// </summary>
    public enum CanaryStatusEnum
    {
        /// <summary>
        /// The candidate deployment receives the current step's weight while health is watched.
        /// </summary>
        Running,

        /// <summary>
        /// Every step passed; the candidate carries all traffic.
        /// </summary>
        Promoted,

        /// <summary>
        /// A threshold was crossed; weights were restored and CanaryRolledBack was notified. See rollbackReason.
        /// </summary>
        RolledBack,

        /// <summary>
        /// A person aborted the release; weights were restored.
        /// </summary>
        Aborted
    }
}
