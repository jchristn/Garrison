namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Registration result with protocol timing the worker should use.
    /// </summary>
    public class NodeRegisterResponse
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Heartbeat interval in milliseconds.
        /// </summary>
        public int HeartbeatIntervalMs { get; set; } = 5000;

        /// <summary>
        /// Lease long-poll wait in milliseconds.
        /// </summary>
        public int LeaseWaitMs { get; set; } = 20000;

        /// <summary>
        /// Lease duration in milliseconds; heartbeats extend it.
        /// </summary>
        public int LeaseDurationMs { get; set; } = 30000;
    }
}
