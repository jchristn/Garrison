namespace Garrison.Core.Requests
{
    /// <summary>
    /// Answer to an escalation (AA2, AA-039). With options, Choice is required and must be one of their keys; without
    /// options, Text is required. Text may accompany a choice.
    /// </summary>
    public class EscalationAnswerRequest
    {
        /// <summary>
        /// The chosen option key, or null.
        /// </summary>
        public string? Choice { get; set; } = null;

        /// <summary>
        /// Answer text, or null. At most 8000 characters.
        /// </summary>
        public string? Text { get; set; } = null;
    }
}
