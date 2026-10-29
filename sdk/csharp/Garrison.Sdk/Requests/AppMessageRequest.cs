namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Body of an app gateway message: the text an end user sends to the app's entry agent. Not thread-safe.
    /// </summary>
    public class AppMessageRequest
    {
        /// <summary>
        /// Message text. Never null.
        /// </summary>
        public string Message
        {
            get
            {
                return _Message;
            }
            set
            {
                _Message = value ?? String.Empty;
            }
        }

        private string _Message = String.Empty;
    }
}
