namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// A run lease held by a worker.
    /// </summary>
    public class NodeRunLease
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Fencing epoch.
        /// </summary>
        public long Epoch { get; set; } = 0;
    }
}
