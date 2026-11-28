namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Health of one unit on the board (AA10.2): its latest report, open escalations, freezes, and budgets. Not
    /// thread-safe.
    /// </summary>
    public class BoardUnitHealth
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
        /// Health of the newest report filed from the unit; Unknown when the unit has no report.
        /// </summary>
        public ReportHealthEnum Health { get; set; } = ReportHealthEnum.Unknown;

        /// <summary>
        /// Newest report filed from the unit, or null.
        /// </summary>
        public string? LastReportId { get; set; } = null;

        /// <summary>
        /// When the newest report was filed (UTC), or null.
        /// </summary>
        public DateTime? LastReportUtc { get; set; } = null;

        /// <summary>
        /// Open escalations raised by the unit's lead and members.
        /// </summary>
        public int OpenEscalations { get; set; } = 0;

        /// <summary>
        /// True when an active freeze covers the unit (on it, an ancestor unit, or the organization).
        /// </summary>
        public bool Frozen { get; set; } = false;

        /// <summary>
        /// True when any budget of the unit is spent: a spend row with an amount and spent at or above it.
        /// </summary>
        public bool OverBudget { get; set; } = false;

        /// <summary>
        /// True when a person should look at the unit whatever its report says: it has open escalations or a spent
        /// budget. Read only; derived from <see cref="OpenEscalations"/> and <see cref="OverBudget"/>. A unit with a
        /// Healthy report can still need attention.
        /// </summary>
        public bool NeedsAttention
        {
            get
            {
                return OpenEscalations > 0 || OverBudget;
            }
        }
    }
}
