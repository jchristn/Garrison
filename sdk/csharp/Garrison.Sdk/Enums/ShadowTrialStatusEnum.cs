namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Lifecycle of a shadow trial (AA9.7).
    /// </summary>
    public enum ShadowTrialStatusEnum
    {
        /// <summary>
        /// Sampled inputs of the source deployment are copied to the candidate as Shadow runs.
        /// </summary>
        Running,

        /// <summary>
        /// The trial reached its end time.
        /// </summary>
        Completed,

        /// <summary>
        /// A person stopped the trial.
        /// </summary>
        Stopped,

        /// <summary>
        /// The trial could not continue (a deployment was deleted or the candidate kept failing); see stopReason.
        /// </summary>
        Failed
    }
}
