namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Conversation inputs for compiling a conversation turn: the earlier turns, used only when the turn falls back to a
    /// fresh harness session (the run has a <c>conversationFallbackReason</c>). Exposed to templates under
    /// <c>conversation.*</c>.
    /// </summary>
    public class CompilationConversation
    {
        #region Public-Members

        /// <summary>
        /// Earlier successful turns, oldest first, already trimmed to the cluster's transcript limits. Never null.
        /// </summary>
        public List<ConversationTranscriptTurn> Turns
        {
            get
            {
                return _Turns;
            }
            set
            {
                _Turns = value ?? new List<ConversationTranscriptTurn>();
            }
        }

        /// <summary>
        /// Earlier turns left out of <see cref="Turns"/> because of the transcript turn limit. Minimum 0.
        /// </summary>
        public int OmittedTurns
        {
            get
            {
                return _OmittedTurns;
            }
            set
            {
                _OmittedTurns = Math.Max(0, value);
            }
        }

        #endregion

        #region Private-Members

        private List<ConversationTranscriptTurn> _Turns = new List<ConversationTranscriptTurn>();
        private int _OmittedTurns = 0;

        #endregion
    }
}
