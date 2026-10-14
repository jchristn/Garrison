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
        Pipeline
    }
}
