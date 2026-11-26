namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The reports a run's agent may see (AA5.3, AA7.5): its own; those of the members of the apps it is the entry agent of,
    /// filed without an app or within one of those apps; every report of its direct reports in an organization; and the
    /// Chain and Board reports of the agents further below it.
    /// </summary>
    public class ReportVisibilityScope
    {
        #region Public-Members

        /// <summary>
        /// The viewing agent.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the viewing agent's own reports are included. Default true.
        /// </summary>
        public bool IncludeOwn { get; set; } = true;

        /// <summary>
        /// Agents whose reports the viewer may see, excluding the viewer.
        /// </summary>
        public List<string> SubordinateAgentIds
        {
            get
            {
                return _SubordinateAgentIds;
            }
            set
            {
                _SubordinateAgentIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Apps the viewer manages; a subordinate's report filed within another app is not visible.
        /// </summary>
        public List<string> ManagedAppIds
        {
            get
            {
                return _ManagedAppIds;
            }
            set
            {
                _ManagedAppIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Agents that report directly to the viewer in a live organization: all of their reports are visible.
        /// </summary>
        public List<string> DirectReportAgentIds
        {
            get
            {
                return _DirectReportAgentIds;
            }
            set
            {
                _DirectReportAgentIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Agents further below the viewer in a live organization: their Chain and Board reports are visible, their
        /// Manager reports are not.
        /// </summary>
        public List<string> ChainAgentIds
        {
            get
            {
                return _ChainAgentIds;
            }
            set
            {
                _ChainAgentIds = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private List<string> _SubordinateAgentIds = new List<string>();
        private List<string> _ManagedAppIds = new List<string>();
        private List<string> _DirectReportAgentIds = new List<string>();
        private List<string> _ChainAgentIds = new List<string>();

        #endregion
    }
}
