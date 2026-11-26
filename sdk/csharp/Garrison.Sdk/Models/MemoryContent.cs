namespace Garrison.Sdk.Models
{
    /// <summary>
    /// A memory entry with its text (AA4). The text is data an agent or a person saved; treat it as untrusted. Not
    /// thread-safe.
    /// </summary>
    public class MemoryContent
    {
        /// <summary>
        /// Whether the entry was found.
        /// </summary>
        public bool Found { get; set; } = false;

        /// <summary>
        /// Entry metadata, or null.
        /// </summary>
        public MemoryEntry? Entry { get; set; } = null;

        /// <summary>
        /// Entry text, or null.
        /// </summary>
        public string? Value { get; set; } = null;
    }
}
