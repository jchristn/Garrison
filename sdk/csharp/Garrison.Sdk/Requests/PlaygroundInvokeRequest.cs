namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Run an agent's draft revision in the studio playground (AD9.1). Not thread-safe.
    /// </summary>
    public class PlaygroundInvokeRequest
    {
        #region Public-Members

        /// <summary>
        /// The message. Never null.
        /// </summary>
        public string Input
        {
            get
            {
                return _Input;
            }
            set
            {
                _Input = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent, by name or identifier. For a studio draft, null means the target app's entry agent; for an agent route,
        /// ignored. Default null.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Agent revision to run. Null runs the agent's open draft revision, or its latest published one when it has no
        /// draft. Ignored by the studio draft route, which runs the revision it writes from the draft. Default null.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Deployment whose settings the playground copies. Null uses the agent's dev deployment, or its first one.
        /// Default null.
        /// </summary>
        public string? SourceDeploymentId { get; set; } = null;

        /// <summary>
        /// Conversation to continue, or null to start one. Default null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Whether to wait for the run to finish. Default true.
        /// </summary>
        public bool Wait { get; set; } = true;

        /// <summary>
        /// Most seconds to wait. Default 120; minimum 1; maximum 3600. Values outside the range are clamped.
        /// </summary>
        public int WaitSeconds
        {
            get
            {
                return _WaitSeconds;
            }
            set
            {
                _WaitSeconds = Math.Clamp(value, 1, 3600);
            }
        }

        #endregion

        #region Private-Members

        private string _Input = String.Empty;
        private int _WaitSeconds = 120;

        #endregion
    }
}
