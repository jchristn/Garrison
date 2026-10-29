namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A files.changed event of an app conversation. The first event of a stream lists every current file. Not thread-safe.
    /// </summary>
    public class AppFilesChanged
    {
        /// <summary>
        /// Conversation identifier. Never null.
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
        /// Changed files. Never null.
        /// </summary>
        public List<AppFileChange> Changed
        {
            get
            {
                return _Changed;
            }
            set
            {
                _Changed = value ?? new List<AppFileChange>();
            }
        }

        private string _ConversationId = String.Empty;
        private List<AppFileChange> _Changed = new List<AppFileChange>();
    }
}
