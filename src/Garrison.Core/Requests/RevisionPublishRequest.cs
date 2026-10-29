namespace Garrison.Core.Requests
{
    /// <summary>
    /// Publish an agent revision draft (AD1.2).
    /// </summary>
    public class RevisionPublishRequest
    {
        /// <summary>
        /// Optional change note recorded on the revision (at most 2000 characters). Replaces the draft's note when set.
        /// </summary>
        public string? ChangeNote { get; set; } = null;
    }
}
