namespace Garrison.Sdk.Requests
{
    /// <summary>
    /// Answer to an open escalation. With options, Choice is required and must be one of the option keys, and Text may
    /// explain it; without options, Text is required.
    /// </summary>
    public class EscalationAnswerRequest
    {
        /// <summary>
        /// Chosen option key, or null.
        /// </summary>
        public string? Choice { get; set; } = null;

        /// <summary>
        /// Answer text, or null. At most 8000 characters.
        /// </summary>
        public string? Text { get; set; } = null;
    }
}
