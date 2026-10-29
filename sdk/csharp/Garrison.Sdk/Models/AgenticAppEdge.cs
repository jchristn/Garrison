namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A call one member of an agentic app may make to another. The edges together are the app's delegation policy and
    /// must form a graph without cycles in which every member is reachable from the entry agent. Not thread-safe.
    /// </summary>
    public class AgenticAppEdge
    {
        #region Public-Members

        /// <summary>
        /// Calling member's agent identifier (a name is accepted on create and update). Never null.
        /// </summary>
        public string CallerAgentId
        {
            get
            {
                return _CallerAgentId;
            }
            set
            {
                _CallerAgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Called member's agent identifier (a name is accepted on create and update). Never null.
        /// </summary>
        public string CalleeAgentId
        {
            get
            {
                return _CalleeAgentId;
            }
            set
            {
                _CalleeAgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether the caller may reach the callee through garrison_fan_out. Default true.
        /// </summary>
        public bool FanOutAllowed { get; set; } = true;

        #endregion

        #region Private-Members

        private string _CallerAgentId = String.Empty;
        private string _CalleeAgentId = String.Empty;

        #endregion
    }
}
