namespace Garrison.Core.Manifests
{
    using System.Collections.Generic;

    /// <summary>
    /// Spec of an Organization manifest document (AA7.9): the organization's fields and its units, nested under their
    /// parents. Applying replaces the working tree and, unless publish is false, publishes it as a new revision when it
    /// differs from the live one.
    /// </summary>
    public class OrganizationSpec
    {
        /// <summary>
        /// Description, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Mission, or null.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// Percent past a unit's budget its subtree may spend before the budget guard freezes the unit (AA11.5), 0 to 100,
        /// or null for the default 10.
        /// </summary>
        public int? BudgetFreezeMarginPercent { get; set; } = null;

        /// <summary>
        /// Whether to publish the tree after writing it. Default true.
        /// </summary>
        public bool? Publish { get; set; } = null;

        /// <summary>
        /// The root unit and, nested under it, every other unit. At most one root.
        /// </summary>
        public List<OrgUnitSpec>? Units { get; set; } = null;
    }
}
