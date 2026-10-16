namespace Garrison.Core.Enums
{
    /// <summary>
    /// What the control plane may do with a run that was already Running when its worker was lost (plan P12.29, D-035,
    /// D-049). A run that was still Leased never started a harness (the start gate, P10.20), so it is requeued under every
    /// policy while it has attempts left.
    /// </summary>
    public enum DeploymentEffectPolicyEnum
    {
        /// <summary>
        /// Never start the run a second time after a lost worker: it ends Failed with outcome NodeLost, so any external
        /// effect (a push, a message, a payment) happens at most once. The default for new deployments, and the value
        /// existing deployments with retryOnNodeLoss false carry.
        /// </summary>
        AtMostOnce = 0,

        /// <summary>
        /// Requeue the run for another attempt while it has attempts left (maxAttempts). The deployment accepts that an
        /// effect the lost attempt already made may happen again. Existing deployments with retryOnNodeLoss true carry
        /// this value.
        /// </summary>
        AtLeastOnce = 1,

        /// <summary>
        /// Requeue only from a trusted known-coverage checkpoint before any effect was dispatched. Unknown shell or
        /// network coverage, unresolved dispatches, and completed effects without resumable state fail closed.
        /// </summary>
        Journaled = 2
    }
}
