namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Worker heartbeat.
    /// </summary>
    public class NodeHeartbeatRequest
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Leases currently held.
        /// </summary>
        public List<NodeRunLease> ActiveRuns { get; set; } = new List<NodeRunLease>();

        /// <summary>
        /// Free run slots.
        /// </summary>
        public int FreeCapacity { get; set; } = 0;

        /// <summary>
        /// Whether the worker is draining.
        /// </summary>
        public bool Draining { get; set; } = false;
    }
}
