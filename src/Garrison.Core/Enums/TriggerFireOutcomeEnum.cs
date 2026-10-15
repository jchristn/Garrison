namespace Garrison.Core.Enums
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
        /// Nothing was started: the input template failed to render, the run-as principal lost its permission, or the run could not be created. See errorCode and errorMessage.
        /// </summary>
        Failed,

        /// <summary>
        /// A cron occurrence was missed by more than Triggers.CronMaxLatenessSeconds (for example while every control-plane replica was down) and was not fired.
        /// </summary>
        Skipped
    }
}
