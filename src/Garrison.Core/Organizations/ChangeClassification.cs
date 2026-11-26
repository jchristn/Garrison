namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One change in an executive's draft with its classes (AA8.5): an item, or for an organization one unit's change.
    /// A change with unclassified fields always waits for a person. Not thread-safe.
    /// </summary>
    public class ChangeClassification
    {
        #region Public-Members

        /// <summary>
        /// Manifest kind of the item.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Item name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What changed, in a few words, such as "adds agent triage-2 to unit support", or null.
        /// </summary>
        public string? Detail { get; set; } = null;

        /// <summary>
        /// The live unit the change falls in, which a rule's unit must contain.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Classes of the change.
        /// </summary>
        public List<ChangeClassEnum> Classes { get; set; } = new List<ChangeClassEnum>();

        /// <summary>
        /// New values a rule's limits check, by limit name, such as minIntervalSeconds or weight.
        /// </summary>
        public Dictionary<string, double> Values { get; set; } = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Changed fields no class covers.
        /// </summary>
        public List<string> Unclassified { get; set; } = new List<string>();

        #endregion
    }
}
