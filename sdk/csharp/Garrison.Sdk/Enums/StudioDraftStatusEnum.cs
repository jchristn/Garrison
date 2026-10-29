namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Lifecycle of a studio draft (AD7).
    /// </summary>
    public enum StudioDraftStatusEnum
    {
        /// <summary>
        /// Editable. The status of a new draft.
        /// </summary>
        Open,

        /// <summary>
        /// Waiting for a decision on its DraftApply approval. Frozen until the approval is decided, expires, or is cancelled.
        /// </summary>
        PendingApproval,

        /// <summary>
        /// Applied to live configuration; ManifestApplyId names the manifest apply record.
        /// </summary>
        Applied,

        /// <summary>
        /// Discarded.
        /// </summary>
        Discarded
    }
}
