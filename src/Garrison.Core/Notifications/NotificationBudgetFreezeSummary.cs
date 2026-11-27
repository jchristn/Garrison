namespace Garrison.Core.Notifications
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Fields carried by OrgBudgetFrozen notifications (AA11.5): the unit the budget guard froze and the spend that crossed
    /// its budget plus the organization's freeze margin.
    /// </summary>
    public class NotificationBudgetFreezeSummary
    {
        #region Public-Members

        /// <summary>
        /// Freeze identifier (mfz_).
        /// </summary>
        public string FreezeId { get; set; } = String.Empty;

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name, or null.
        /// </summary>
        public string? OrganizationName { get; set; } = null;

        /// <summary>
        /// Frozen unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Frozen unit name, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Budget period that was overrun.
        /// </summary>
        public BudgetPeriodEnum Period { get; set; } = BudgetPeriodEnum.Day;

        /// <summary>
        /// Known spend of the unit's subtree in the window when the freeze was applied, in US dollars.
        /// </summary>
        public double SpentUsd { get; set; } = 0;

        /// <summary>
        /// The unit's budget for the period, in US dollars.
        /// </summary>
        public double AmountUsd { get; set; } = 0;

        /// <summary>
        /// The organization's freeze margin when the freeze was applied: 0 to 100 percent over the budget.
        /// </summary>
        public int MarginPercent { get; set; } = 10;

        /// <summary>
        /// Start of the budget window (UTC).
        /// </summary>
        public DateTime WindowStartUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// End of the budget window (UTC).
        /// </summary>
        public DateTime WindowEndUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Runs the freeze cancelled.
        /// </summary>
        public int CancelledRunCount { get; set; } = 0;

        /// <summary>
        /// When the freeze was applied (UTC).
        /// </summary>
        public DateTime FrozenUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public NotificationBudgetFreezeSummary()
        {
        }

        #endregion
    }
}
