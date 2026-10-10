namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// Point-in-time view of the Ready nodes (with capabilities and labels) and node pools, used to explain why queued
    /// runs are blocked. Treat as immutable once built; safe to share between threads.
    /// </summary>
    public class PlacementSnapshot
    {
        #region Public-Members

        /// <summary>
        /// Nodes whose status is Ready.
        /// </summary>
        public List<Node> ReadyNodes
        {
            get
            {
                return _ReadyNodes;
            }
            set
            {
                _ReadyNodes = value ?? new List<Node>();
            }
        }

        /// <summary>
        /// Node pools by identifier.
        /// </summary>
        public Dictionary<string, NodePool> Pools
        {
            get
            {
                return _Pools;
            }
            set
            {
                _Pools = value ?? new Dictionary<string, NodePool>(StringComparer.Ordinal);
            }
        }

        /// <summary>
        /// When the snapshot was taken (UTC).
        /// </summary>
        public DateTime TakenUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private List<Node> _ReadyNodes = new List<Node>();
        private Dictionary<string, NodePool> _Pools = new Dictionary<string, NodePool>(StringComparer.Ordinal);

        #endregion

        #region Public-Methods

        /// <summary>
        /// The pool a node belongs to, or null.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <returns>Pool or null.</returns>
        public NodePool? PoolOf(Node node)
        {
            if (node == null || String.IsNullOrEmpty(node.NodePoolId)) return null;
            return _Pools.TryGetValue(node.NodePoolId, out NodePool? pool) ? pool : null;
        }

        #endregion
    }
}
