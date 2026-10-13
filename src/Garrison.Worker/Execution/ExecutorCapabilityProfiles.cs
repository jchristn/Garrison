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
        /// <returns>Capabilities; no egress, snapshot, restore, or warm-start promise.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown for an unknown executor.</exception>
        public static ExecutorCapabilities For(RunExecutorEnum executor, bool warmStart = false)
        {
            if (executor == RunExecutorEnum.Process)
                return new ExecutorCapabilities { Executor = executor, ColdStartClass = ExecutorColdStartEnum.Immediate, SessionContinuation = true };
            if (executor == RunExecutorEnum.KubernetesJob)
                return new ExecutorCapabilities { Executor = executor, Isolation = ExecutorIsolationEnum.Container, ColdStartClass = ExecutorColdStartEnum.Cold, WarmStart = warmStart };
            throw new ArgumentOutOfRangeException(nameof(executor), executor, "Unknown built-in executor.");
        }
    }
}
