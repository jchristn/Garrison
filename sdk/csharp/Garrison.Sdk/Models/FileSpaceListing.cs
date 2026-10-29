namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Listing of a conversation or run file space. Not thread-safe.
    /// </summary>
    public class FileSpaceListing
    {
        #region Public-Members

        /// <summary>
        /// File space identifier, or null when no file space exists yet.
        /// </summary>
        public string? FileSpaceId { get; set; } = null;

        /// <summary>
        /// Number of files.
        /// </summary>
        public int FileCount { get; set; } = 0;

        /// <summary>
        /// Total size of the current versions, in bytes.
        /// </summary>
        public long TotalBytes { get; set; } = 0;

        /// <summary>
        /// Files in the space.
        /// </summary>
        public List<ConversationFile> Files
        {
            get
            {
                return _Files;
            }
            set
            {
                _Files = value ?? new List<ConversationFile>();
            }
        }

        #endregion

        #region Private-Members

        private List<ConversationFile> _Files = new List<ConversationFile>();

        #endregion
    }
}
