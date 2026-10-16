namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How a worker executes a run (plan D-004, D-033).
    /// </summary>
    public enum RunExecutorEnum
    {
        /// <summary>
        /// The harness runs as a subprocess of the worker, in the worker's container, with its own work, home, and
        /// config directories. Every worker supports it.
        /// </summary>
        Process,

        /// <summary>
        /// The worker creates a Kubernetes Job per run; the harness runs in its own pod with its own filesystem,
        /// no Kubernetes or Garrison credentials, a hardened security context, and the deployment's resource limits.
        /// Only workers that report the KubernetesJob executor (in a cluster, with RBAC to create Jobs) claim these runs.
        /// </summary>
        KubernetesJob,

        /// <summary>Invoke a remote A2A agent over HTTP from the worker.</summary>
        RemoteA2A,

        /// <summary>Invoke a remote MCP tool over Streamable HTTP from the worker.</summary>
        RemoteMcp
    }
}
