namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Settings shared by the infrastructure resilience scenarios.
    /// </summary>
    public class ScenarioSettings
    {
        /// <summary>
        /// Workspace tenant.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Client loops creating and following runs.
        /// </summary>
        public int Concurrency { get; set; }

        /// <summary>
        /// How long the loops start new runs.
        /// </summary>
        public int DurationSeconds { get; set; }

        /// <summary>
        /// When the fault is injected.
        /// </summary>
        public int FaultAfterSeconds { get; set; }

        /// <summary>
        /// Longest wait for one run to finish.
        /// </summary>
        public int RunTimeoutSeconds { get; set; }

        /// <summary>
        /// Run parameter overrides.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// crash (SIGKILL the container's process on the k3d node) or delete (force-delete the pod).
        /// </summary>
        public string FaultMode { get; set; } = "crash";

        /// <summary>
        /// Docker container of the k3d node that runs the pods.
        /// </summary>
        public string K3dNode { get; set; } = "k3d-garrison-bench-server-0";
    }
}
