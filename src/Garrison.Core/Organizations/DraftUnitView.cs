namespace Garrison.Core.Organizations
{
    using System;
    using Garrison.Core.Manifests;

    /// <summary>
    /// One unit of an organization document flattened with its parent's name (AA8.3). Not thread-safe.
    /// </summary>
    public class DraftUnitView
    {
        #region Public-Members

        /// <summary>
        /// Unit name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Parent unit name, or null for the root.
        /// </summary>
        public string? ParentName { get; set; } = null;

        /// <summary>
        /// The unit as written, with its child units.
        /// </summary>
        public OrgUnitSpec Spec { get; set; } = new OrgUnitSpec();

        #endregion
    }
}
