namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One memory scope that holds entries, with totals (AA4). Returned by GET /memory/scopes. Not thread-safe.
    /// </summary>
    public class MemoryScopeSummary
    {
        #region Public-Members

        /// <summary>
        /// Scope kind.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Scope identifier: the agent, app, org unit, or organization identifier.
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
        /// Current name of the agent, app, org unit, or organization, or null when it no longer exists.
        /// </summary>
        public string? ScopeName { get; set; } = null;

        /// <summary>
        /// Entries in the scope. Minimum 0.
        /// </summary>
        public long EntryCount
        {
            get
            {
                return _EntryCount;
            }
            set
            {
                _EntryCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// UTF-8 bytes of the scope's current content, summed. Minimum 0.
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
        /// Most recent write in the scope (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _ScopeId = String.Empty;
        private long _EntryCount = 0;
        private long _Bytes = 0;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryScopeSummary()
        {
        }

        #endregion
    }
}
