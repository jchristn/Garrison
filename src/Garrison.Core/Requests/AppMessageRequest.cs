namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// A message an end user sends through an app (AD6.6).
    /// </summary>
    public class AppMessageRequest
    {
        /// <summary>
        /// The message. Required; at most the cluster's input size limit.
        /// </summary>
        public string Message { get; set; } = String.Empty;
    }
}
