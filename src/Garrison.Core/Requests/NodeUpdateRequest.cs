namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Administrative node change.
    /// </summary>
    public class NodeUpdateRequest
    {
        /// <summary>
        /// New capacity.
        /// </summary>
        public int? MaxConcurrentRuns { get; set; } = null;

        /// <summary>
        /// New node pool.
        /// </summary>
        public string? NodePoolId { get; set; } = null;
    }
}
