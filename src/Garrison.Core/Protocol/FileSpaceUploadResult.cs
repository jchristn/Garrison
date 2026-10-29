namespace Garrison.Core.Protocol
{
    using System;

    /// <summary>
    /// What happened to one file a worker wrote back to a conversation file space (AD3.3).
    /// </summary>
    public class FileSpaceUploadResult
    {
        /// <summary>
        /// Path the run wrote.
        /// </summary>
        public string RequestedPath { get; set; } = String.Empty;

        /// <summary>
        /// Path the content was committed under: the requested path, or a conflict name such as notes.run_abc.md when
        /// another writer changed the file first (AD-014).
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Committed version number.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Whether the write was kept under a conflict name.
        /// </summary>
        public bool Conflict { get; set; } = false;

        /// <summary>
        /// SHA-256 of the committed content.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;
    }
}
