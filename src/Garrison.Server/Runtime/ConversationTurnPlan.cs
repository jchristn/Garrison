namespace Garrison.Server.Runtime
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// A conversation turn being created: the conversation it belongs to, whether that conversation is new, the active
    /// run the turn replaced (to give the turn back if the run is never stored), and how the harness session starts.
    /// </summary>
    public class ConversationTurnPlan
    {
        #region Public-Members

        /// <summary>
        /// Conversation. Never null.
        /// </summary>
        public Conversation Conversation
        {
            get
            {
                return _Conversation;
            }
            set
            {
                _Conversation = value ?? throw new ArgumentNullException(nameof(Conversation));
            }
        }

        /// <summary>
        /// Whether the conversation is created by this turn (not stored yet until the turn begins).
        /// </summary>
        public bool IsNew { get; set; } = false;

        /// <summary>
        /// Active run the conversation had before this turn acquired it (finished or missing), or null.
        /// </summary>
        public string? PreviousActiveRunId { get; set; } = null;

        /// <summary>
        /// Whether this turn holds the conversation (the compare-and-set on its active run succeeded).
        /// </summary>
        public bool Acquired { get; set; } = false;

        /// <summary>
        /// How the harness session starts, used as the mode label on the conversation turn metric: first, resume, or
        /// fallback. Default first.
        /// </summary>
        public string Mode
        {
            get
            {
                return _Mode;
            }
            set
            {
                _Mode = String.IsNullOrEmpty(value) ? "first" : value;
            }
        }

        #endregion

        #region Private-Members

        private Conversation _Conversation = new Conversation();
        private string _Mode = "first";

        #endregion

        /// <summary>
        /// Studio draft to link to a conversation this run starts (AD7.10), or null.
        /// </summary>
        public string? StudioDraftId { get; set; } = null;
    }
}
