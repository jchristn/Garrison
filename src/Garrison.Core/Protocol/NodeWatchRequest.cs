namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Cancellation watch (long poll): the worker names the runs it is executing and has not been told to cancel, and
    /// the control plane answers as soon as any of them is cancelled, or when the wait ends.
    /// </summary>
    public class NodeWatchRequest
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Runs to watch (run identifier and lease epoch).
        /// </summary>
        public List<NodeRunLease> Runs { get; set; } = new List<NodeRunLease>();

        /// <summary>
        /// Longest wait in milliseconds. Minimum 0, maximum 60,000, default 25,000; the control plane clamps it.
        /// </summary>
        public int WaitMs { get; set; } = 25000;
    }
}
