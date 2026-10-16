namespace Garrison.Worker.Execution
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>Capabilities implemented by the built-in executors and covered by their conformance suites.</summary>
    public static class ExecutorCapabilityProfiles
    {
        /// <summary>Return an independent capability report for an enabled built-in executor.</summary>
        /// <param name="executor">Enabled executor.</param>
        /// <param name="warmStart">Whether the initialized Kubernetes warm pool is usable.</param>
        /// <param name="egressControl">Whether the KubernetesJob executor enforces per-run egress allowlists (P11.15):
        /// Kubernetes.EgressAllowlists is on, the worker may manage NetworkPolicies in the run namespace, and no shared
        /// policy widens allowlisted run pods. Ignored for Process, which never offers egress control.</param>
        /// <returns>Capabilities implemented by the selected executor.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown for an unknown executor.</exception>
        public static ExecutorCapabilities For(RunExecutorEnum executor, bool warmStart = false, bool egressControl = false)
        {
            if (executor == RunExecutorEnum.Process)
                return new ExecutorCapabilities { Executor = executor, ColdStartClass = ExecutorColdStartEnum.Immediate, SessionContinuation = true, FilesystemSnapshot = true, CrossNodeRestore = true };
            if (executor == RunExecutorEnum.KubernetesJob)
                return new ExecutorCapabilities { Executor = executor, Isolation = ExecutorIsolationEnum.Container, ColdStartClass = ExecutorColdStartEnum.Cold, WarmStart = warmStart, EgressControl = egressControl };
            if (executor == RunExecutorEnum.RemoteA2A || executor == RunExecutorEnum.RemoteMcp)
                return new ExecutorCapabilities { Executor = executor, ColdStartClass = ExecutorColdStartEnum.Immediate };
            throw new ArgumentOutOfRangeException(nameof(executor), executor, "Unknown built-in executor.");
        }
    }
}
