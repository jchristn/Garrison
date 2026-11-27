namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One hit of garrison_memory_search.
    /// </summary>
    public class MemorySearchHit
    {
        /// <summary>
        /// The entry.
        /// </summary>
        public MemoryEntry? Entry { get; set; } = null;

        /// <summary>
        /// Where it matched: key, category, tag, or content.
        /// </summary>
        public List<string> MatchedIn { get; set; } = new List<string>();
    }
}
