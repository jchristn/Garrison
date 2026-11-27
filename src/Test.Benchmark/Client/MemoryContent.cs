namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Body of GET .../memory/entries/{id}/content: an entry's text with its metadata.
    /// </summary>
    public class MemoryContent
    {
        /// <summary>
        /// Text.
        /// </summary>
        public string? Value { get; set; } = null;

        /// <summary>
        /// Metadata.
        /// </summary>
        public MemoryEntry? Entry { get; set; } = null;
    }
}
