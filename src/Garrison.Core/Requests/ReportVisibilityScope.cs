namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The reports a run's agent may see (AA5.3): its own, and before organizations exist (AA7) those of the members of the
    /// apps it is the entry agent of, filed without an app or within one of those apps.
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

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private List<string> _SubordinateAgentIds = new List<string>();
        private List<string> _ManagedAppIds = new List<string>();

        #endregion
    }
}
