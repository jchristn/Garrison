namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Result of garrison_memory_read, garrison_memory_write, and garrison_memory_delete.
    /// </summary>
    public class MemoryToolResult
    {
        /// <summary>
        /// Key.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Whether the entry exists (read) or existed (delete).
        /// </summary>
        public bool Found { get; set; } = false;

        /// <summary>
        /// Text (read only).
        /// </summary>
        public string? Value { get; set; } = null;

        /// <summary>
        /// Version after the call.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// Metadata, or null.
        /// </summary>
        public MemoryEntry? Entry { get; set; } = null;
    }
}
