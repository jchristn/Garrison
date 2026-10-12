namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Cancellation watch result.
    /// </summary>
    public class NodeWatchResponse
    {
        /// <summary>
        /// Watched runs the worker must cancel now.
        /// </summary>
        public List<string> CancelRunIds { get; set; } = new List<string>();

        /// <summary>
        /// Approvals of watched runs in states the worker has not recorded yet (P12.3); empty unless the request set
        /// RelayApprovals.
        /// </summary>
        public List<NodeApprovalNotice> Approvals { get; set; } = new List<NodeApprovalNotice>();
    }
}
