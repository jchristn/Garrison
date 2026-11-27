namespace Garrison.Core.Requests
{
    using Garrison.Core.Enums;

    /// <summary>
    /// Rolling an organization back to an earlier live revision (AA7.4, AA11.6).
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
        /// What happens to keeper ticks already in flight: Finish (the default) lets them complete under the restored
        /// mandate revisions; Cancel cancels their runs before the snapshot is restored.
        /// </summary>
        public RollbackActiveTicksEnum ActiveTicks { get; set; } = RollbackActiveTicksEnum.Finish;
    }
}
