namespace Garrison.Core.Memory
{
    using Garrison.Core.Models;

    /// <summary>
    /// A scoped memory read (AA4): the entry's metadata and its text. The text is untrusted data written by an agent or a
    /// person (AA-025). Not thread-safe.
    /// </summary>
    public class MemoryReadResult
    {
        /// <summary>
        /// Whether the entry exists.
        /// </summary>
        public bool Found { get; set; } = false;

        /// <summary>
        /// Entry metadata, or null when not found.
        /// </summary>
        public MemoryEntry? Entry { get; set; } = null;

        /// <summary>
        /// Entry text, or null when not found.
        /// </summary>
        public string? Value { get; set; } = null;
    }
}
