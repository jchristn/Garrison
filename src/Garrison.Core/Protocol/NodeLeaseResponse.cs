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
        /// <summary>Eligible queued Kubernetes runs, bounded at 64, for warm-pool sizing. Zero for workers without warm support.</summary>
        public int QueuedKubernetesRuns { get; set; } = 0;

        /// <summary>Assignments; empty when the wait elapsed with no work.</summary>
        public List<RunAssignment> Assignments { get; set; } = new List<RunAssignment>();
    }
}
