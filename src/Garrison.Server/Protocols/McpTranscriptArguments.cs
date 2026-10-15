namespace Garrison.Server.Protocols
{
    /// <summary>Typed arguments of garrison_get_run_transcript and garrison_get_conversation_transcript (P12.27).</summary>
    public class McpTranscriptArguments
    {
        /// <summary>Run identifier (run_...). Required by garrison_get_run_transcript.</summary>
        public string? RunId { get; set; } = null;

        /// <summary>Conversation identifier. Required by garrison_get_conversation_transcript.</summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>markdown (default) or json.</summary>
        public string? Format { get; set; } = null;

        /// <summary>Whether thinking events are included. Default false.</summary>
        public bool IncludeThinking { get; set; } = false;
    }
}
