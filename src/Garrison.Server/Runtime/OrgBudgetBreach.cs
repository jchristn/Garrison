namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Models;
    using Garrison.Core.Organizations;

    /// <summary>
    /// An org unit budget that a subtree's spend has reached (AA7.6). Not thread-safe.
    /// </summary>
    public class OrgBudgetBreach
    {
        /// <summary>
        /// The organization's live tree.
        /// </summary>
        public OrgTree Tree { get; }

        /// <summary>
        /// The capped unit.
        /// </summary>
        public OrgUnit Unit { get; }

        /// <summary>
        /// The budget and the subtree's spend in its window.
        /// </summary>
        public OrgUnitSpend Spend { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="tree">Live tree.</param>
        /// <param name="unit">Capped unit.</param>
        /// <param name="spend">Budget and spend.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public OrgBudgetBreach(OrgTree tree, OrgUnit unit, OrgUnitSpend spend)
        {
            Tree = tree ?? throw new ArgumentNullException(nameof(tree));
            Unit = unit ?? throw new ArgumentNullException(nameof(unit));
            Spend = spend ?? throw new ArgumentNullException(nameof(spend));
        }
    }
}
