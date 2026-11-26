namespace Garrison.Core.Requests
{
    /// <summary>
    /// A board member's message to the organization's top agent (AA10.6). The message starts a run on the CEO mandate's
    /// deployment, in a new conversation or the one named.
    /// </summary>
    public class BoardMessageRequest
    {
        /// <summary>
        /// The message. Required, 1 to 32000 characters.
        /// </summary>
        public string? Input { get; set; } = null;

        /// <summary>
        /// Board conversation to continue, or null to start one.
        /// </summary>
        public string? ConversationId { get; set; } = null;
    }
}
