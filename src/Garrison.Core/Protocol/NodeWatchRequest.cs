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

        /// <summary>
        /// Whether the worker records permission approvals of its runs from the watch (P12.3). Workers that do not send
        /// it get cancellations only, as before.
        /// </summary>
        public bool RelayApprovals { get; set; } = false;

        /// <summary>
        /// Approval notices the worker already recorded, as approvalId:Status keys. The watch answers as soon as an
        /// approval of a watched run reaches a state not listed here.
        /// </summary>
        public List<string> KnownApprovals { get; set; } = new List<string>();
    }
}
