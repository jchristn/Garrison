namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Rename one of the session owner's conversations in an app.
    /// </summary>
    public class AppConversationRenameRequest
    {
        #region Public-Members

        /// <summary>
        /// New title: its first line, trimmed, at most 200 characters. Required.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public AppConversationRenameRequest()
        {
        }

        #endregion
    }
}
