namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An app conversation as its end user sees it (AD6.6).
    /// </summary>
    public class AppConversationView
    {
        /// <summary>
        /// Conversation identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Turns so far.
        /// </summary>
        public int TurnCount { get; set; } = 0;

        /// <summary>
        /// Whether a turn is still running.
        /// </summary>
        public bool Busy { get; set; } = false;

        /// <summary>
        /// Run of the latest turn, or null.
        /// </summary>
        public string? LastRunId { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last activity (UTC), or null.
        /// </summary>
        public DateTime? LastActivityUtc { get; set; } = null;

        /// <summary>
        /// Turns, oldest first. Empty in listings.
        /// </summary>
        public List<AppTurnView> Turns { get; set; } = new List<AppTurnView>();
    }
}
