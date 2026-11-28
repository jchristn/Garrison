namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Health of one unit on the board view (AA10). Not thread-safe.
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
        /// Health from the unit's newest report, or Unknown when the unit has no report.
        /// </summary>
        public ReportHealthEnum Health { get; set; } = ReportHealthEnum.Unknown;

        /// <summary>
        /// Newest report identifier, or null.
        /// </summary>
        public string? LastReportId { get; set; } = null;

        /// <summary>
        /// When the newest report was filed (UTC), or null.
        /// </summary>
        public DateTime? LastReportUtc { get; set; } = null;

        /// <summary>
        /// Number of pending escalations raised in the unit.
        /// </summary>
        public int OpenEscalations { get; set; } = 0;

        /// <summary>
        /// True when an active freeze covers the unit or the organization.
        /// </summary>
        public bool Frozen { get; set; } = false;

        /// <summary>
        /// True when any spend row for the unit has a budget and has spent at least that much.
        /// </summary>
        public bool OverBudget { get; set; } = false;

        /// <summary>
        /// True when the unit has open escalations or a spent budget, whatever its report says. The server derives it.
        /// </summary>
        public bool NeedsAttention { get; set; } = false;
    }
}
