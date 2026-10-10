namespace Garrison.Core.Enums
{
    /// <summary>
    /// How the rendered task prompt reaches the harness.
    /// </summary>
    public enum PromptDeliveryEnum
    {
        /// <summary>
        /// Stdin.
        /// </summary>
        Stdin,

        /// <summary>
        /// Argument.
        /// </summary>
        Argument,

        /// <summary>
        /// File.
        /// </summary>
        File
    }
}
