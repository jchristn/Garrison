namespace Garrison.Benchmark.Reference
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One JSON line of fake harness output in any of its formats: Claude stream-json (type result carries the
    /// answer), Codex JSONL (an item.completed agent_message carries it), or Mux JSONL (assistant_text events carry it,
    /// run_completed carries the status). Fields a line does not have stay null.
    /// </summary>
    public class HarnessOutputLine
    {
        /// <summary>
        /// Claude and Codex line type, for example result or item.completed.
        /// </summary>
        public string? Type { get; set; }

        /// <summary>
        /// Claude: whether the harness reported an error.
        /// </summary>
        [JsonPropertyName("is_error")]
        public bool IsError { get; set; }

        /// <summary>
        /// Claude: the answer.
        /// </summary>
        public string? Result { get; set; }

        /// <summary>
        /// Codex: the completed item.
        /// </summary>
        public HarnessOutputItem? Item { get; set; }

        /// <summary>
        /// Mux: event type, for example assistant_text or run_completed.
        /// </summary>
        public string? EventType { get; set; }

        /// <summary>
        /// Mux: text of an assistant_text event.
        /// </summary>
        public string? Text { get; set; }

        /// <summary>
        /// Mux: run status of run_completed, for example completed.
        /// </summary>
        public string? Status { get; set; }
    }
}
