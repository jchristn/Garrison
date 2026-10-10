namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Worker registration. Idempotent by node name.
    /// </summary>
    public class NodeRegisterRequest
    {
        /// <summary>
        /// Node name, unique (Kubernetes pod name).
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Worker software version.
        /// </summary>
        public string? Version { get; set; } = null;

        /// <summary>
        /// Informational address.
        /// </summary>
        public string? Address { get; set; } = null;

        /// <summary>
        /// Maximum concurrent runs.
        /// </summary>
        public int MaxConcurrentRuns { get; set; } = 4;

        /// <summary>
        /// Node pool name, or null for the default pool.
        /// </summary>
        public string? NodePool { get; set; } = null;

        /// <summary>
        /// Labels.
        /// </summary>
        public Dictionary<string, string> Labels { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Harness capabilities.
        /// </summary>
        public List<NodeCapabilityReport> Capabilities { get; set; } = new List<NodeCapabilityReport>();
    }
}
