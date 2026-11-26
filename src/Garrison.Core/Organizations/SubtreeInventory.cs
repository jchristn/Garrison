namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// The tenant's live agents, deployments, mandates, prompt templates, and agent assets, as
    /// <see cref="SubtreeAuthority"/> needs them (AA8.2). Not thread-safe.
    /// </summary>
    public class SubtreeInventory
    {
        #region Public-Members

        /// <summary>
        /// Records.
        /// </summary>
        public List<InventoryResource> Resources
        {
            get
            {
                return _Resources;
            }
            set
            {
                _Resources = value ?? new List<InventoryResource>();
            }
        }

        #endregion

        #region Private-Members

        private List<InventoryResource> _Resources = new List<InventoryResource>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Records of one kind.
        /// </summary>
        /// <param name="kind">Manifest kind.</param>
        /// <returns>Records.</returns>
        public List<InventoryResource> OfKind(string kind)
        {
            return _Resources.Where(r => String.Equals(r.Kind, kind, StringComparison.Ordinal)).ToList();
        }

        #endregion
    }
}
