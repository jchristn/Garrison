namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Memory;

    /// <summary>Result of garrison_memory_search (AA4.6): matching entries without text, and where each matched.</summary>
    public class McpMemorySearchResult
    {
        /// <summary>Scope kind searched.</summary>
        public string Scope { get; set; } = "Agent";

        /// <summary>Scope identifier searched.</summary>
        public string ScopeId { get; set; } = string.Empty;

        /// <summary>Hits, ordered by key.</summary>
        public List<MemorySearchHit> Hits { get; set; } = new List<MemorySearchHit>();
    }
}
