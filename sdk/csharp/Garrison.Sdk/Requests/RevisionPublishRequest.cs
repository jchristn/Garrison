namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Publish a draft agent revision.
    /// </summary>
    public class RevisionPublishRequest
    {
        #region Public-Members

        /// <summary>
        /// Optional change note.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        #endregion
    }
}
