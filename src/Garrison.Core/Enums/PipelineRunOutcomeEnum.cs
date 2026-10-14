namespace Garrison.Core.Enums
{
    /// <summary>
    /// Why a pipeline run ended (P12.9).
    /// </summary>
    public enum PipelineRunOutcomeEnum
    {
        /// <summary>
        /// The pipeline run has not ended.
        /// </summary>
        None,

        /// <summary>
        /// Every stage finished.
        /// </summary>
        Succeeded,

        /// <summary>
        /// A stage run failed after its last attempt and the stage does not continue on failure.
        /// </summary>
        StageFailed,

        /// <summary>
        /// A stage run could not be created or compiled (missing agent or deployment, inactive agent, invalid parameters, compile failure).
        /// </summary>
        StageStartFailed,

        /// <summary>
        /// A reviewer rejected a stage.
        /// </summary>
        ReviewRejected,

        /// <summary>
        /// A stage review timed out with the Reject timeout action.
        /// </summary>
        ReviewExpired,

        /// <summary>
        /// The pipeline run or its current stage run was cancelled.
        /// </summary>
        Cancelled,

        /// <summary>
        /// The pipeline run passed its deadline.
        /// </summary>
        TimedOut,

        /// <summary>
        /// An unexpected error stopped the pipeline run.
        /// </summary>
        InternalError
    }
}
