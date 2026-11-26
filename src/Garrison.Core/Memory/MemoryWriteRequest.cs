namespace Garrison.Core.Memory
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One scoped memory write (AA4). Not thread-safe.
    /// </summary>
    public class MemoryWriteRequest
    {
        #region Public-Members

        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Scope kind. Default Agent.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Scope identifier. Required.
        /// </summary>
        public string ScopeId { get; set; } = String.Empty;

        /// <summary>
        /// Key, 1 to 256 characters. Required.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Text to store. Required; at most Memory.Scoped.MaxValueBytes UTF-8 bytes.
        /// </summary>
        public string Value { get; set; } = String.Empty;

        /// <summary>
        /// Category, at most 128 characters, or null to keep the entry's current category (none for a new entry).
        /// </summary>
        public string? Category { get; set; } = null;

        /// <summary>
        /// Tags, or null to keep the entry's current tags. Each is trimmed and lowercased, 1 to 64 characters; at most 20.
        /// </summary>
        public List<string>? Tags { get; set; } = null;

        /// <summary>
        /// Seconds until the entry expires, 1 to 31536000 (365 days), 0 to clear an expiry, or null to keep the entry's
        /// current expiry (none for a new entry).
        /// </summary>
        public int? TtlSeconds { get; set; } = null;

        /// <summary>
        /// Version the entry must be at for the write to succeed, 0 for "must not exist yet", or null to write whatever
        /// the current version is.
        /// </summary>
        public long? ExpectedVersion { get; set; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryWriteRequest()
        {
        }

        #endregion
    }
}
