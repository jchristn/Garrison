namespace Garrison.Core.Enums
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
        /// A stage of a pipeline run (P12.9). The run carries pipelineRunId, pipelinePosition, and pipelineExecution.
        /// </summary>
        Pipeline,

        /// <summary>
        /// Started by a trigger (P12.5): a cron schedule, a signed webhook, or a manual fire. The run carries triggerId.
        /// </summary>
        Trigger
    }
}
