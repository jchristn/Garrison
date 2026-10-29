namespace Garrison.Sdk.Responses
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One turn of an app conversation as an end user sees it. Not thread-safe.
    /// </summary>
    public class AppTurnView
    {
        /// <summary>
        /// Identifier of the run behind the turn. Never null.
        /// </summary>
        public string RunId
        {
            get
            {
                return _RunId;
            }
            set
            {
                _RunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Turn number, starting at 1.
        /// </summary>
        public int Turn { get; set; } = 0;

        /// <summary>
        /// The end user's message. Never null.
        /// </summary>
        public string Message
        {
            get
            {
                return _Message;
            }
            set
            {
                _Message = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Run status of the turn.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// The entry agent's answer, or null until the turn succeeds.
        /// </summary>
        public string? Answer { get; set; } = null;

        /// <summary>
        /// Error text when the turn failed, or null.
        /// </summary>
        public string? Error { get; set; } = null;

        /// <summary>
        /// True while the turn waits for an approval.
        /// </summary>
        public bool AwaitingApproval { get; set; } = false;

        /// <summary>
        /// When the turn started, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the turn finished, UTC, or null while it runs.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        private string _RunId = String.Empty;
        private string _Message = String.Empty;
    }
}
