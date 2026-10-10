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
    }
}
