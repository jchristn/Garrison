namespace Garrison.Worker.Hosting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Worker health snapshot.
    /// </summary>
    public class WorkerHealth
    {
        /// <summary>
        /// ready, not-ready, draining, or alive.
        /// </summary>
        public string Status { get; set; } = "ready";

        /// <summary>
        /// Whether the worker is registered and leasing.
        /// </summary>
        public bool Ready { get; set; } = false;

        /// <summary>
        /// Whether registration succeeded.
        /// </summary>
        public bool Registered { get; set; } = false;

        /// <summary>
        /// Whether the worker is draining.
        /// </summary>
        public bool Draining { get; set; } = false;

        /// <summary>
        /// Node name.
        /// </summary>
        public string NodeName { get; set; } = String.Empty;

        /// <summary>
        /// Node identifier assigned by the control plane.
        /// </summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// Runs currently executing.
        /// </summary>
        public int ActiveRuns { get; set; } = 0;

        /// <summary>
        /// Run capacity.
        /// </summary>
        public int MaxConcurrentRuns { get; set; } = 0;

        /// <summary>
        /// Last control-plane error, if any.
        /// </summary>
        public string? LastError { get; set; } = null;

        /// <summary>
        /// Snapshot time (UTC).
        /// </summary>
        public DateTime Utc { get; set; } = DateTime.UtcNow;
    }
}
