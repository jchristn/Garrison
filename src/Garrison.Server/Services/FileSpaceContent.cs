namespace Garrison.Server.Services
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// One verified version of a file space file (AD3.2).
    /// </summary>
    public class FileSpaceContent
    {
        /// <summary>
        /// Path.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Version metadata.
        /// </summary>
        public ConversationFileVersion Version { get; set; } = new ConversationFileVersion();

        /// <summary>
        /// Bytes.
        /// </summary>
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
