namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a queued run cannot be handed to any worker right now. Computed by the server when the run is read.
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
        /// Ready nodes report the run's harness, but none matches the deployment's node pool or node selector.
        /// </summary>
        NoMatchingPool
    }
}
