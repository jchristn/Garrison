namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// An app conversation as its owner sees it. Turns is empty in listings and filled when one conversation is read.
    /// Not thread-safe.
    /// </summary>
    public class AppConversationView
    {
        /// <summary>
        /// Conversation identifier. Never null.
        /// </summary>
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
        /// Title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Number of turns.
        /// </summary>
        public int TurnCount { get; set; } = 0;

        /// <summary>
        /// True while a turn runs; a new message is refused with 409 ConversationBusy until it finishes.
        /// </summary>
        public bool Busy { get; set; } = false;

        /// <summary>
        /// Run identifier of the latest turn, or null.
        /// </summary>
        public string? LastRunId { get; set; } = null;

        /// <summary>
        /// When the conversation started, UTC.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Latest activity, UTC, or null.
        /// </summary>
        public DateTime? LastActivityUtc { get; set; } = null;

        /// <summary>
        /// Turns, oldest first. Never null.
        /// </summary>
        public List<AppTurnView> Turns
        {
            get
            {
                return _Turns;
            }
            set
            {
                _Turns = value ?? new List<AppTurnView>();
            }
        }

        private string _Id = String.Empty;
        private List<AppTurnView> _Turns = new List<AppTurnView>();
    }
}
