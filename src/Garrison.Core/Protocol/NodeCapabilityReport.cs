namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Harness capability reported by a worker.
    /// </summary>
    public class NodeCapabilityReport
    {
        /// <summary>
        /// Harness type.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Resolved executable path.
        /// </summary>
        public string? Executable { get; set; } = null;

        /// <summary>
        /// Detected version.
        /// </summary>
        public string? Version { get; set; } = null;

        /// <summary>
        /// Whether the probe succeeded.
        /// </summary>
        public bool Available { get; set; } = false;

        /// <summary>
        /// Probe detail or error.
        /// </summary>
        public string? Detail { get; set; } = null;
    }
}
