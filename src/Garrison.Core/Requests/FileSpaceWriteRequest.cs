namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Write one file to a conversation file space (AD3.6).
    /// </summary>
    public class FileSpaceWriteRequest
    {
        /// <summary>
        /// Path inside the space, relative with forward slashes. Required.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Content as base64. Required unless Content is set.
        /// </summary>
        public string? ContentBase64 { get; set; } = null;

        /// <summary>
        /// Text content (UTF-8), used when ContentBase64 is not set.
        /// </summary>
        public string? Content { get; set; } = null;

        /// <summary>
        /// Media type; guessed from the extension when omitted.
        /// </summary>
        public string? MediaType { get; set; } = null;

        /// <summary>
        /// Version the writer read (0 for a new file). With a stale base, the write is kept under a conflict name. Null
        /// writes unconditionally.
        /// </summary>
        public int? BaseVersion { get; set; } = null;
    }
}
