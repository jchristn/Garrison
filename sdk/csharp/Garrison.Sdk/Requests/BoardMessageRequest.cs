namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// A message from the board to the CEO (AA10): runs on the CEO mandate's deployment as the calling person.
    /// </summary>
    public class BoardMessageRequest
    {
        /// <summary>
        /// The message, 1 to 32000 characters. Required.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Conversation to continue, or null to start a new one.
        /// </summary>
        public string? ConversationId { get; set; } = null;
    }
}
