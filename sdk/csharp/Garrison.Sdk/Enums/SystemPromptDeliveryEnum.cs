namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// How the rendered system prompt reaches the harness.
    /// </summary>
    public enum SystemPromptDeliveryEnum
    {
        /// <summary>
        /// File.
        /// </summary>
        File,

        /// <summary>
        /// Argument.
        /// </summary>
        Argument,

        /// <summary>
        /// Environment.
        /// </summary>
        Environment,

        /// <summary>
        /// PrependToPrompt.
        /// </summary>
        PrependToPrompt,

        /// <summary>
        /// None.
        /// </summary>
        None
    }
}
