namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Threading.Tasks;
    using Garrison.Core.Enums;

    /// <summary>
    /// One lease long poll registered with <see cref="LeaseWaiters"/> for as long as its request lasts (P10.24). Every
    /// member other than the identifiers is guarded by the owning <see cref="LeaseWaiters"/> lock; use the owner's
    /// methods, not the members, from outside it.
    /// </summary>
    public class LeaseWaiter
    {
        #region Public-Members

        /// <summary>
        /// Identifier of this registration.
        /// </summary>
        public string Id { get; } = Guid.NewGuid().ToString("N");

        /// <summary>
        /// Node the poll leases for.
        /// </summary>
        public string NodeId { get; }

        /// <summary>
        /// Whether this is a child reserve poll (P12.38), which only takes delegated runs.
        /// </summary>
        public bool ChildReserve { get; }

        /// <summary>
        /// Node pool of the node, or null when the node is in no pool.
        /// </summary>
        public string? NodePoolId { get; set; } = null;

        /// <summary>
        /// Harnesses the node can run.
        /// </summary>
        public HashSet<HarnessTypeEnum> HarnessTypes { get; } = new HashSet<HarnessTypeEnum>();

        /// <summary>
        /// True while the poll sleeps waiting for a notice; false while it looks for work.
        /// </summary>
        public bool Sleeping { get; set; } = false;

        /// <summary>
        /// Order in which sleeping polls fell asleep; the poll asleep longest is woken first.
        /// </summary>
        public long SleepSequence { get; set; } = 0;

        /// <summary>
        /// The notice that made this poll look for work, which it must take or hand on, or null.
        /// </summary>
        public QueueNotice? Current { get; set; } = null;

        /// <summary>
        /// Why the poll was last woken.
        /// </summary>
        public LeaseWakeEnum Reason { get; set; } = LeaseWakeEnum.Poll;

        /// <summary>
        /// Completion source the sleeping poll waits on, or null while it is awake.
        /// </summary>
        public TaskCompletionSource<bool>? Wake { get; set; } = null;

        /// <summary>
        /// Broadcast generation this poll has seen; a newer one makes it look for work again instead of sleeping.
        /// </summary>
        public long BroadcastSeen { get; set; } = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate. Use <see cref="LeaseWaiters.Register"/>.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="childReserve">Whether this is a child reserve poll.</param>
        /// <exception cref="ArgumentNullException">Thrown when nodeId is null or empty.</exception>
        public LeaseWaiter(string nodeId, bool childReserve)
        {
            if (String.IsNullOrEmpty(nodeId)) throw new ArgumentNullException(nameof(nodeId));
            NodeId = nodeId;
            ChildReserve = childReserve;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether this poll could take the run a notice describes, judged by harness, node pool, and (for the child
        /// reserve) delegation. Tenant dedication, labels, executor capabilities, affinity, and limits are not checked
        /// here; a poll that cannot take the run after all hands the notice on.
        /// </summary>
        /// <param name="notice">Notice.</param>
        /// <returns>True when the poll may be able to take the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when notice is null.</exception>
        public bool Matches(QueueNotice notice)
        {
            if (notice == null) throw new ArgumentNullException(nameof(notice));
            if (!HarnessTypes.Contains(notice.HarnessType)) return false;
            if (notice.NodePoolId != null && !String.Equals(notice.NodePoolId, NodePoolId, StringComparison.Ordinal)) return false;
            if (ChildReserve && !notice.Delegated) return false;
            return true;
        }

        #endregion
    }
}
