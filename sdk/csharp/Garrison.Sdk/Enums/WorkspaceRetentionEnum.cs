namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What happens to a run workspace after the run.
    /// </summary>
    public enum WorkspaceRetentionEnum
    {
        /// <summary>
        /// Delete.
        /// </summary>
        Delete,

        /// <summary>
        /// Keep.
        /// </summary>
        Keep,

        /// <summary>
        /// KeepOnFailure.
        /// </summary>
        KeepOnFailure
    }
}
