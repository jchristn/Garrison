namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// A leased run with its compiled execution spec.
    /// </summary>
    public class RunAssignment
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Fencing epoch; include it in every run-scoped call.
        /// </summary>
        public long Epoch { get; set; } = 0;

        /// <summary>
        /// Lease expiry (UTC).
        /// </summary>
        public DateTime LeaseExpiresUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Highest event sequence already recorded for the run (for example control-plane warnings written while it was
        /// queued). The worker numbers its events after this value so none collide. Default 0.
        /// </summary>
        public long EventSequenceStart { get; set; } = 0;

        /// <summary>
        /// Compiled execution spec.
        /// </summary>
        public Garrison.Core.Compilation.ExecutionSpec Spec { get; set; } = new Garrison.Core.Compilation.ExecutionSpec();
    }
}
