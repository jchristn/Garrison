namespace Garrison.Sdk.Requests
{
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
    }
}
