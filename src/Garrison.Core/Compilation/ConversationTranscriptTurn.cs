namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// One earlier turn of a conversation, repeated to a harness that starts a fresh session for the conversation
    /// (a fallback). Exposed to the ConversationFallback prompt as an item of <c>conversation.turns</c> with
    /// <c>turn</c>, <c>input</c>, and <c>output</c>.
    /// </summary>
    public class ConversationTranscriptTurn
    {
        #region Public-Members

        /// <summary>
        /// Turn number, starting at 1. Minimum 1, default 1.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the value is below 1.</exception>
        public int Turn
        {
            get
            {
                return _Turn;
            }
            set
            {
                if (value < 1) throw new ArgumentOutOfRangeException(nameof(Turn), "Turn must be at least 1.");
                _Turn = value;
            }
        }

        /// <summary>
        /// The caller's input for the turn. Never null.
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
        /// The agent's answer for the turn (the run's result text, or its structured output). Never null.
        /// </summary>
        public string Output
        {
            get
            {
                return _Output;
            }
            set
            {
                _Output = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Whether <see cref="Input"/> was cut at the transcript character limit. Exposed as <c>inputTruncated</c>.
        /// </summary>
        public bool InputTruncated { get; set; } = false;

        /// <summary>
        /// Whether <see cref="Output"/> was cut at the transcript character limit. Exposed as <c>outputTruncated</c>.
        /// </summary>
        public bool OutputTruncated { get; set; } = false;

        #endregion

        #region Private-Members

        private int _Turn = 1;
        private string _Input = String.Empty;
        private string _Output = String.Empty;

        #endregion
    }
}
