namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Parameters of <c>thread/resume</c> (<c>ThreadResumeParams</c>), resuming a thread saved under <c>CODEX_HOME</c> by identifier.
    /// </summary>
    public class CodexThreadResumeParams
    {
        #region Public-Members

        /// <summary>
        /// Thread identifier.
        /// </summary>
        [JsonPropertyName("threadId")]
        public string ThreadId
        {
            get
            {
                return _ThreadId;
            }
            set
            {
                _ThreadId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Working directory of the thread, or null to keep the saved one.
        /// </summary>
        [JsonPropertyName("cwd")]
        public string? Cwd { get; set; } = null;

        /// <summary>
        /// Approval policy, or null for the configured one.
        /// </summary>
        [JsonPropertyName("approvalPolicy")]
        public string? ApprovalPolicy { get; set; } = null;

        #endregion

        #region Private-Members

        private string _ThreadId = String.Empty;

        #endregion
    }
}
