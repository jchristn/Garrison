namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A unit budget with the subtree's spend in its current window (AA7.6). Computed by the server. Not thread-safe.
    /// </summary>
    public class OrgUnitSpend
    {
        /// <summary>
        /// Unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Budget period.
        /// </summary>
        public BudgetPeriodEnum Period { get; set; } = BudgetPeriodEnum.Day;

        /// <summary>
        /// Budget in US dollars, or null for a unit without a budget for this period (its spend is still reported).
        /// </summary>
        public double? AmountUsd { get; set; } = null;

        /// <summary>
        /// Known spend of the subtree's agents in the window, in US dollars. Runs whose cost is unknown count as 0.
        /// </summary>
        public double SpentUsd { get; set; } = 0;

        /// <summary>
        /// Share of the budget spent, 0 to 1 or more, or null without a budget.
        /// </summary>
        public double? Fraction { get; set; } = null;

        /// <summary>
        /// True when the spend has reached the budget: new runs in the subtree are refused with BudgetExhausted.
        /// </summary>
        public bool Exhausted { get; set; } = false;

        /// <summary>
        /// Start of the window (UTC).
        /// </summary>
        public DateTime WindowStartUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// End of the window (UTC); the budget resets then.
        /// </summary>
        public DateTime WindowEndUtc { get; set; } = DateTime.UtcNow;
    }
}
