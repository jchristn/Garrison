namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Worker report that a run's harness started.
    /// </summary>
    public class RunStartedRequest
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Fencing epoch.
        /// </summary>
        public long Epoch { get; set; } = 0;

        /// <summary>
        /// Process identifier.
        /// </summary>
        public int? ProcessId { get; set; } = null;

        /// <summary>
        /// Start time (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.UtcNow;
    }
}
