namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Start a studio draft, empty or from an existing app. Not thread-safe.
    /// </summary>
    public class StudioDraftCreateRequest
    {
        #region Public-Members

        /// <summary>
        /// Title, or null for a generated one.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// App identifier or name to start from, or null for an empty draft. The app is exported with everything it
        /// references (members, their deployments, prompt templates, assets, and so on), one item per document. Needs Read
        /// on AgenticApp.
        /// </summary>
        public string? FromApp { get; set; } = null;

        /// <summary>
        /// The conversation the draft belongs to, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        #endregion
    }
}
