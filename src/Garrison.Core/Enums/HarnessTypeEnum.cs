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
        ProviderApi,

        /// <summary>
        /// OpenCode (<c>opencode run --format json</c>).
        /// </summary>
        OpenCode,

        /// <summary>
        /// Pi coding agent (<c>pi --mode json</c>).
        /// </summary>
        Pi
    }
}
