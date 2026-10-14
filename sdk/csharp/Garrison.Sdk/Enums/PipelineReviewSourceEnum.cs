namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Who decided a pipeline stage review (P12.9).
    /// </summary>
    public enum PipelineReviewSourceEnum
    {
        /// <summary>
        /// A person or API credential.
        /// </summary>
        User,

        /// <summary>
        /// The stage review timeout applied its action.
        /// </summary>
        Timeout,

        /// <summary>
        /// The pipeline run was cancelled.
        /// </summary>
        Cancelled
    }
}
