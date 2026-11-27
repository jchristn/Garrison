namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Result of garrison_memory_list.
    /// </summary>
    public class MemoryListResult
    {
        /// <summary>
        /// Entries without text, ordered by key.
        /// </summary>
        public List<MemoryEntry> Entries { get; set; } = new List<MemoryEntry>();

        /// <summary>
        /// Entries that match, across every page.
        /// </summary>
        public int TotalCount { get; set; } = 0;
    }
}
