namespace Garrison.Server.Protocols
{
    using System.Collections.Generic;

    /// <summary>Typed arguments of the garrison_memory_* tools (AA4.6). Tenant identity comes from the authenticated caller.</summary>
    public class McpMemoryArguments
    {
        /// <summary>Agent identifier or name of an Agent scope. Runs may name only their own agent; people must name one for the Agent scope.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>Scope kind: Agent (default), App, OrgUnit, or Organization.</summary>
        public string? Scope { get; set; } = null;

        /// <summary>Scope identifier or name: the agent for Agent, the app for App. Defaults to the run's own agent, or to the run's only app.</summary>
        public string? ScopeId { get; set; } = null;

        /// <summary>Key, 1 to 256 characters (read, write, delete).</summary>
        public string? Key { get; set; } = null;

        /// <summary>Text to store (write).</summary>
        public string? Value { get; set; } = null;

        /// <summary>Version the entry must be at (write, delete); 0 means it must not exist yet. Omit to write whatever is there.</summary>
        public long? ExpectedVersion { get; set; } = null;

        /// <summary>Category, at most 128 characters (write; a filter when listing).</summary>
        public string? Category { get; set; } = null;

        /// <summary>Tags, each 1 to 64 characters, at most 20 (write).</summary>
        public List<string>? Tags { get; set; } = null;

        /// <summary>Tag filter (list).</summary>
        public string? Tag { get; set; } = null;

        /// <summary>Seconds until the entry expires, 1 to 31536000, or 0 to clear an expiry (write).</summary>
        public int? TtlSeconds { get; set; } = null;

        /// <summary>Keyword (search; a key, category, and tag filter when listing).</summary>
        public string? Query { get; set; } = null;

        /// <summary>Key prefix filter (list).</summary>
        public string? KeyPrefix { get; set; } = null;

        /// <summary>Records to skip (list). Minimum 0.</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Most results, 1 to 100. Default 25.</summary>
        public int? MaxResults { get; set; } = null;
    }
}
