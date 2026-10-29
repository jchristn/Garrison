namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One member's delegation policy derived from an agentic app's graph, compared with its latest published revision.
    /// Not thread-safe.
    /// </summary>
    public class AppDelegationMember
    {
        #region Public-Members

        /// <summary>
        /// Agent identifier. Never null.
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
        /// Agent name. Never null.
        /// </summary>
        public string AgentName
        {
            get
            {
                return _AgentName;
            }
            set
            {
                _AgentName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Mode the graph calls for: AllowList, or None for a member that calls nobody. Default None.
        /// </summary>
        public DelegationModeEnum DesiredMode { get; set; } = DelegationModeEnum.None;

        /// <summary>
        /// Agent names the member has edges to. Never null; assigning null stores an empty list.
        /// </summary>
        public List<string> DesiredAllowList
        {
            get
            {
                return _DesiredAllowList;
            }
            set
            {
                _DesiredAllowList = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Longest path of calls below the member. Default 0.
        /// </summary>
        public int DesiredMaxDepth { get; set; } = 0;

        /// <summary>
        /// Mode of the latest published revision, or null when the member has none.
        /// </summary>
        public DelegationModeEnum? PublishedMode { get; set; } = null;

        /// <summary>
        /// Allow list of the latest published revision. Never null; assigning null stores an empty list.
        /// </summary>
        public List<string> PublishedAllowList
        {
            get
            {
                return _PublishedAllowList;
            }
            set
            {
                _PublishedAllowList = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Maximum depth of the latest published revision, or null when the member has none.
        /// </summary>
        public int? PublishedMaxDepth { get; set; } = null;

        /// <summary>
        /// Whether the published policy differs from the graph's. Default false.
        /// </summary>
        public bool Drift { get; set; } = false;

        /// <summary>
        /// Draft revision number written by an apply, or null.
        /// </summary>
        public int? DraftRevisionNumber { get; set; } = null;

        /// <summary>
        /// Why an apply left the member alone, for example DraftConflict when its open draft already changes its
        /// delegation another way, or null.
        /// </summary>
        public string? SkippedReason { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private List<string> _DesiredAllowList = new List<string>();
        private List<string> _PublishedAllowList = new List<string>();

        #endregion
    }
}
