namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Worker registration. Idempotent by node name.
    /// </summary>
    public class NodeRegisterRequest
    {
        /// <summary>Whether this worker supports transient stdio MCP diagnostics. Legacy workers default false.</summary>
        public bool SupportsMcpTests { get; set; } = false;

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
        /// Child reserve slots (P12.38): extra slots for delegated runs whose parent waits on them. 0 to 64; 0 means no
        /// reserve. Default 0 (a worker that predates the reserve).
        /// </summary>
        public int ChildReserveSlots { get; set; } = 0;

        /// <summary>
        /// Most runs on the worker that may wait on a delegated run at once (P12.38). 0 to 1024; 0 means
        /// MaxConcurrentRuns. Default 0.
        /// </summary>
        public int MaxResidentWaiters { get; set; } = 0;

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

        /// <summary>
        /// Executors the worker supports. Process is always supported; KubernetesJob only when the worker runs in a
        /// cluster with permission to create Jobs, Secrets, and read pod logs in its run namespace. Empty means Process.
        /// </summary>
        public List<RunExecutorEnum> Executors { get; set; } = new List<RunExecutorEnum>();
        /// <summary>
        /// Structured capabilities per executor. Missing reports mean legacy workers make no advanced capability promise.
        /// </summary>
        public List<ExecutorCapabilities> ExecutorCapabilities { get; set; } = new List<ExecutorCapabilities>();

    }
}
