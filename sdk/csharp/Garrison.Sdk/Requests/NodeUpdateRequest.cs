namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

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
