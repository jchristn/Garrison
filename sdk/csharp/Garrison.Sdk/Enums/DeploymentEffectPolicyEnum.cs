namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What the control plane does with a run that was already Running when its worker was lost. A run that was still
    /// Leased never started, so it is requeued under every policy while it has attempts left.
    /// </summary>
    public enum DeploymentEffectPolicyEnum
    {
        /// <summary>
        /// End the run Failed with outcome NodeLost, so its external effects happen at most once. The default for new
        /// deployments.
        /// </summary>
        AtMostOnce = 0,

        /// <summary>
        /// Requeue the run while it has attempts left. Effects the lost attempt already made may happen again.
        /// </summary>
        AtLeastOnce = 1,

        /// <summary>
        /// Requeue only when every effect went through Garrison's effect journal with a known outcome. The journal does
        /// not exist yet, so today this behaves exactly like AtMostOnce.
        /// </summary>
        Journaled = 2
    }
}
