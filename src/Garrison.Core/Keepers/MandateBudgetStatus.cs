namespace Garrison.Core.Keepers
{
    using System;

    /// <summary>
    /// A keeper's spend against its revision's budgets (AA3.3): what one tick has spent against budgetPerTickUsd and what
    /// the mandate has spent in the current UTC day against budgetPerDayUsd. Only known cost counts; a run whose cost is
    /// unknown neither blocks nor counts as zero spend beyond what was reported. Not thread-safe.
    /// </summary>
    public class MandateBudgetStatus
    {
        #region Public-Members

        /// <summary>
        /// Most a single tick may spend in USD, or null for no per-tick budget.
        /// </summary>
        public double? BudgetPerTickUsd { get; set; } = null;

        /// <summary>
        /// Most the mandate may spend per UTC day in USD, or null for no daily budget.
        /// </summary>
        public double? BudgetPerDayUsd { get; set; } = null;

        /// <summary>
        /// Known cost of the tick run so far (earlier executions before a suspension or repair). Minimum 0.
        /// </summary>
        public double TickSpentUsd { get; set; } = 0;

        /// <summary>
        /// Known cost of the mandate's tick runs that completed in the current UTC day, plus the tick run so far. Minimum 0.
        /// </summary>
        public double DaySpentUsd { get; set; } = 0;

        /// <summary>
        /// Start of the next UTC day, when the daily budget resets.
        /// </summary>
        public DateTime WindowResetUtc { get; set; } = DateTime.UtcNow.Date.AddDays(1);

        /// <summary>
        /// What the tick may still spend, or null without a per-tick budget. Minimum 0.
        /// </summary>
        public double? TickRemainingUsd
        {
            get
            {
                return BudgetPerTickUsd.HasValue ? Math.Max(0, BudgetPerTickUsd.Value - TickSpentUsd) : null;
            }
        }

        /// <summary>
        /// What the mandate may still spend today, or null without a daily budget. Minimum 0.
        /// </summary>
        public double? DayRemainingUsd
        {
            get
            {
                return BudgetPerDayUsd.HasValue ? Math.Max(0, BudgetPerDayUsd.Value - DaySpentUsd) : null;
            }
        }

        /// <summary>
        /// The smaller of the two remaining allowances, or null without budgets.
        /// </summary>
        public double? RemainingUsd
        {
            get
            {
                double? tick = TickRemainingUsd;
                double? day = DayRemainingUsd;
                if (tick.HasValue && day.HasValue) return Math.Min(tick.Value, day.Value);
                return tick ?? day;
            }
        }

        /// <summary>
        /// The budget that has nothing left ("budgetPerTickUsd" or "budgetPerDayUsd"), or null while both have room.
        /// </summary>
        public string? ExhaustedBudget
        {
            get
            {
                if (TickRemainingUsd.HasValue && TickRemainingUsd.Value <= 0) return "budgetPerTickUsd";
                if (DayRemainingUsd.HasValue && DayRemainingUsd.Value <= 0) return "budgetPerDayUsd";
                return null;
            }
        }

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public MandateBudgetStatus()
        {
        }

        #endregion
    }
}
