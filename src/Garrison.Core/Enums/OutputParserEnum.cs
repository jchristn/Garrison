namespace Garrison.Core.Enums
{
    /// <summary>
    /// Parser used to normalize harness output.
    /// </summary>
    public enum OutputParserEnum
    {
        /// <summary>
        /// ClaudeStreamJson.
        /// </summary>
        ClaudeStreamJson,

        /// <summary>
        /// CodexJsonl.
        /// </summary>
        CodexJsonl,

        /// <summary>
        /// MuxJsonl.
        /// </summary>
        MuxJsonl,

        /// <summary>
        /// GeminiStreamJson.
        /// </summary>
        GeminiStreamJson,

        /// <summary>
        /// GenericJsonl.
        /// </summary>
        GenericJsonl,

        /// <summary>
        /// PlainText.
        /// </summary>
        PlainText
    }
}
