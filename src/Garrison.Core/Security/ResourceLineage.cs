namespace Garrison.Core.Security
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What a resource-scoped grant can match besides the identifier in the request (UT-01, UT-02). Aliases name the same
    /// resource (the identifier behind a name the request used), so a grant on an alias always matches. Ancestors are the
    /// organizations the resource belongs to (an organization's units, agents, keepers, escalations, freezes, reports,
    /// and so on), so a grant on an ancestor matches only when it inherits to children. Not thread-safe; build it, then
    /// read it.
    /// </summary>
    public class ResourceLineage
    {
        #region Public-Members

        /// <summary>
        /// Identifiers of the same resource. Never null; empty when the request already used the identifier.
        /// </summary>
        public List<string> Aliases
        {
            get
            {
                return _Aliases;
            }
            set
            {
                _Aliases = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Identifiers of the organizations the resource belongs to. Never null; empty when it belongs to none.
        /// </summary>
        public List<string> Ancestors
        {
            get
            {
                return _Ancestors;
            }
            set
            {
                _Ancestors = value ?? new List<string>();
            }
        }

        /// <summary>
        /// True when the lineage has no aliases and no ancestors.
        /// </summary>
        public bool IsEmpty
        {
            get
            {
                return _Aliases.Count == 0 && _Ancestors.Count == 0;
            }
        }

        #endregion

        #region Private-Members

        private List<string> _Aliases = new List<string>();
        private List<string> _Ancestors = new List<string>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add an alias once. Null or empty values are ignored.
        /// </summary>
        /// <param name="id">Identifier.</param>
        public void AddAlias(string? id)
        {
            if (String.IsNullOrEmpty(id) || _Aliases.Contains(id)) return;
            _Aliases.Add(id);
        }

        /// <summary>
        /// Add an ancestor once. Null or empty values are ignored.
        /// </summary>
        /// <param name="id">Organization identifier.</param>
        public void AddAncestor(string? id)
        {
            if (String.IsNullOrEmpty(id) || _Ancestors.Contains(id)) return;
            _Ancestors.Add(id);
        }

        #endregion
    }
}
