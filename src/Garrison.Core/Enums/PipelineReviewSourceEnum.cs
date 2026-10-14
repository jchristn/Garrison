namespace Garrison.Core.Enums
{
    /// <summary>
    /// Who decided a pipeline stage review (P12.9).
    /// </summary>
    public enum PipelineReviewSourceEnum
    {
        /// <summary>
        /// A user or API credential through REST or MCP.
        /// </summary>
        User,

        /// <summary>
        /// The stage review timeout applied its action.
        /// </summary>
        Timeout,

        /// <summary>
        /// The pipeline run was cancelled or timed out.
        /// </summary>
        Cancelled
    }
}
