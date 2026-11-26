namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Result of garrison_memory_list (AA4.6): entry metadata without text.</summary>
    public class McpMemoryList
    {
        /// <summary>Scope kind listed.</summary>
        public string Scope { get; set; } = "Agent";

        /// <summary>Scope identifier listed.</summary>
        public string ScopeId { get; set; } = string.Empty;

        /// <summary>Entries, ordered by key.</summary>
        public List<MemoryEntry> Entries { get; set; } = new List<MemoryEntry>();

        /// <summary>Total matching entries.</summary>
        public long TotalCount { get; set; } = 0;
    }
}
