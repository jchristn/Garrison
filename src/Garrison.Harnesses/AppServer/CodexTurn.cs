namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The parts of a Codex <c>Turn</c> the driver reads.
    /// </summary>
    public class CodexTurn
    {
        #region Public-Members

        /// <summary>
        /// Turn identifier.
        /// </summary>
        [JsonPropertyName("id")]
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Status: completed, interrupted, failed, or inProgress.
        /// </summary>
        [JsonPropertyName("status")]
        public string? Status { get; set; } = null;

        /// <summary>
        /// Error of a failed or interrupted turn, or null.
        /// </summary>
        [JsonPropertyName("error")]
        public CodexTurnError? Error { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;

        #endregion
    }
}
