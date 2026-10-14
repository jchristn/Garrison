namespace Garrison.Core.Helpers
{
    using System;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Effect policy decisions (plan P12.29). Stateless and thread safe.
    /// </summary>
    public static class EffectPolicyRules
    {
        #region Public-Methods

        /// <summary>
        /// Whether a run whose lease expired goes back to the queue for another attempt. A cancelled run, or one with no
        /// attempts left, never does. A Leased run never started its harness (the start gate), so it is requeued under every
        /// policy. A Running run is requeued only when it was admitted under AtLeastOnce; AtMostOnce, and Journaled until the
        /// effect journal exists (P12.33), end it Failed with outcome NodeLost instead. Any other status is not requeued.
        /// </summary>
        /// <param name="run">Run whose lease expired. Its stored <see cref="Run.EffectPolicy"/> decides, not the deployment's current policy.</param>
        /// <returns>True to requeue; false to end the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public static bool RequeueOnLeaseExpiry(Run run)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.CancelRequested) return false;
            if (run.Attempt >= Math.Max(run.MaxAttempts, 1)) return false;
            if (run.Status == RunStatusEnum.Leased) return true;
            return run.Status == RunStatusEnum.Running && RequeuesStartedRuns(run.EffectPolicy);
        }

        /// <summary>
        /// Whether a policy requeues a run that had already started when its worker was lost. True only for AtLeastOnce;
        /// Journaled returns false until the effect journal exists (P12.33).
        /// </summary>
        /// <param name="policy">Effect policy.</param>
        /// <returns>True when a lost Running run is requeued.</returns>
        public static bool RequeuesStartedRuns(DeploymentEffectPolicyEnum policy)
        {
            return policy == DeploymentEffectPolicyEnum.AtLeastOnce;
        }

        #endregion
    }
}
