namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Result of garrison_memory_search.
    /// </summary>
    public class MemorySearchResult
    {
        /// <summary>
        /// Hits.
        /// </summary>
        public List<MemorySearchHit> Hits { get; set; } = new List<MemorySearchHit>();
    }
}
