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
        NoMatchingPool,

        /// <summary>
        /// The run is Untrusted, or its deployment has an egress allowlist, and no Ready node with its harness offers its
        /// executor with the isolation it needs (at least Container) and, for an allowlist, egress control (a
        /// KubernetesJob worker that enforces egress rules). The run waits until such a worker registers; it never runs
        /// without the allowlist enforced.
        /// </summary>
        NoIsolatingWorker,

        /// <summary>
        /// The run's agent uses a harness built-in capability, such as pandoc, and no Ready worker that can run it reports
        /// that tool (node label garrison.io/tool-{name}=true). The run waits until such a worker registers.
        /// </summary>
        NoToolWorker
    }
}
