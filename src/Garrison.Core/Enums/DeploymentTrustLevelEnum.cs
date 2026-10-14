namespace Garrison.Core.Enums
{
    /// <summary>
    /// How far a deployment's input is trusted (plan P11.14, D-035). Untrusted runs are only placed on an executor that
    /// provides at least container isolation.
    /// </summary>
    public enum DeploymentTrustLevelEnum
    {
        /// <summary>
        /// The deployment only receives input from trusted callers. Runs may use any executor, including Process, which
        /// shares the worker's filesystem, network, and user. The default, and the value existing deployments keep.
        /// </summary>
        Trusted = 0,

        /// <summary>
        /// The deployment may receive untrusted input (for example public A2A callers or content from the internet).
        /// Runs need an executor with at least Container isolation; when no Ready worker can provide it, the run stays
        /// Queued with the blocked reason NoIsolatingWorker until one registers.
        /// </summary>
        Untrusted = 1
    }
}
