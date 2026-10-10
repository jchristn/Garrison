namespace Garrison.Harnesses.Parsers
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// Payload of a Codex session record, reduced to the fields Garrison reads.
    /// </summary>
    public class CodexSessionPayload
    {
        /// <summary>
        /// Model used for the turn (present on turn_context records).
        /// </summary>
        [JsonPropertyName("model")]
        public string? Model { get; set; } = null;
    }
}
