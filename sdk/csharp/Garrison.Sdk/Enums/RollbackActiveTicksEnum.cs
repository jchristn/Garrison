namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// What an organization rollback does with mandate ticks that are in flight when it starts (AA11.6).
    /// </summary>
    public enum RollbackActiveTicksEnum
    {
        /// <summary>
        /// Default. Ticks in flight run to completion, but their mandates are already pinned to the restored snapshot's
        /// revisions, so a tick that finishes after the rollback cannot move a mandate's current revision.
        /// </summary>
        Finish,

        /// <summary>
        /// The server cancels the runs of in-flight ticks of the organization's mandates before it restores the snapshot.
        /// </summary>
        Cancel
    }
}
