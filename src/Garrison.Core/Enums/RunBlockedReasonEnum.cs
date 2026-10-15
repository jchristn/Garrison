namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why a queued run cannot be handed to any worker right now. Computed on read from current node state; never stored.
    /// </summary>
    public enum RunBlockedReasonEnum
    {
        /// <summary>
        /// No node is Ready at all.
        /// </summary>
        NoReadyWorker,

        /// <summary>
        /// Ready nodes exist, but none reports the run's harness as available.
        /// </summary>
        NoCapableWorker,

        /// <summary>
        /// Ready nodes report the run's harness, but none matches the deployment's node pool, the pool's tenant
        /// dedication, or the deployment's node selectors.
        /// </summary>
        NoMatchingPool,

        /// <summary>
        /// The run is Untrusted (P11.14) or needs egress control because its deployment has an egress allowlist
        /// (P11.15), and Ready nodes report its harness, but none offers its executor with the isolation it needs (at
        /// least Container, for example a worker with the KubernetesJob executor) and, for an allowlist, egress control
        /// (a KubernetesJob worker with Kubernetes.EgressAllowlists on). The run waits in the queue until such a worker
        /// registers; it never runs without the allowlist enforced.
        /// </summary>
        NoIsolatingWorker
    }
}
