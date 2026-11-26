namespace Garrison.Core.Requests
{
    /// <summary>
    /// Drafting an organization revision (AA7.4).
    /// </summary>
    public class OrgRevisionRequest
    {
        /// <summary>
        /// Why the revision was made, or null. At most 2000 characters.
        /// </summary>
        public string? Note { get; set; } = null;
    }
}
