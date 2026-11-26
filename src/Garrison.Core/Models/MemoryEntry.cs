namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// Metadata of one scoped memory entry (AA4, AA-018). The text itself lives in the IScopedMemoryStore provider under
    /// ContentId; this record says where the entry lives, who wrote it, and which content is current. Writes compare and
    /// set on Version. Entry text is untrusted data written by agents (AA-025). Not thread-safe.
    /// </summary>
    public class MemoryEntry
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix mem_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewMemoryEntryId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Kind of scope the entry lives in. Default Agent.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Identifier of the scope: the agent, app, org unit, or organization identifier.
        /// </summary>
        public string ScopeId
        {
            get
            {
                return _ScopeId;
            }
            set
            {
                _ScopeId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Key, unique within the scope. 1 to 256 characters; any text. An entry imported from agent memory written
        /// before scopes existed has the key "legacy:" followed by KeyHash until a run uses its real key (Legacy is true).
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 256 characters.</exception>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                if (String.IsNullOrEmpty(value) || value.Length > 256) throw new ArgumentException("A memory key holds 1 to 256 characters.", nameof(Key));
                _Key = value;
            }
        }

        /// <summary>
        /// Uppercase hexadecimal SHA-256 of the UTF-8 key. Set by the server; lets imported agent memory find its key.
        /// </summary>
        public string KeyHash
        {
            get
            {
                return _KeyHash;
            }
            set
            {
                _KeyHash = value ?? String.Empty;
            }
        }

        /// <summary>
        /// True for an entry imported from agent memory written before scopes existed whose key has not been used since,
        /// so its real key is not known yet. Default false.
        /// </summary>
        public bool Legacy { get; set; } = false;

        /// <summary>
        /// Optional category, at most 128 characters, for grouping and filtering. Null when not set.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is longer than 128 characters.</exception>
        public string? Category
        {
            get
            {
                return _Category;
            }
            set
            {
                if (value != null && value.Length > 128) throw new ArgumentException("A memory category holds at most 128 characters.", nameof(Category));
                _Category = String.IsNullOrWhiteSpace(value) ? null : value;
            }
        }

        /// <summary>
        /// Tags, lowercase, each 1 to 64 characters, at most 20. Never null.
        /// </summary>
        public List<string> Tags
        {
            get
            {
                return _Tags;
            }
            set
            {
                _Tags = value ?? new List<string>();
            }
        }

        /// <summary>
        /// UTF-8 bytes of the current content. Minimum 0.
        /// </summary>
        public long Bytes
        {
            get
            {
                return _Bytes;
            }
            set
            {
                _Bytes = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Lowercase hexadecimal SHA-256 of the current content's UTF-8 bytes.
        /// </summary>
        public string Sha256
        {
            get
            {
                return _Sha256;
            }
            set
            {
                _Sha256 = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Provider handle of the current content. Every write stores new content under a new handle and then points the
        /// entry at it, so a crash between the two never exposes half of a write. Set by the server.
        /// </summary>
        public string ContentId
        {
            get
            {
                return _ContentId;
            }
            set
            {
                _ContentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Version, 1 after the first write and one more after each later write. A write that names an expectedVersion
        /// succeeds only while the entry is at that version. Minimum 1.
        /// </summary>
        public long Version
        {
            get
            {
                return _Version;
            }
            set
            {
                _Version = Math.Max(1, value);
            }
        }

        /// <summary>
        /// Agent whose run wrote the current version, or null when a person or credential wrote it.
        /// </summary>
        public string? WriterAgentId { get; set; } = null;

        /// <summary>
        /// Run that wrote the current version, or null when a person or credential wrote it.
        /// </summary>
        public string? WriterRunId { get; set; } = null;

        /// <summary>
        /// Kind of principal that wrote the current version, or null when unknown (imported entries).
        /// </summary>
        public PrincipalTypeEnum? WriterPrincipalType { get; set; } = null;

        /// <summary>
        /// Identifier of the principal that wrote the current version: the run, user, or credential identifier.
        /// </summary>
        public string? WriterPrincipalId { get; set; } = null;

        /// <summary>
        /// Display name of the writer: the agent's name for a run, the person's or credential's name otherwise.
        /// </summary>
        public string? WriterName { get; set; } = null;

        /// <summary>
        /// When a run or person last read the entry (UTC), recorded in batches, or null when never read since it was
        /// written. Lets a curator find stale entries.
        /// </summary>
        public DateTime? LastReadUtc { get; set; } = null;

        /// <summary>
        /// When the entry expires (UTC), or null for never. The maintenance sweep deletes expired entries.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last write timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewMemoryEntryId();
        private string _TenantId = String.Empty;
        private string _ScopeId = String.Empty;
        private string _Key = "key";
        private string _KeyHash = String.Empty;
        private string? _Category = null;
        private List<string> _Tags = new List<string>();
        private long _Bytes = 0;
        private string _Sha256 = String.Empty;
        private string _ContentId = String.Empty;
        private long _Version = 1;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryEntry()
        {
        }

        #endregion
    }
}
