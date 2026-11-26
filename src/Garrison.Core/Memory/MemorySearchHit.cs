namespace Garrison.Core.Memory
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>
    /// One scoped memory search result (AA4). Not thread-safe.
    /// </summary>
    public class MemorySearchHit
    {
        /// <summary>
        /// The entry's metadata.
        /// </summary>
        public MemoryEntry Entry { get; set; } = new MemoryEntry();

        /// <summary>
        /// Where the keyword matched: key, category, tag, or content.
        /// </summary>
        public List<string> MatchedIn { get; set; } = new List<string>();
    }
}
