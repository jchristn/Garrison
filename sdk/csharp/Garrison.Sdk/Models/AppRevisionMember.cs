namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One member of an app revision: the agent and the published agent revision the app revision pins. Not thread-safe.
    /// </summary>
    public class AppRevisionMember
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
        /// Agent name, filled in by the server on read, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Pinned agent revision identifier (prefix arv_). Never null.
        /// </summary>
        public string AgentRevisionId
        {
            get
            {
                return _AgentRevisionId;
            }
            set
            {
                _AgentRevisionId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Number of the pinned agent revision, filled in by the server on read, or null.
        /// </summary>
        public int? AgentRevisionNumber { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private string _AgentRevisionId = String.Empty;

        #endregion
    }
}
