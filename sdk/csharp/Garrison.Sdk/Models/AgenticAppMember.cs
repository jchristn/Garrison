namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One agent in an agentic app. Not thread-safe.
    /// </summary>
    public class AgenticAppMember
    {
        #region Public-Members

        /// <summary>
        /// Agent identifier. On create and update the server also accepts an agent name here. Never null.
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
        /// Optional free-text role of the member in the app, or null.
        /// </summary>
        public string? Role { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;

        #endregion
    }
}
