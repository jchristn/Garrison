namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How a worker executes a run.
    /// </summary>
    public enum RunExecutorEnum
    {
        /// <summary>
        /// Process: the harness runs as a subprocess of the worker, in the worker's container. Every worker supports it.
        /// </summary>
        Process,

        /// <summary>
        /// KubernetesJob: the worker creates a Kubernetes Job per run, so the harness runs in its own pod with no
        /// Kubernetes or Garrison credentials, a hardened security context, and the deployment's pod resources. Only
        /// workers that report the KubernetesJob executor claim these runs.
        /// </summary>
        KubernetesJob
    }
}
