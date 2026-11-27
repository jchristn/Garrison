namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Performance of an organization, or of one unit's subtree, over a window (AA11.1, AA11.2): one row per unit in chart
    /// order covering its subtree, one row per positioned agent, and the scheduled checks on the scope's deployments.
    /// Built from the live revision; before the first publish the lists are empty. Not thread-safe.
    /// </summary>
    public class OrgPerformance
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
        /// Inclusive window start (UTC).
        /// </summary>
        public DateTime FromUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Exclusive window end (UTC).
        /// </summary>
        public DateTime ToUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the rollup was computed (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// True when more runs fell in the window than the service reads (PerformanceService.MaxRuns, default 100000); the
        /// newest were kept.
        /// </summary>
        public bool Truncated { get; set; } = false;

        /// <summary>
        /// Units in chart order, each covering its subtree.
        /// </summary>
        public List<OrgUnitPerformance> Units
        {
            get
            {
                return _Units;
            }
            set
            {
                _Units = value ?? new List<OrgUnitPerformance>();
            }
        }

        /// <summary>
        /// Agents positioned in the (restricted) live tree, in chart order.
        /// </summary>
        public List<AgentPerformance> Agents
        {
            get
            {
                return _Agents;
            }
            set
            {
                _Agents = value ?? new List<AgentPerformance>();
            }
        }

        /// <summary>
        /// Scheduled checks whose deployment belongs to an agent in scope, by trigger name.
        /// </summary>
        public List<PerformanceCheck> Checks
        {
            get
            {
                return _Checks;
            }
            set
            {
                _Checks = value ?? new List<PerformanceCheck>();
            }
        }

        #endregion

        #region Private-Members

        private List<OrgUnitPerformance> _Units = new List<OrgUnitPerformance>();
        private List<AgentPerformance> _Agents = new List<AgentPerformance>();
        private List<PerformanceCheck> _Checks = new List<PerformanceCheck>();

        #endregion
    }
}
