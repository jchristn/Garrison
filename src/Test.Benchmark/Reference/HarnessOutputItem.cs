namespace Garrison.Benchmark.Reference
{
    using System;

    /// <summary>
    /// Codex JSONL item.
    /// </summary>
    public class HarnessOutputItem
    {
        /// <summary>
        /// Item type, for example agent_message or reasoning.
        /// </summary>
        public string? Type { get; set; }

        /// <summary>
        /// Item text.
        /// </summary>
        public string? Text { get; set; }
    }
}
