namespace Garrison.Core.Enums
{
    /// <summary>
    /// Kind of secret.
    /// </summary>
    public enum SecretKindEnum
    {
        /// <summary>
        /// AnthropicApiKey.
        /// </summary>
        AnthropicApiKey,

        /// <summary>
        /// ClaudeCodeOAuthToken.
        /// </summary>
        ClaudeCodeOAuthToken,

        /// <summary>
        /// OpenAiApiKey.
        /// </summary>
        OpenAiApiKey,

        /// <summary>
        /// CodexAuthJson.
        /// </summary>
        CodexAuthJson,

        /// <summary>
        /// GeminiApiKey.
        /// </summary>
        GeminiApiKey,

        /// <summary>
        /// GenericEnv.
        /// </summary>
        GenericEnv,

        /// <summary>
        /// GenericFile.
        /// </summary>
        GenericFile,

        /// <summary>
        /// BearerToken.
        /// </summary>
        BearerToken,

        /// <summary>
        /// BasicAuth.
        /// </summary>
        BasicAuth,

        /// <summary>
        /// GitCredential.
        /// </summary>
        GitCredential,

        /// <summary>Short-lived revocable credential minted by the operator-configured HTTP broker.</summary>
        LeaseBroker
    }
}
