namespace Garrison.Core.Responses
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One turn of an app conversation as its end user sees it (AD6.6).
    /// </summary>
    public class AppTurnView
    {
        /// <summary>
        /// Run of the turn.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Turn number, from 1.
        /// </summary>
        public int Turn { get; set; } = 0;

        /// <summary>
        /// The user's message.
        /// </summary>
        public string Message { get; set; } = String.Empty;

        /// <summary>
        /// Run status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// The agent's answer, or null while it works.
        /// </summary>
        public string? Answer { get; set; } = null;

        /// <summary>
        /// A short error for a failed turn, or null.
        /// </summary>
        public string? Error { get; set; } = null;

        /// <summary>
        /// Whether the agent waits for an operator to approve a tool call.
        /// </summary>
        public bool AwaitingApproval { get; set; } = false;

        /// <summary>
        /// When the turn started (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the turn finished (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;
    }
}
