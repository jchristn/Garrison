namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Typed scoped memory enumeration filter (AA4). Results are ordered by scope, then key.
    /// </summary>
    public class MemoryEntryFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Scope kind filter, or null for any.
        /// </summary>
        public MemoryScopeKindEnum? ScopeKind { get; set; } = null;

        /// <summary>
        /// Scope identifier filter, or null for any. Usually set together with ScopeKind.
        /// </summary>
        public string? ScopeId { get; set; } = null;

        /// <summary>
        /// Exact category filter, or null for any.
        /// </summary>
        public string? Category { get; set; } = null;

        /// <summary>
        /// Entries carrying this tag, or null for any. Compared lowercase.
        /// </summary>
        public string? Tag { get; set; } = null;

        /// <summary>
        /// Case-insensitive keyword matched against the key, the category, and the tags, or null for none.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Entries last written by this agent, or null for any.
        /// </summary>
        public string? WriterAgentId { get; set; } = null;

        /// <summary>
        /// Key prefix filter, or null for any. Compared exactly.
        /// </summary>
        public string? KeyPrefix { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size, 1 to 1000. Default 25.
        /// </summary>
        public int MaxResults { get; set; } = 25;
    }
}
