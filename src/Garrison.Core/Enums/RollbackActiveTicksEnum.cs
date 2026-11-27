namespace Garrison.Core.Enums
{
    /// <summary>
    /// What an organization rollback does with keeper ticks already in flight (AA11.6).
    /// </summary>
    public enum RollbackActiveTicksEnum
    {
        /// <summary>
        /// Ticks in flight run to completion. Their mandates are moved to the restored snapshot's revisions at once, and a
        /// tick that finishes after the rollback never moves a mandate's current revision. The default.
        /// </summary>
        Finish,

        /// <summary>
        /// The runs of in-flight ticks of the organization's mandates are cancelled before the snapshot is restored.
        /// </summary>
        Cancel
    }
}
