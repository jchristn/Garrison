namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The fields of a memory entry the harness reads.
    /// </summary>
    public class MemoryEntry
    {
        /// <summary>
        /// Identifier (mem_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Key, unique within the scope.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Version: 1 after the first write.
        /// </summary>
        public int Version { get; set; } = 0;

        /// <summary>
        /// UTF-8 bytes of the text.
        /// </summary>
        public long Bytes { get; set; } = 0;

        /// <summary>
        /// Tags.
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();
    }
}
