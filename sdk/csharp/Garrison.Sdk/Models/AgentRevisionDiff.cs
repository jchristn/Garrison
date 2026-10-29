namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Field-level differences between two revisions of one agent.
    /// </summary>
    public class AgentRevisionDiff
    {
        #region Public-Members

        /// <summary>
        /// Agent identifier.
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
        /// Earlier revision identifier.
        /// </summary>
        public string FromRevisionId
        {
            get
            {
                return _FromRevisionId;
            }
            set
            {
                _FromRevisionId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Earlier revision number.
        /// </summary>
        public int FromNumber { get; set; } = 0;

        /// <summary>
        /// Later revision identifier.
        /// </summary>
        public string ToRevisionId
        {
            get
            {
                return _ToRevisionId;
            }
            set
            {
                _ToRevisionId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Later revision number.
        /// </summary>
        public int ToNumber { get; set; } = 0;

        /// <summary>
        /// True when the revisions have the same content.
        /// </summary>
        public bool Identical { get; set; } = false;

        /// <summary>
        /// Field changes.
        /// </summary>
        public List<AgentRevisionChange> Changes
        {
            get
            {
                return _Changes;
            }
            set
            {
                _Changes = value ?? new List<AgentRevisionChange>();
            }
        }

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private string _FromRevisionId = String.Empty;
        private string _ToRevisionId = String.Empty;
        private List<AgentRevisionChange> _Changes = new List<AgentRevisionChange>();

        #endregion
    }
}
