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
        /// Compiled execution spec.
        /// </summary>
        public Garrison.Core.Compilation.ExecutionSpec Spec { get; set; } = new Garrison.Core.Compilation.ExecutionSpec();
    }
}
