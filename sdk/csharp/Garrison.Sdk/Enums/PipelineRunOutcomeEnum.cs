namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a pipeline run ended (P12.9). None while it is active.
    /// </summary>
    public enum PipelineRunOutcomeEnum
    {
        /// <summary>
        /// Still active.
        /// </summary>
        None,

        /// <summary>
        /// Every stage succeeded.
        /// </summary>
        Succeeded,

        /// <summary>
        /// A stage failed after its attempts and did not continue on failure.
        /// </summary>
        StageFailed,

        /// <summary>
        /// A stage run could not be created (for example the agent is inactive or has no deployment).
        /// </summary>
        StageStartFailed,

        /// <summary>
        /// A reviewer rejected a stage.
        /// </summary>
        ReviewRejected,

        /// <summary>
        /// A review timed out with the Reject timeout action.
        /// </summary>
        ReviewExpired,

        /// <summary>
        /// Cancelled by a caller.
        /// </summary>
        Cancelled,

        /// <summary>
        /// The pipeline deadline passed.
        /// </summary>
        TimedOut,

        /// <summary>
        /// An unexpected server error ended the pipeline run.
        /// </summary>
        InternalError
    }
}
