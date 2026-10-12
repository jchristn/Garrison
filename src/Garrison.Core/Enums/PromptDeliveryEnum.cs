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
        File,

        /// <summary>
        /// Codex app-server: the worker drives <c>codex app-server</c> over JSON-RPC on stdin and stdout, and sends the
        /// prompt as the input of one turn (<c>turn/start</c>). Stdin stays open until the turn completes, so Codex
        /// output streams as it is generated.
        /// </summary>
        CodexAppServer
    }
}
