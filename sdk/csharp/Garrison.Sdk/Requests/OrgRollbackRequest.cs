namespace Garrison.Sdk.Requests
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Rolling an organization back to an earlier live revision (AA7.4).
    /// </summary>
    public class OrgRollbackRequest
    {
        /// <summary>
        /// Revision to return to, or null for the revision that was live before the current one.
        /// </summary>
        public string? RevisionId { get; set; } = null;

        /// <summary>
        /// Why, or null. At most 2000 characters.
        /// </summary>
        public string? Note { get; set; } = null;

        /// <summary>
        /// What to do with mandate ticks in flight. Finish (default) lets them complete without moving any mandate off the
        /// restored revisions; Cancel cancels their runs before the restore.
        /// </summary>
        public RollbackActiveTicksEnum ActiveTicks { get; set; } = RollbackActiveTicksEnum.Finish;
    }
}
