namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Result of one trigger fire (P12.5).
    /// </summary>
    public enum TriggerFireOutcomeEnum
    {
        /// <summary>
        /// A run or pipeline run was created.
        /// </summary>
        Started,

        /// <summary>
        /// Nothing was started; see errorCode and errorMessage.
        /// </summary>
        Failed,

        /// <summary>
        /// A missed cron occurrence older than Triggers.CronMaxLatenessSeconds was not fired.
        /// </summary>
        Skipped
    }
}
