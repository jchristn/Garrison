namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Lease result.
    /// </summary>
    public class NodeLeaseResponse
    {
        /// <summary>
        /// Assignments; empty when the wait elapsed with no work.
        /// </summary>
        public List<RunAssignment> Assignments { get; set; } = new List<RunAssignment>();
    }
}
