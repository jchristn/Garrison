namespace Garrison.Sdk.Enums
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
        PlainText,

        /// <summary>
        /// CodexAppServer: JSON-RPC messages from <c>codex app-server</c> (agent message and reasoning deltas, items,
        /// token usage, turn completion).
        /// </summary>
        CodexAppServer,

        /// <summary>Bundled direct provider API harness JSON-lines events.</summary>
        ProviderApiJsonl
    }
}
