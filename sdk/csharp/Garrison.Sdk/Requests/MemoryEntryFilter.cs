namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Memory entry list filter (AA4). Results are ordered by scope, then key.
    /// </summary>
    public class MemoryEntryFilter
    {
        /// <summary>
        /// Scope kind, or null for any.
        /// </summary>
        public MemoryScopeKindEnum? ScopeKind { get; set; } = null;

        /// <summary>
        /// Scope identifier (agent or app identifier), or null for any.
        /// </summary>
        public string? ScopeId { get; set; } = null;

        /// <summary>
        /// Exact category, or null for any.
        /// </summary>
        public string? Category { get; set; } = null;

        /// <summary>
        /// Entries with this tag, or null for any.
        /// </summary>
        public string? Tag { get; set; } = null;

        /// <summary>
        /// Case-insensitive keyword matched against keys, categories, and tags, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Entries last written by this agent (identifier), or null for any.
        /// </summary>
        public string? Writer { get; set; } = null;

        /// <summary>
        /// Key prefix, or null for any.
        /// </summary>
        public string? KeyPrefix { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0.
        /// </summary>
        public int Skip
        {
            get
            {
                return _Skip;
            }
            set
            {
                _Skip = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Page size, 1 to 1000. Default 25.
        /// </summary>
        public int MaxResults
        {
            get
            {
                return _MaxResults;
            }
            set
            {
                _MaxResults = Math.Clamp(value, 1, 1000);
            }
        }

        private int _Skip = 0;
        private int _MaxResults = 25;
    }
}
