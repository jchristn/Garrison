namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Why a run was created.
    /// </summary>
    public enum RunKindEnum
    {
        /// <summary>
        /// Invoke.
        /// </summary>
        Invoke,

        /// <summary>
        /// Delegated.
        /// </summary>
        Delegated,

        /// <summary>
        /// Test.
        /// </summary>
        Test,

        /// <summary>
        /// Retry.
        /// </summary>
        Retry,

        /// <summary>
        /// A stage of a pipeline run (PipelineRunId, PipelinePosition, and PipelineExecution are set).
        /// </summary>
        Pipeline,

        /// <summary>
        /// Started by a trigger (P12.5): a cron schedule, a signed webhook, or a manual fire. TriggerId is set.
        /// </summary>
        Trigger
    }
}
