namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Promote an agent's revision from one environment to the next.
    /// </summary>
    public class PromotionRequest
    {
        #region Public-Members

        /// <summary>
        /// Agent identifier or name. Required.
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
        /// Source environment. Required.
        /// </summary>
        public string SourceEnvironment
        {
            get
            {
                return _SourceEnvironment;
            }
            set
            {
                _SourceEnvironment = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Target environment, or null for the next environment in the ladder.
        /// </summary>
        public string? TargetEnvironment { get; set; } = null;

        /// <summary>
        /// Revision to promote, or null for the revision the source environment runs.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Allow promoting past intermediate environments. Default false.
        /// </summary>
        public bool AllowSkip { get; set; } = false;

        /// <summary>
        /// Optional note.
        /// </summary>
        public string? Note { get; set; } = null;

        #endregion

        #region Private-Members

        private string _AgentId = String.Empty;
        private string _SourceEnvironment = String.Empty;

        #endregion
    }
}
