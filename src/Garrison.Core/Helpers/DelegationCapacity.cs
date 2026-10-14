namespace Garrison.Core.Helpers
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// Delegation capacity rules shared by admission and the scheduler (P12.38). A worker keeps MaxConcurrentRuns
    /// regular slots plus a child reserve: one reserve slot opens for each of its runs waiting on a child, up to
    /// ChildReserveSlots, and only a queued child whose parent waits on it may use one. The number of runs waiting on a
    /// node is capped so they can never hold every regular and reserve slot at once. Thread-safe.
    /// </summary>
    public static class DelegationCapacity
    {
        #region Public-Methods

        /// <summary>
        /// Most runs on a node that may wait on a child at the same time: MaxResidentWaiters (0 means MaxConcurrentRuns),
        /// and at most MaxConcurrentRuns plus ChildReserveSlots minus one, so at least one slot never holds a waiting run.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <returns>Cap, 0 or more.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public static int MaxWaiters(Node node)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            int configured = node.MaxResidentWaiters > 0 ? node.MaxResidentWaiters : node.MaxConcurrentRuns;
            int slotBound = node.MaxConcurrentRuns + node.ChildReserveSlots - 1;
            return Math.Max(0, Math.Min(configured, slotBound));
        }

        /// <summary>
        /// Child reserve slots open on a node: one per run waiting on a child there, up to ChildReserveSlots.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="waiters">Runs on the node waiting on a child.</param>
        /// <returns>Open reserve slots, 0 or more.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public static int OpenReserveSlots(Node node, long waiters)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            return (int)Math.Max(0, Math.Min(node.ChildReserveSlots, waiters));
        }

        #endregion
    }
}
