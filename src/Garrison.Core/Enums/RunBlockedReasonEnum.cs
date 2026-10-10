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
        NoMatchingPool
    }
}
