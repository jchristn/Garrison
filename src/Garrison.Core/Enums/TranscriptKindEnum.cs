namespace Garrison.Core.Enums
{
    /// <summary>
    /// What a transcript covers (P12.27).
    /// </summary>
    public enum TranscriptKindEnum
    {
        /// <summary>
        /// One run.
        /// </summary>
        Run,

        /// <summary>
        /// Every turn of a conversation, oldest first.
        /// </summary>
        Conversation
    }
}
