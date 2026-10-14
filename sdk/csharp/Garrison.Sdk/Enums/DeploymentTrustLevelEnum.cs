namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How far a deployment's input is trusted. Untrusted runs are only placed on an executor with at least Container
    /// isolation.
    /// </summary>
    public enum DeploymentTrustLevelEnum
    {
        /// <summary>
        /// Input comes from trusted callers; runs may use any executor, including Process. The default.
        /// </summary>
        Trusted = 0,

        /// <summary>
        /// Input may be untrusted; runs need at least Container isolation and queue (blocked reason NoIsolatingWorker)
        /// until a worker can provide it.
        /// </summary>
        Untrusted = 1
    }
}
