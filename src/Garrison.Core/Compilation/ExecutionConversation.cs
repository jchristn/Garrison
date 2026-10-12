namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Conversation settings for a Process run that is a conversation turn. The worker keeps the conversation's work and
    /// home directories under a directory named after the conversation (instead of the run) so the next turn on the same
    /// node can resume the harness session in them. Null in specs of runs outside a conversation and of KubernetesJob
    /// runs, whose run pods keep no state between turns.
    /// </summary>
    public class ExecutionConversation
    {
        #region Public-Members

        /// <summary>
        /// Conversation identifier; the worker's directory name for the conversation. Required.
        /// </summary>
        /// <exception cref="ArgumentNullException">Thrown when the value is null or empty.</exception>
        public string ConversationId
        {
            get
            {
                return _ConversationId;
            }
            set
            {
                if (String.IsNullOrEmpty(value)) throw new ArgumentNullException(nameof(ConversationId));
                _ConversationId = value;
            }
        }

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
        /// Whether the turn resumes a harness session in the conversation's existing directories. When true and the
        /// directories are missing, the worker reports outcome ConversationStateLost without starting the harness, and
        /// the control plane requeues the turn as a fallback. When false, the worker starts from fresh directories,
        /// replacing any it still has for the conversation. Default false.
        /// </summary>
        public bool Resume { get; set; } = false;

        #endregion

        #region Private-Members

        private string _ConversationId = "conversation";
        private int _Turn = 1;

        #endregion
    }
}
