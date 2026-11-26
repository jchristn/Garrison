namespace Garrison.Core.Memory
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Where one piece of scoped memory content lives (AA4): tenant, scope, key, and the content handle of one written
    /// version. Providers may ignore the key and store by handle alone. Not thread-safe.
    /// </summary>
    public class MemoryContentAddress
    {
        #region Public-Members

        /// <summary>
        /// Tenant identifier. Required.
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
        /// Scope kind. Default Agent.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; set; } = MemoryScopeKindEnum.Agent;

        /// <summary>
        /// Scope identifier. Required.
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
        /// Entry key, for providers that keep readable keys. Required.
        /// </summary>
        public string Key
        {
            get
            {
                return _Key;
            }
            set
            {
                _Key = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Content handle: 1 to 128 letters, digits, and hyphens, unique for every write. The server chooses it.
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

        #endregion

        #region Private-Members

        private string _TenantId = String.Empty;
        private string _ScopeId = String.Empty;
        private string _Key = String.Empty;
        private string _ContentId = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MemoryContentAddress()
        {
        }

        #endregion
    }
}
