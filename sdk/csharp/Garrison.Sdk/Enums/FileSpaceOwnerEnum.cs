namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Owner of a file space addressed by the file spaces client.
    /// </summary>
    public enum FileSpaceOwnerEnum
    {
        /// <summary>
        /// Conversation: the identifier is a conversation identifier.
        /// </summary>
        Conversation,

        /// <summary>
        /// Run: the identifier is a run identifier; the run's file space is used.
        /// </summary>
        Run
    }
}
