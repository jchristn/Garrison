namespace Garrison.Harnesses.Parsers
{
    using System.Text.Json.Serialization;

    /// <summary>
    /// One line of a Codex session file, reduced to the fields Garrison reads.
    /// </summary>
    public class CodexSessionLine
    {
        /// <summary>
        /// Record type, for example session_meta or turn_context.
        /// </summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; } = null;

        /// <summary>
        /// Record payload.
        /// </summary>
        [JsonPropertyName("payload")]
        public CodexSessionPayload? Payload { get; set; } = null;
    }
}
