namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A memory scope that holds entries, with totals (AA4). Not thread-safe.
    /// </summary>
    public class MemoryScopeSummary
    {
        /// <summary>
        /// Scope kind.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Scope identifier.
        /// </summary>
        public string ScopeId { get; set; } = String.Empty;

        /// <summary>
        /// Current name of the agent or app, or null when it no longer exists.
        /// </summary>
        public string? ScopeName { get; set; } = null;

        /// <summary>
        /// Entries in the scope.
        /// </summary>
        public long EntryCount { get; set; } = 0;

        /// <summary>
        /// UTF-8 bytes of the scope's text, summed.
        /// </summary>
        public long Bytes { get; set; } = 0;

        /// <summary>
        /// Latest write in the scope (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;
    }
}
