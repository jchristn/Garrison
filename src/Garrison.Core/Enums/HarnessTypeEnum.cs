namespace Garrison.Core.Enums
{
    /// <summary>
    /// Supported agent harness families.
    /// </summary>
    public enum HarnessTypeEnum
    {
        /// <summary>
        /// ClaudeCode.
        /// </summary>
        ClaudeCode,

        /// <summary>
        /// Codex.
        /// </summary>
        Codex,

        /// <summary>
        /// Mux.
        /// </summary>
        Mux,

        /// <summary>
        /// GeminiCli.
        /// </summary>
        GeminiCli,

        /// <summary>
        /// Generic.
        /// </summary>
        Generic,

        /// <summary>Bundled optional provider API agent loop.</summary>
        ProviderApi
    }
}
