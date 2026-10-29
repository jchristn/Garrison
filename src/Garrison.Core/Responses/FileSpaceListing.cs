namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// The files of a conversation file space (AD3.6).
    /// </summary>
    public class FileSpaceListing
    {
        /// <summary>
        /// Space identifier, or null when nothing has been written yet.
        /// </summary>
        public string? FileSpaceId { get; set; } = null;

        /// <summary>
        /// Number of files that are not deleted.
        /// </summary>
        public int FileCount { get; set; } = 0;

        /// <summary>
        /// Bytes of the current versions.
        /// </summary>
        public long TotalBytes { get; set; } = 0;

        /// <summary>
        /// Files, ordered by path. Deleted files appear only when asked for.
        /// </summary>
        public List<ConversationFile> Files { get; set; } = new List<ConversationFile>();
    }
}
