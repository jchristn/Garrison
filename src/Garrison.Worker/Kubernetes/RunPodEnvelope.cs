namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Protocol;

    /// <summary>
    /// What the worker hands a run pod through the spec Secret (mounted at /run/garrison/spec.json): the leased run
    /// with its compiled execution spec, the protocol nonce, and the executor options run-one needs (plan D-033).
    /// </summary>
    public class RunPodEnvelope
    {
        #region Public-Members

        /// <summary>
        /// Protocol nonce for this run; run-one prefixes every stdout protocol line with it.
        /// </summary>
        public string Nonce { get; set; } = String.Empty;

        /// <summary>
        /// The leased run (run ID, epoch, and execution spec).
        /// </summary>
        public RunAssignment Assignment
        {
            get
            {
                return _Assignment;
            }
            set
            {
                _Assignment = value ?? new RunAssignment();
            }
        }

        /// <summary>
        /// Directory holding the per-run work, home, and config directories inside the pod.
        /// </summary>
        public string WorkRoot { get; set; } = "/garrison/runs";

        /// <summary>
        /// Variables copied from the pod environment into the harness environment (the worker's allowlist).
        /// </summary>
        public List<string> EnvironmentAllowlist
        {
            get
            {
                return _EnvironmentAllowlist;
            }
            set
            {
                _EnvironmentAllowlist = value ?? new List<string>();
            }
        }

        /// <summary>
        /// MCP pre-flight timeout per server in milliseconds (the worker's setting).
        /// </summary>
        public int McpPreflightTimeoutMs { get; set; } = 20000;

        /// <summary>
        /// Where a PersistentVolume workspace is mounted in the pod, or null for an emptyDir workspace. run-one links
        /// the run's work directory to it (the claim cannot be mounted inside the run directory, whose parents the
        /// container runtime would create as root).
        /// </summary>
        public string? WorkspaceMountPath { get; set; } = null;

        /// <summary>
        /// Egress canary as host:port, or null for none. When set, run-one starts the harness only after a TCP
        /// connection to it fails, which shows the run pod's NetworkPolicy is in effect (policy controllers program
        /// new pods asynchronously, typically within a second or two).
        /// </summary>
        public string? EgressCanary { get; set; } = null;

        /// <summary>
        /// Seconds run-one waits for the egress canary to be blocked before failing the run with outcome PodFailed.
        /// </summary>
        public int EgressCanaryTimeoutSeconds { get; set; } = 30;

        #endregion

        #region Private-Members

        private RunAssignment _Assignment = new RunAssignment();
        private List<string> _EnvironmentAllowlist = new List<string>();

        #endregion
    }
}
