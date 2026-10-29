namespace Garrison.Core.Requests
{
    /// <summary>
    /// Body of POST .../studio/drafts (AD7.2).
    /// </summary>
    public class StudioDraftCreateRequest
    {
        /// <summary>
        /// Title, up to 256 characters. Default: the app name, or "Untitled draft".
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// An existing app to start from: the draft gets its export with every record it needs. Null starts empty.
        /// </summary>
        public string? FromApp { get; set; } = null;

        /// <summary>
        /// The architect conversation working on the draft, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;
    }
}
