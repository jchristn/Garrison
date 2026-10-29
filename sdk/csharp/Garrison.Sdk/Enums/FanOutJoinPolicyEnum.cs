namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// When a fan-out group is joined, meaning its parent run has the results it needs.
    /// </summary>
    public enum FanOutJoinPolicyEnum
    {
        /// <summary>
        /// Every member finished, whatever its outcome.
        /// </summary>
        All,

        /// <summary>
        /// One member succeeded, or every member finished without one succeeding.
        /// </summary>
        Any,

        /// <summary>
        /// At least the group's quorum of members succeeded, or so many failed that the quorum can no longer be met.
        /// </summary>
        Quorum
    }
}
