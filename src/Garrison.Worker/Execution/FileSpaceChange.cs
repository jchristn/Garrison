namespace Garrison.Worker.Execution
{
    using System;

    /// <summary>
    /// A new or changed file under the file space mount path after a run (AD3.3).
    /// </summary>
    public class FileSpaceChange
    {
        /// <summary>
        /// Path relative to the mount path.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// Version the run started from, 0 for a new file.
        /// </summary>
        public int BaseVersion { get; set; } = 0;

        /// <summary>
        /// Content.
        /// </summary>
        public byte[] Content { get; set; } = Array.Empty<byte>();
    }
}
