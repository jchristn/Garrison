namespace Garrison.Core.Enums
{
    /// <summary>
    /// State of a studio draft (AD7.1).
    /// </summary>
    public enum StudioDraftStatusEnum
    {
        /// <summary>
        /// Being edited.
        /// </summary>
        Open,

        /// <summary>
        /// Waiting for a person to decide its DraftApply approval. Edits are refused until the request is withdrawn or decided.
        /// </summary>
        PendingApproval,

        /// <summary>
        /// Applied to live configuration. Final.
        /// </summary>
        Applied,

        /// <summary>
        /// Abandoned. Final.
        /// </summary>
        Discarded
    }
}
