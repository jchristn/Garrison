namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// One file of the run's conversation file space, synced into the mount path before launch (AD3.3).
    /// </summary>
    public class ExecutionFileSpaceFile
    {
        /// <summary>
        /// Path inside the space.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Version the run starts from; the base version of the run's write-back.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// SHA-256, lowercase hex.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Size in bytes.
        /// </summary>
        public long SizeBytes { get; set; } = 0;

        /// <summary>
        /// Download-only URL added at lease; cleared by the worker once the file is in the workspace.
        /// </summary>
        public string? DownloadUrl { get; set; } = null;
    }
}
