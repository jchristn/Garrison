namespace Garrison.Core.Database.Ado
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A change rule's class or limit row with the rule it belongs to, used while loading rules (AA8.4).
    /// </summary>
    public class ChangeRuleChildRow
    {
        /// <summary>
        /// Rule identifier.
        /// </summary>
        public string RuleId { get; set; } = String.Empty;

        /// <summary>
        /// The class row, or null for a limit row.
        /// </summary>
        public ChangeRuleClass? Class { get; set; } = null;

        /// <summary>
        /// The limit row, or null for a class row.
        /// </summary>
        public ChangeRuleLimit? Limit { get; set; } = null;
    }
}
