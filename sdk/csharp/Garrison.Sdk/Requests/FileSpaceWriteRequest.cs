namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Body of a JSON file space write. Set exactly one of ContentBase64 or Content. Not thread-safe.
    /// </summary>
    public class FileSpaceWriteRequest
    {
        #region Public-Members

        /// <summary>
        /// Relative path within the file space, for example notes/a.md.
        /// </summary>
        public string Path
        {
            get
            {
                return _Path;
            }
            set
            {
                _Path = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Base64-encoded content, or null when Content is set.
        /// </summary>
        public string? ContentBase64 { get; set; } = null;

        /// <summary>
        /// UTF-8 text content, or null when ContentBase64 is set.
        /// </summary>
        public string? Content { get; set; } = null;

        /// <summary>
        /// Optional media type.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Optional base version for optimistic concurrency: 0 means the file must not exist yet. When the base version
        /// is stale the server writes under a conflict name and sets Conflict on the result. Null skips the check.
        /// </summary>
        public int? BaseVersion { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Path = String.Empty;

        #endregion
    }
}
