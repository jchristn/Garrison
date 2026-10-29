namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Take an app revision.
    /// </summary>
    public class AppRevisionRequest
    {
        #region Public-Members

        /// <summary>
        /// Optional change note, or null.
        /// </summary>
        public string? ChangeNote { get; set; } = null;

        #endregion
    }
}
