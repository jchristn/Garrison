namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Each member's delegation policy derived from an agentic app's graph, with drift against what is published. Not
    /// thread-safe.
    /// </summary>
    public class AppDelegationPlan
    {
        #region Public-Members

        /// <summary>
        /// App identifier. Never null.
        /// </summary>
        public string AppId
        {
            get
            {
                return _AppId;
            }
            set
            {
                _AppId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether this plan is the result of an apply (drifting members' drafts were written). Default false.
        /// </summary>
        public bool Applied { get; set; } = false;

        /// <summary>
        /// One entry per member. Never null; assigning null stores an empty list.
        /// </summary>
        public List<AppDelegationMember> Members
        {
            get
            {
                return _Members;
            }
            set
            {
                _Members = value ?? new List<AppDelegationMember>();
            }
        }

        #endregion

        #region Private-Members

        private string _AppId = String.Empty;
        private List<AppDelegationMember> _Members = new List<AppDelegationMember>();

        #endregion
    }
}
