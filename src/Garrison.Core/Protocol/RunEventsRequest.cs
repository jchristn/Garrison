namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Batch of run events.
    /// </summary>
    public class RunEventsRequest
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
        /// Events in sequence order.
        /// </summary>
        public List<RunEventReport> Events { get; set; } = new List<RunEventReport>();
    }
}
