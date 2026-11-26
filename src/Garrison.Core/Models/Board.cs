namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// The board's view of one organization (AA10.2): everything a person who governs the organization needs on one page,
    /// computed in one call. Read-only; built by the server on every request. Not thread-safe.
    /// </summary>
    public class Board
    {
        #region Public-Members

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Mission, or null.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// Organization status.
        /// </summary>
        public OrganizationStatusEnum Status { get; set; } = OrganizationStatusEnum.Draft;

        /// <summary>
        /// When the aggregate was computed (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The chart of the live revision (the working tree before the first publish).
        /// </summary>
        public OrgChart Chart { get; set; } = new OrgChart();

        /// <summary>
        /// The root unit's lead, or null when the root has no lead.
        /// </summary>
        public BoardCeo? Ceo { get; set; } = null;

        /// <summary>
        /// Health of each chart unit, in chart order.
        /// </summary>
        public List<BoardUnitHealth> UnitHealth { get; set; } = new List<BoardUnitHealth>();

        /// <summary>
        /// Open escalations raised by agents of the live revision, newest first, at most the request limit.
        /// </summary>
        public List<Escalation> Escalations { get; set; } = new List<Escalation>();

        /// <summary>
        /// Proposals waiting for a person's decision (approval Pending), newest first, with evidence and without diffs, at
        /// most the request limit.
        /// </summary>
        public List<OrgProposal> Proposals { get; set; } = new List<OrgProposal>();

        /// <summary>
        /// Spend of each unit's subtree against its budgets in the current windows (the rows of the spend route).
        /// </summary>
        public List<OrgUnitSpend> Spend { get; set; } = new List<OrgUnitSpend>();

        /// <summary>
        /// Newest Brief report authored by an agent of this organization, or null.
        /// </summary>
        public Report? LatestBrief { get; set; } = null;

        /// <summary>
        /// Newest Degraded or Unhealthy reports from agents of this organization in the last 7 days, at most the request
        /// limit.
        /// </summary>
        public List<Report> UnhealthyReports { get; set; } = new List<Report>();

        /// <summary>
        /// Active freezes covering the organization, its units, its agents, or its mandates, plus an active TenantAutonomy
        /// freeze.
        /// </summary>
        public List<Freeze> Freezes { get; set; } = new List<Freeze>();

        /// <summary>
        /// The tenant's autonomy kill switch.
        /// </summary>
        public KillSwitchState KillSwitch { get; set; } = new KillSwitchState();

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public Board()
        {
        }

        #endregion
    }
}
