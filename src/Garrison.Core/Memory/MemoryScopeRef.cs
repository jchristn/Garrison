namespace Garrison.Core.Memory
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A memory scope: its kind and identifier (AA4). Immutable; thread-safe.
    /// </summary>
    public class MemoryScopeRef
    {
        #region Public-Members

        /// <summary>
        /// Scope kind.
        /// </summary>
        public MemoryScopeKindEnum ScopeKind { get; }

        /// <summary>
        /// Scope identifier.
        /// </summary>
        public string ScopeId { get; }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="scopeKind">Scope kind.</param>
        /// <param name="scopeId">Scope identifier.</param>
        /// <exception cref="ArgumentNullException">Thrown when scopeId is null or empty.</exception>
        public MemoryScopeRef(MemoryScopeKindEnum scopeKind, string scopeId)
        {
            if (String.IsNullOrEmpty(scopeId)) throw new ArgumentNullException(nameof(scopeId));
            ScopeKind = scopeKind;
            ScopeId = scopeId;
        }

        #endregion
    }
}
