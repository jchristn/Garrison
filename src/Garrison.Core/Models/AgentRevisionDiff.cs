namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Field-level difference between two revisions of one agent (AD1.2): scalar fields, schemas, delegation policy,
    /// allow list entries, prompt pins, capabilities, and tags.
    /// </summary>
    public class AgentRevisionDiff
    {
        #region Public-Members

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Older revision identifier.
        /// </summary>
        public string FromRevisionId { get; set; } = String.Empty;

        /// <summary>
        /// Older revision number.
        /// </summary>
        public int FromNumber { get; set; } = 0;

        /// <summary>
        /// Newer revision identifier.
        /// </summary>
        public string ToRevisionId { get; set; } = String.Empty;

        /// <summary>
        /// Newer revision number.
        /// </summary>
        public int ToNumber { get; set; } = 0;

        /// <summary>
        /// True when the two revisions have the same content hash.
        /// </summary>
        public bool Identical { get; set; } = false;

        /// <summary>
        /// Changes, in field order.
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

        private List<AgentRevisionChange> _Changes = new List<AgentRevisionChange>();

        #endregion
    }
}
