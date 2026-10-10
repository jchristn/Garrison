namespace Garrison.Server.Runtime
{
    /// <summary>
    /// Whether this replica currently holds the maintenance leader lease. Published by the runtime module so other
    /// modules can restrict singleton work (retention, pruning) to the leader.
    /// </summary>
    public interface ILeaderState
    {
        /// <summary>
        /// Whether this replica is the leader.
        /// </summary>
        bool IsLeader { get; }

        /// <summary>
        /// Leader fencing epoch, or 0 when not leader.
        /// </summary>
        long Epoch { get; }
    }
}
