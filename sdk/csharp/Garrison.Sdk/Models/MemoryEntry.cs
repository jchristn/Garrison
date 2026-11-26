namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Metadata of one memory entry (AA4), without its text. Agents write entries through the memory tools; people read
    /// and delete them through the Memory client. Not thread-safe.
    /// </summary>
    public class MemoryEntry
    {
        #region Public-Members

        /// <summary>
        /// Entry identifier (mem_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Scope kind.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Scope identifier: the agent or app identifier.
        /// </summary>
        public string ScopeId { get; set; } = String.Empty;

        /// <summary>
        /// Key, unique within the scope. An entry imported from agent memory written before 0.3.0 reads "legacy:" and the
        /// hash of its key until an agent uses the key (Legacy is true).
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Uppercase hexadecimal SHA-256 of the key.
        /// </summary>
        public string KeyHash { get; set; } = String.Empty;

        /// <summary>
        /// True for imported agent memory whose real key is not known yet.
        /// </summary>
        public bool Legacy { get; set; } = false;

        /// <summary>
        /// Category, or null.
        /// </summary>
        public string? Category { get; set; } = null;

        /// <summary>
        /// Tags, lowercase.
        /// </summary>
        public List<string> Tags { get; set; } = new List<string>();

        /// <summary>
        /// UTF-8 bytes of the text.
        /// </summary>
        public long Bytes { get; set; } = 0;

        /// <summary>
        /// Lowercase hexadecimal SHA-256 of the text.
        /// </summary>
        public string Sha256 { get; set; } = String.Empty;

        /// <summary>
        /// Content handle in the memory store.
        /// </summary>
        public string ContentId { get; set; } = String.Empty;

        /// <summary>
        /// Version, 1 after the first write and one more after each later write.
        /// </summary>
        public long Version { get; set; } = 1;

        /// <summary>
        /// Agent whose run wrote the current version, or null.
        /// </summary>
        public string? WriterAgentId { get; set; } = null;

        /// <summary>
        /// Run that wrote the current version, or null.
        /// </summary>
        public string? WriterRunId { get; set; } = null;

        /// <summary>
        /// Kind of principal that wrote the current version, or null.
        /// </summary>
        public PrincipalTypeEnum? WriterPrincipalType { get; set; } = null;

        /// <summary>
        /// Identifier of the writing run, user, or credential, or null.
        /// </summary>
        public string? WriterPrincipalId { get; set; } = null;

        /// <summary>
        /// Display name of the writer, or null.
        /// </summary>
        public string? WriterName { get; set; } = null;

        /// <summary>
        /// When the entry was last read (UTC), or null.
        /// </summary>
        public DateTime? LastReadUtc { get; set; } = null;

        /// <summary>
        /// When the entry expires (UTC), or null for never.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last write time (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
