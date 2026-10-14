namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Lease request (long poll).
    /// </summary>
    public class NodeLeaseRequest
    {
        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Maximum runs to lease. Minimum 1, maximum 64.
        /// </summary>
        public int MaxRuns { get; set; } = 1;

        /// <summary>
        /// Maximum wait in milliseconds. Minimum 0, maximum 60000.
        /// </summary>
        public int WaitMs { get; set; } = 20000;

        /// <summary>
        /// Whether this request leases into the worker's child reserve (P12.38): only a queued delegated run whose parent
        /// waits on it is returned, and only while the node has an open reserve slot. Default false.
        /// </summary>
        public bool ChildReserve { get; set; } = false;

        /// <summary>
        /// Runs the worker is executing in its child reserve now (used with <see cref="ChildReserve"/>). The control plane
        /// counts those still active on every pass of the long poll, so a reserve run that finishes while the request
        /// waits frees its slot at once. At most 64 are read. Default empty.
        /// </summary>
        public List<string> ReserveRunIds
        {
            get
            {
                return _ReserveRunIds;
            }
            set
            {
                _ReserveRunIds = value ?? new List<string>();
            }
        }

        #region Private-Members

        private List<string> _ReserveRunIds = new List<string>();

        #endregion
    }
}
