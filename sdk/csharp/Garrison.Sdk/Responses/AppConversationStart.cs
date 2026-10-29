namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// Answer to starting an app conversation: the new conversation and its first turn. Not thread-safe.
    /// </summary>
    public class AppConversationStart
    {
        /// <summary>
        /// Identifier of the new conversation. Never null.
        /// </summary>
        public string ConversationId
        {
            get
            {
                return _ConversationId;
            }
            set
            {
                _ConversationId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The first turn. Never null.
        /// </summary>
        public AppTurnView Turn
        {
            get
            {
                return _Turn;
            }
            set
            {
                _Turn = value ?? new AppTurnView();
            }
        }

        private string _ConversationId = String.Empty;
        private AppTurnView _Turn = new AppTurnView();
    }
}
