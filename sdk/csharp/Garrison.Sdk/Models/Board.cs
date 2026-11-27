namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// The board view of an organization (AA10): one aggregate with the chart, the CEO, health per unit, open escalations,
    /// proposals awaiting a decision, spend, the newest brief, recent unhealthy reports, freezes, and the kill switch.
    /// Computed by the server on each read and never stored. Not thread-safe.
    /// </summary>
    public class Board
    {
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
        public OrganizationStatusEnum Status { get; set; } = OrganizationStatusEnum.Active;

        /// <summary>
        /// When the server computed the aggregate (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The chart of the live revision. Its unit list is empty when nothing is published.
        /// </summary>
        public OrgChart Chart { get; set; } = new OrgChart();

        /// <summary>
        /// The CEO (the root unit's lead), or null when the root unit has no lead.
        /// </summary>
        public BoardCeo? Ceo { get; set; } = null;

        /// <summary>
        /// Health of each chart unit, in chart order.
        /// </summary>
        public List<BoardUnitHealth> UnitHealth { get; set; } = new List<BoardUnitHealth>();

        /// <summary>
        /// Pending escalations raised by agents of the live revision or addressed to the board, newest first, at most the
        /// requested limit.
        /// </summary>
        public List<Escalation> Escalations { get; set; } = new List<Escalation>();

        /// <summary>
        /// Proposals awaiting a decision, newest first, with evidence and without the diff (read the proposal for the
        /// diff), at most the requested limit.
        /// </summary>
        public List<OrgProposal> Proposals { get; set; } = new List<OrgProposal>();

        /// <summary>
        /// Spend against unit budgets, the same rows the organization spend route returns.
        /// </summary>
        public List<OrgUnitSpend> Spend { get; set; } = new List<OrgUnitSpend>();

        /// <summary>
        /// The newest report of kind Brief by an agent of the organization, or null when none was filed.
        /// </summary>
        public Report? LatestBrief { get; set; } = null;

        /// <summary>
        /// Reports with health Degraded or Unhealthy from agents of the organization in the last 7 days, one per author (its
        /// newest), newest first, at most the requested limit.
        /// </summary>
        public List<Report> UnhealthyReports { get; set; } = new List<Report>();

        /// <summary>
        /// For a report in <see cref="UnhealthyReports"/>, keyed by its identifier: how many earlier Degraded or Unhealthy
        /// reports its author filed in the same window. A report with no earlier ones has no entry.
        /// </summary>
        public Dictionary<string, int> UnhealthyEarlierCounts { get; set; } = new Dictionary<string, int>();

        /// <summary>
        /// Active freezes covering the organization, its units, or its agents, plus an active tenant autonomy freeze.
        /// </summary>
        public List<Freeze> Freezes { get; set; } = new List<Freeze>();

        /// <summary>
        /// The tenant kill switch.
        /// </summary>
        public KillSwitchState KillSwitch { get; set; } = new KillSwitchState();
    }
}
