namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// State of a permission approval (P12.3). Pending is the only state that can change; every other state is final.
    /// </summary>
    public enum ApprovalStatusEnum
    {
        /// <summary>
        /// Waiting for a person to decide; the harness call is blocked.
        /// </summary>
        Pending,

        /// <summary>
        /// Allowed, by a person or by a rule.
        /// </summary>
        Approved,

        /// <summary>
        /// Denied, by a person or by a rule.
        /// </summary>
        Denied,

        /// <summary>
        /// Nobody decided before the approval expired; the deployment's timeout decision was applied.
        /// </summary>
        Expired,

        /// <summary>
        /// The run was cancelled, finished, or lost its lease while the approval was pending, or the harness stopped
        /// waiting. The harness was answered with a denial if it was still waiting.
        /// </summary>
        Cancelled
    }
}
