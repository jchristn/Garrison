namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Body of an app gateway conversation rename: the new title (the server keeps its first line, trimmed, at most 200 characters). Not thread-safe.
    /// </summary>
    public class AppConversationRenameRequest
    {
        /// <summary>
        /// Title. Never null.
        /// </summary>
        public string Title
        {
            get
            {
                return _Title;
            }
            set
            {
                _Title = value ?? String.Empty;
            }
        }

        private string _Title = String.Empty;
    }
}
